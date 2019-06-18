import * as angular from 'angular'
import * as firebase from 'firebase';

import {VisibilityChangedNotification} from "../keys/notification-keys";
import {UserStatusMember} from "../keys/user-status";
/**
 * The presence service handles the user's online / offline
 * status
 * We need to call visibility to make sure it's initilized
 */
angular.module('myApp.services').factory('Presence', ['$rootScope', '$timeout', 'Visibility', 'Config', 'Cache', 'Paths', 'LocalStorage', 'BeforeUnload', '$q',
    function ($rootScope, $timeout, Visibility, Config, Cache, Paths, LocalStorage, BeforeUnload, $q) {
        var Presence = {

            user: null,
            inactiveTimerPromise: null,

            // This gets increased when we log on and decreased when we log off
            // it's a safeguard to make sure we can't increase the counter by
            // more than one
            //onlineCount: 0,

            init: function () {
                //this.onlineCount = LocalStorage.getProperty(LocalStorage.onlineCountKey);

                //BeforeUnload.addListener(this);

                return this;
            },

//        beforeUnload: function () {
//            //LocalStorage.setProperty(LocalStorage.onlineCountKey, this.onlineCount);
//            this.goOffline();
//        },

            // Initialize the visibility service
            start: function (user) {

                this.user = user;

                // Take the user online
                this.goOnline();

                $rootScope.$on(VisibilityChangedNotification, (function (event, hidden) {


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
                        this.inactiveTimerPromise = $timeout((function () {
                            this.goOffline();
                        }).bind(this), 1000 * 60 * Config.inactivityTimeout);
                    }
                }).bind(this));

            },

            stop: function () {
                this.user = null;
            },

            goOffline: function () {
                firebase.database().goOffline();
//            this.onlineCounterMinusOne().then(function () {
//
//            });
            },

            goOnline: function () {
                firebase.database().goOnline();
                //this.onlineCounterPlusOne();
                this.update();
            },

            update: function () {

                var deferred = $q.defer();

                if(this.user) {
                    var uid = this.user.uid();
                    if (uid) {

                        if(Config.onlineUsersEnabled) {
                            var ref = Paths.onlineUserRef(uid);

                            ref.onDisconnect().remove();

                            ref.setWithPriority({
                                uid: uid,
                                time: firebase.database.ServerValue.TIMESTAMP
                            }, this.user.getName(), function (error) {
                                if(!error) {
                                    deferred.resolve();
                                }
                                else {
                                    deferred.reject(error);
                                }
                            });
                        }

                        // Also store this information on the user object
                        var userOnlineRef = Paths.userOnlineRef(uid);
                        userOnlineRef.set(true);
                        userOnlineRef.onDisconnect().set(false);

                        var promises = [
                            deferred.promise
                        ];

                        // Go online for the public rooms
                        var rooms = Cache.rooms;
                        var room;
                        for(var i = 0; i < rooms.length; i++) {
                            // TRAFFIC
                            // If this is a public room we would have removed it when we logged off
                            // We need to set ourself as a member again
                            room = rooms[i];
                            if(room.isPublic())
                                promises.push(room.join(UserStatusMember));

                        }

                        return $q.all(promises);
                    }
                }
                deferred.resolve(null);
                return deferred.promise;
            }
        };

        return Presence.init();
    }]);