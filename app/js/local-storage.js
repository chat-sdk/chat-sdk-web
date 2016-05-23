/**
 * Created by benjaminsmiley-andrews on 22/12/14.
 */
var myApp = angular.module('myApp.localStorage', []);

myApp.factory('WebStorage', ['$window', function ($window) {
    'use strict';
    var WebStorage = {

        ls: null,
        key: 'cc_web_storage_',
        store: {},
        cacheCleared: false,

        init: function () {
            var localStorage = this.localStorage();
            if(!localStorage) {
                return;
            }

            // Load the items from the store
            var key = null;
            for (var i = 0, k; i < localStorage.length; i++) {
                key = localStorage.key(i);
                if(key.slice(0, this.key.length) === this.key) {
                    this.store[key.slice(this.key.length)] = angular.fromJson(localStorage.getItem(key));
                }
            }

            return this;
        },

        sync: function () {
            angular.forEach(this.store, (function (value, key) {
                if(angular.isDefined(value) && key.length && '$' !== key[0]) {
                    try {
                        this.localStorage().setItem(this.key + key, angular.toJson(value));
                    }
                    catch(e) {
                        // TODO: Handle this
                        console.log("Warning! Storage error " + e.description);
                    }
                }
            }).bind(this));
        },

        setProperty: function (key, value) {
            if(key && key.length && key[0] !== '$') {
                this.store[key] = value;
            }
        },

        getProperty: function (key) {
            return this.store[key];
        },

        localStorage: function () {
            if(!this.ls) {
                this.ls = $window['localStorage'];
            }
            return this.ls;
        },

        localStorageSupported: function () {
            return this.localStorage() != null;
        }


    };
    return WebStorage.init();
}]);

myApp.factory('LocalStorage', ['$rootScope', '$timeout', 'WebStorage', 'Utils', function ($rootScope, $timeout, WebStorage, Utils) {
    var LocalStorage = {

        mainMinimizedKey: 'cc_main_minimized',
        moreMinimizedKey: 'cc_more_minimized',

        // Tokens
        tokenKey: 'cc_token',
        UIDKey: 'cc_uid',
        tokenExpiryKey: 'cc_token_expiry',

        // API Details
        apiDetailsKey: 'cc_api_details',

        roomsKey: 'cc_rooms',
        usersKey: 'cc_users',

        onlineCountKey: 'cc_online_count',
        timestampKey: 'cc_timestamp',

        lastVisited: 'cc_last_visited',

        rooms: {},
        users: {},

        init: function () {
            var rooms = this.getProperty(this.roomsKey);

            if(rooms && rooms.length) {
                var room = null;
                for(var i = 0; i < rooms.length; i++) {
                    room = rooms[i];
                    this.rooms[room.meta.rid] = room;
                }
            }

            var sus = this.getProperty(this.usersKey);
            if(sus && sus.length) {
                var su = null;

                for(i = 0; i < sus.length; i++) {
                    su = sus[i];
                    this.users[su.meta.uid] = su;
                }
            }

            return this;
        },

        isOffline: function () {
            return this.getProperty('cc_offline');
        },

        setOffline: function (offline) {
            this.setProperty('cc_offline', offline);
        },

        isMuted: function () {
            return this.getProperty('cc_muted');
        },

        setMuted: function (muted) {
            this.setProperty('cc_muted', muted);
        },

        storeRooms: function (rooms) {
            var room;
            var sr = [];
            for(var key in rooms) {
                if(rooms.hasOwnProperty(key)) {
                    room = rooms[key];
                    sr.push(room.serialize());
                }
            }
            this.setProperty(this.roomsKey, sr);
        },

        storeUsers: function (users) {
            var user;
            var su = [];
            for(var key in users) {
                if(users.hasOwnProperty(key)) {
                    user = users[key];
                    su.push(user.serialize());
                }
            }
            this.setProperty(this.usersKey, su);
        },

        sync: function () {
            WebStorage.sync();
        },

        updateRoomFromStore: function (room) {
            var sr = this.rooms[room.meta.rid];
            if(sr) {
                room.deserialize(sr);
            }
        },

        updateUserFromStore: function (user) {
            var su = this.users[user.meta.uid];
            if(su) {
                user.deserialize(su);
                return true;
            }
            return false;
        },

        getLastVisited: function () {
            return this.getProperty(this.lastVisited);
        },

        setLastVisited: function () {
            this.setProperty(this.lastVisited, new Date().getTime());
        },

        setProperty: function(key, value) {
            if(!this.cacheCleared) {
                WebStorage.setProperty(key, value);
            }
        },

        getProperty: function (key) {
            var c = WebStorage.getProperty(key);

            if(!Utils.unORNull(c)) {
                var e;
                try {
                    e = eval(c);
                }
                catch (error) {
                    e = c;
                }
                return e;
            }
            else {
                return null;
            }
        },

        removeProperty: function (key) {
            this.setProperty(key, null);
        },

        clearCache: function () {
            this.removeProperty(this.roomsKey);
            this.removeProperty(this.usersKey);
            this.clearToken();
            this.cacheCleared = true;
        },

        clearCacheWithTimestamp: function (timestamp) {
            if(!timestamp) return;

            var currentTimestamp = this.getProperty(this.timestampKey);
            if(!currentTimestamp || timestamp > currentTimestamp) {
                this.removeProperty(this.roomsKey);
                this.removeProperty(this.usersKey);
                this.clearToken();
                this.setProperty(this.timestampKey, timestamp);
                this.cacheCleared = true;
            }
        },

        clearToken: function () {
            this.removeProperty(this.tokenKey);
            this.removeProperty(this.UIDKey);
            this.removeProperty(this.tokenExpiryKey);
            this.removeProperty(this.apiDetailsKey);
        }
    };
    return LocalStorage.init();
}]);