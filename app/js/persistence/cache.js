/**
 * Temporary cache i.e. current rooms etc...
 */
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
            var ar = [];
            for(var i =0; i < this.rooms.length; i++) {
                if(this.rooms[i].active) {
                    ar.push(this.rooms[i]);
                }
            }
            return ar;
        },

        inactiveRooms: function () {
            var ar = [];
            for(var i =0; i < this.rooms.length; i++) {
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
                var user = this.blockedUsers[uid];
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
            var rooms = ArrayUtils.getRoomsWithUsers(this.getPrivateRooms(), [user1, user2]);
            return ArrayUtils.roomsSortedByMostRecent(rooms);
        },

        getPrivateRooms: function () {
            var rooms = [];
            for(var i = 0; i < this.rooms.length; i++) {
                var room = this.rooms[i];
                if(!room.isPublic()) {
                    rooms.push(room);
                }
            }
            return rooms;
        }
    };

    return Cache.init();
}]);