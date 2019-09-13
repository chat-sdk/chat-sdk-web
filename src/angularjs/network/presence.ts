import * as angular from 'angular'
import * as firebase from 'firebase';


import {UserStatus} from "../keys/user-status";
import {N} from "../keys/notification-keys";
import { IUser } from '../entities/user';
/**
 * The presence service handles the user's online / offline
 * status
 * We need to call visibility to make sure it's initilized
 */

export interface IPresence {
    start(user: IUser): void;
    update(): Promise<any>;
}

angular.module('myApp.services').factory('Presence', ['$rootScope', '$timeout', 'Visibility', 'Config', 'Cache', 'Paths', 'LocalStorage', 'BeforeUnload', '$q',
    function ($rootScope, $timeout, Visibility, Config, Cache, Paths, LocalStorage, BeforeUnload, $q) {
        let Presence = {

            user: null,
            inactiveTimerPromise: null,

            init: function () {
                return this;
            },

            // Initialize the visibility service
            start: function (user): void {

                this.user = user;

                // Take the user online
                this.goOnline();

                $rootScope.$on(N.VisibilityChanged, (event, hidden) => {

                    if(this.inactiveTimerPromise) {
                        $timeout.cancel(this.inactiveTimerPromise);
                    }

                    if(!hidden) {

                        // If the user's clicked the screen then cancel the
                        // inactivity timer
                        this.goOnline();
                    }
                    else {
                        // If the user switches tabs and doesn't enter for
                        // 2 minutes take them offline
                        this.inactiveTimerPromise = $timeout(() => {
                            this.goOffline();
                        }, 1000 * 60 * Config.inactivityTimeout);
                    }
                });

            },

            stop: function () {
                this.user = null;
            },

            goOffline: function () {
                firebase.database().goOffline();
            },

            goOnline: function (): Promise<any> {
                firebase.database().goOnline();
                return this.update();
            },

            update: function (): Promise<any> {

                const promises = [];

                if(this.user) {
                    const uid = this.user.uid();
                    if (uid) {

                        if(Config.onlineUsersEnabled) {
                            const ref = Paths.onlineUserRef(uid);

                            promises.push(ref.setWithPriority({
                                time: firebase.database.ServerValue.TIMESTAMP
                            }, this.user.getName()).then(() => {
                                const _ = ref.onDisconnect().remove();
                            }));
                        }

                        // Also store this information on the user object
                        const userOnlineRef = Paths.userOnlineRef(uid);
                        promises.push(userOnlineRef.set(true).then(() => {
                            const _ = userOnlineRef.onDisconnect().set(false);
                        }));

                        // Go online for the public rooms
                        const rooms = Cache.rooms;
                        let room;
                        for(let i = 0; i < rooms.length; i++) {
                            // TRAFFIC
                            // If this is a public room we would have removed it when we logged off
                            // We need to set ourself as a member again
                            room = rooms[i];
                            if(room.isPublic()) {
                                promises.push(room.join(UserStatus.Member));
                            }
                        }
                    }
                }

                return Promise.all(promises);
            }
        };

        return Presence.init();
    }]);