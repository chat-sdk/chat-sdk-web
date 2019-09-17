import * as angular from 'angular';

import { Utils } from '../services/utils';
import { IRootScope } from '../interfaces/root-scope';
import { IConfig, SetBy } from '../services/config';
import { ILocalStorage } from '../persistence/local-storage';

export interface ISingleSignOn {

}

class SingleSignOn implements ISingleSignOn {

    static $inject = ['$rootScope', '$q', '$http', 'Config', 'LocalStorage'];

    defaultError = 'Unable to reach server';
    busy = false;

    constructor(
        private $rootScope: IRootScope,
        private $q: ng.IQService,
        private $http: ng.IHttpService,
        private Config: IConfig,
        private LocalStorage: ILocalStorage,
    ) { }

    getAPILevel() {
        let level = this.Config.singleSignOnAPILevel;

        if (Utils.unORNull(level)) {
            level = 0;
        }

        return level;
    }

    invalidate() {
        this.LocalStorage.removeProperty(this.LocalStorage.tokenKey);
        this.LocalStorage.removeProperty(this.LocalStorage.tokenExpiryKey);
        this.LocalStorage.removeProperty(this.LocalStorage.UIDKey);
    }

    authenticate() {

        let url = this.Config.singleSignOnURL;

        this.busy = true;
        switch (this.getAPILevel()) {
            case 0:
                return this.authenticateLevel0(url);
                break;
            case 1:
                return this.authenticateLevel1(url);
                break;
        }
    }

    authenticateLevel0(url: string) {

        let deferred = this.$q.defer<any>();

        this.executeRequest<any>({
            method: 'get',
            params: {
                action: 'cc_auth'
            },
            url: url
        }).then((data) => {

            // Update the config object with options that are set
            // These will be overridden by options which are set on the
            // config tab of the user's Firebase install
            this.Config.setConfig(SetBy.SingleSignOn, data);


            this.busy = false;
            deferred.resolve(data);

        }), (error) => {
            this.busy = false;
            deferred.reject(error);
        };

        return deferred.promise;
    }

    authenticateLevel1(url: string, force?: boolean) {

        //this.invalidate();

        let deferred = this.$q.defer<any>();

        // Get the current user's information
        this.getUserUID(url).then((response) => {

            let currentUID = response.uid;

            // Check to see if we have a token cached
            let token = this.LocalStorage.getProperty(this.LocalStorage.tokenKey);
            let expiry = this.LocalStorage.getProperty(this.LocalStorage.tokenExpiryKey);
            let uid = this.LocalStorage.getProperty(this.LocalStorage.UIDKey);

            // If any value isn't set or if the token is expired get a new token
            if (!Utils.unORNull(token) && !Utils.unORNull(expiry) && !Utils.unORNull(uid) && !force) {
                // Date since token was refreshed...
                let timeSince = new Date().getTime() - expiry;
                // Longer than 20 days
                if (timeSince < 60 * 60 * 24 * 20 && uid == currentUID) {

                    this.Config.setConfig(SetBy.SingleSignOn, response);

                    this.busy = false;
                    response['token'] = token;
                    deferred.resolve(response);
                    return deferred.promise;
                }
            }

            this.executeRequest<any>({
                method: 'get',
                params: {
                    action: 'cc_get_token'
                },
                url: url
            }).then((data) => {

                // Cache the token and the user's current ID
                this.LocalStorage.setProperty(this.LocalStorage.tokenKey, data.token);
                this.LocalStorage.setProperty(this.LocalStorage.UIDKey, currentUID);
                this.LocalStorage.setProperty(this.LocalStorage.tokenExpiryKey, new Date().getTime());

                // Update the config object with options that are set
                // These will be overridden by options which are set on the
                // config tab of the user's Firebase install
                this.Config.setConfig(SetBy.SingleSignOn, data);

                this.busy = false;
                deferred.resolve(data);

            }, (error) => {
                this.busy = false;
                deferred.reject(error);
            });

        }, deferred.reject);

        return deferred.promise;
    }

    getUserUID(url: string): ng.IPromise<any> {
        return this.executeRequest({
            method: 'get',
            params: {
                action: 'cc_get_uid'
            },
            url: url
        });
    }

    executeRequest<T>(params: ng.IRequestConfig): ng.IPromise<T> {

        let deferred = this.$q.defer<T>();

        this.$http<T>(params).then((r) => {
            if (r && r.data && r.status == 200) {
                if ((r.data as any).error) {
                    deferred.reject((r.data as any).error);
                }
                else {
                    deferred.resolve(r.data);
                }
            }
            else {
                deferred.reject(this.defaultError);
            }
        }, (error) => {
            deferred.reject(error.message ? error.message : this.defaultError);
        });

        return deferred.promise;
    }

}

angular.module('myApp.services').service('SingleSignOn', SingleSignOn);
