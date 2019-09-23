import * as angular from 'angular';
import * as firebase from 'firebase';

import { UserStatus } from '../keys/user-status';
import { N } from '../keys/notification-keys';
import { IUser } from '../entities/user';
import { IRootScope } from '../interfaces/root-scope';
import { IVisibility } from '../services/visibility';
import { IConfig } from '../services/config';
import { ICache } from '../persistence/cache';
import { IPaths } from './paths';
import { ILocalStorage } from '../persistence/local-storage';
import { IBeforeUnload } from '../services/before-unload';
import { IRoom } from '../entities/room';
/**
 * The presence service handles the user's online / offline
 * status
 * We need to call visibility to make sure it's initilized
 */

export interface IPresence {
    goOnline(): Promise<any>;
    start(user: IUser): void;
    update(): Promise<any>;
}

class Presence implements IPresence {

    static $inject = ['$rootScope', '$timeout', 'Visibility', 'Config', 'Cache', 'Paths', 'LocalStorage', 'BeforeUnload', '$q'];

    user: IUser;
    inactiveTimerPromise: ng.IPromise<void>;

    constructor(
        private $rootScope: IRootScope,
        private $timeout: ng.ITimeoutService,
        private Visibility: IVisibility,
        private Config: IConfig,
        private Cache: ICache,
        private Paths: IPaths,
        private LocalStorage: ILocalStorage,
        private BeforeUnload: IBeforeUnload,
        private $q: ng.IQService,
    ) { }

    start(user: IUser) {

        this.user = user;

        // Take the user online
        this.goOnline();

        this.$rootScope.$on(N.VisibilityChanged, (event, hidden) => {

            if (this.inactiveTimerPromise) {
                this.$timeout.cancel(this.inactiveTimerPromise);
            }

            if (!hidden) {

                // If the user's clicked the screen then cancel the
                // inactivity timer
                this.goOnline();
            }
            else {
                // If the user switches tabs and doesn't enter for
                // 2 minutes take them offline
                this.inactiveTimerPromise = this.$timeout(() => {
                    this.goOffline();
                }, 1000 * 60 * this.Config.inactivityTimeout);
            }
        });

    }

    stop() {
        this.user = null;
    }

    goOffline() {
        firebase.database().goOffline();
    }

    goOnline(): Promise<any> {
        firebase.database().goOnline();
        return this.update();
    }

    update(): Promise<any> {

        const promises = [];

        if (this.user) {
            const uid = this.user.uid();
            if (uid) {

                if (this.Config.onlineUsersEnabled) {
                    const ref = this.Paths.onlineUserRef(uid);

                    promises.push(ref.setWithPriority({
                        time: firebase.database.ServerValue.TIMESTAMP
                    }, this.user.getName()).then(() => {
                        const _ = ref.onDisconnect().remove();
                    }));
                }

                // Also store this information on the user object
                const userOnlineRef = this.Paths.userOnlineRef(uid);
                promises.push(userOnlineRef.set(true).then(() => {
                    const _ = userOnlineRef.onDisconnect().set(false);
                }));

                // Go online for the public rooms
                const rooms = this.Cache.rooms;
                let room: IRoom;
                for (let i = 0; i < rooms.length; i++) {
                    // TRAFFIC
                    // If this is a public room we would have removed it when we logged off
                    // We need to set ourself as a member again
                    room = rooms[i];
                    if (room.isPublic()) {
                        promises.push(room.join(UserStatus.Member));
                    }
                }
            }
        }

        return Promise.all(promises);
    }

}

angular.module('myApp.services').service('Presence', Presence);
