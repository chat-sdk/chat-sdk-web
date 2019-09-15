import * as angular from 'angular';

export interface IWebStorage {
    sync(): void;
    setProperty(key: string, value: any): void;
    getProperty(key: string): any;
}

class WebStorage implements IWebStorage {

    static $inject = ['$window'];

    ls = null;
    key = 'cc_web_storage_';
    store = {};
    cacheCleared = false;

    constructor (private $window: ng.IWindowService) {
        let localStorage = this.localStorage();
        if (!localStorage) {
            return;
        }

        // Load the items from the store
        let key = null;
        for (let i = 0, k; i < localStorage.length; i++) {
            key = localStorage.key(i);
            if (key.slice(0, this.key.length) === this.key) {
                this.store[key.slice(this.key.length)] = angular.fromJson(localStorage.getItem(key));
            }
        }
    }

    sync() {
        for(let key in this.store) {
            if (this.store.hasOwnProperty(key)) {
                const value = this.store[key];
                if (angular.isDefined(value) && key.length && '$' !== key[0]) {
                    try {
                        this.localStorage().setItem(this.key + key, angular.toJson(value));
                    }
                    catch(e) {
                        // TODO: Handle this
                        console.log("Warning! Storage error " + e.description);
                    }
                }
            }
        }
    }

    setProperty(key: string, value: any) {
        if (key && key.length && key[0] !== '$') {
            this.store[key] = value;
        }
    }

    getProperty(key: string): any {
        return this.store[key];
    }

    localStorage() {
        if (!this.ls) {
            this.ls = this.$window['localStorage'];
        }
        return this.ls;
    }

    localStorageSupported(): boolean {
        return this.localStorage() != null;
    }

}

angular.module('myApp.services').service('WebStorage', WebStorage);
