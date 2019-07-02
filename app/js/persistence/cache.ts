import * as angular from 'angular'
import {UserBlockedNotification, UserUnblockedNotification} from "../keys/notification-keys";
import {IRoom} from "../entities/room";

/**
 * Temporary cache i.e. current rooms etc...
 */

export interface ICache {
    activeRooms(): IRoom []
}

angular.module('myApp.services').factory('Cache', ['$rootScope', '$timeout', 'ArrayUtils', 'Utils', function ($rootScope, $timeout, ArrayUtils, Utils) {
    var Cache = {

        // The user's active rooms
        //
        rooms: [],

        // These are user specific stores
        //onlineUsers: {},
        //friends: {},
        blockedUsers: {},

        init: function () {
            return this;
        },

        /**
         * Rooms
         */

        addRoom: function (room) {
            if(!ArrayUtils.contains(this.rooms, room)) {
                room.isOpen = true;
                this.rooms.push(room);
            }
        },

//        roomExists: function (room) {
//            return ArrayUtils.contains(this.rooms, room);
//        },

        removeRoom: function (room) {
            room.isOpen = false;
            ArrayUtils.remove(this.rooms, room);
        },

        activeRooms: function () {
            let ar = [];
            for(let i =0; i < this.rooms.length; i++) {
                if(this.rooms[i].active) {
                    ar.push(this.rooms[i]);
                }
            }
            return ar;
        },

        inactiveRooms: function () {
            let ar = [];
            for(let i =0; i < this.rooms.length; i++) {
                if(!this.rooms[i].active) {
                    ar.push(this.rooms[i]);
                }
            }
            return ar;
        },



        /**
         * Blocked users
         */

        addBlockedUser: function (user) {
            if(user && user.meta && user.uid()) {
                this.blockedUsers[user.uid()] = user;
                user.blocked = true;
                $rootScope.$broadcast(UserBlockedNotification);
            }
        },

        isBlockedUser: function(uid) {
            return !Utils.unORNull(this.blockedUsers[uid]);
        },

        removeBlockedUserWithID: function (uid) {
            if(uid) {
                const user = this.blockedUsers[uid];
                if(user) {
                    user.blocked = false;
                    delete this.blockedUsers[uid];
                    $rootScope.$broadcast(UserUnblockedNotification);
                }
            }
        },


        /**
         * Utility functions
         */

        clear: function () {

            this.blockedUsers = {};
            this.rooms = [];

            $timeout(function() {
                $rootScope.$digest();
            });
        },


        getPrivateRoomsWithUsers: function (user1, user2) {
            const rooms = ArrayUtils.getRoomsWithUsers(this.getPrivateRooms(), [user1, user2]);
            return ArrayUtils.roomsSortedByMostRecent(rooms);
        },

        getPrivateRooms: function () {
            const rooms = [];
            for(let i = 0; i < this.rooms.length; i++) {
                const room = this.rooms[i];
                if(!room.isPublic()) {
                    rooms.push(room);
                }
            }
            return rooms;
        }
    };

    return Cache.init();
}]);