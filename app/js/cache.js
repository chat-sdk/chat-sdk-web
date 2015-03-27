/**
 * Created by benjaminsmiley-andrews on 01/12/14.
 */
var myApp = angular.module('myApp.cache', []);

myApp.factory('BeforeUnload', ['$window', function ($window) {
    var BeforeUnload = {

        listeners: [],

        init: function () {

            var beforeUnloadHandler = (function (e) {
                var listener = null;
                for(var i = 0; i < this.listeners.length; i++) {
                    listener = this.listeners[i];
                    try {
                        listener.beforeUnload();
                    }
                    catch (e) {

                    }
                }
            }).bind(this);

            if ($window.addEventListener) {
                $window.addEventListener('beforeunload', beforeUnloadHandler);
            } else {
                $window.onbeforeunload = beforeUnloadHandler;
            }
            return this;
        },

        addListener: function (object) {
            if(this.listeners.indexOf(object) == -1 && object.beforeUnload) {
                this.listeners.push(object);
            }
        },

        removeListener: function (object) {
            var index = this.listeners.indexOf(object);
            if(index >= 0) {
                this.listeners.splice(index, 1);
            }
        }

    };
    return BeforeUnload.init();
}]);

myApp.factory('UserStore', ['$rootScope', '$timeout', 'LocalStorage', 'User', 'BeforeUnload',
    function ($rootScope, $timeout, LocalStorage, User, BeforeUnload) {
    var UserStore = {

        users: {},

        init: function () {

            BeforeUnload.addListener(this);

            return this;
        },

        beforeUnload: function () {
            this.sync();
        },

        sync: function () {
            LocalStorage.storeUsers(this.users);
            LocalStorage.sync();
        },

        getOrCreateUserWithID: function(uid, cancelOn) {
            var user = this.getUserWithID(uid);
            if(!user) {
                user = this.buildUserWithID(uid);
                this.addUser(user);
            }
            if(!cancelOn)
                user.on();

            return user;
        },

        buildUserWithID: function (uid) {
            var user = new User(uid);
            LocalStorage.updateUserFromStore(user);
            return user;
        },

        getUserWithID: function (uid) {
            return this.users[uid];
        },

        // A cache of all users
        addUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.users[user.meta.uid] = user;
            }
        },

//        removeUser: function (user) {
//            if(user && user.meta && user.meta.uid) {
//                this.removeUserWithID(user.meta.uid);
//            }
//        },
//
//        removeUserWithID: function (uid) {
//            if(uid) {
//                delete this.users[uid];
//                this.digest();
//            }
//        },

        clear: function () {
            this.users = {};
        }

    };
    return UserStore.init();
}]);

myApp.factory('RoomStore', ['$rootScope', '$timeout', '$window', 'LocalStorage', 'Room', 'BeforeUnload', 'ArrayUtils',
    function ($rootScope, $timeout, $window, LocalStorage, Room, BeforeUnload, ArrayUtils) {
    var RoomStore = {

        rooms: {},

        roomsLoadedFromMemory: false,

        init: function () {

            BeforeUnload.addListener(this);

            return this;
        },

        /**
         * Load the private rooms so they're available
         * to the inbox list
         */
        loadPrivateRoomsToMemory: function () {

            if(this.roomsLoadedFromMemory || !$rootScope.user) {
                return;
            }
            this.roomsLoadedFromMemory = true;

            // Load private rooms
            var rooms = LocalStorage.rooms;
            for(var key in rooms) {
                if(rooms.hasOwnProperty(key)) {
                    this.getOrCreateRoomWithID(key);
                }
            }
        },

        beforeUnload: function () {
            this.sync();
        },

        sync: function () {
            LocalStorage.storeRooms(this.rooms);
            LocalStorage.sync();
        },

        getOrCreateRoomWithID: function (rid) {

            var room = this.getRoomWithID(rid);

            if(!room) {
                room = this.buildRoomWithID(rid);
                this.addRoom(room);
            }

            return room;
        },

        buildRoomWithID: function (rid) {

            var room = new Room(rid);
            room.associatedUserID = $rootScope.user.meta.uid;

//            room.height = bChatRoomHeight;
//            room.width = bChatRoomWidth;

            // Update the room from the saved state
            LocalStorage.updateRoomFromStore(room);

            return room;
        },

        addRoom: function (room) {
            if(room && room.meta && room.meta.rid) {
                this.rooms[room.meta.rid] = room;
            }
        },

        removeRoom: function (room) {
            if(room && room.meta && room.meta.rid) {
                delete this.rooms[room.meta.rid];
            }
        },

        getRoomWithID: function (rid) {
            return this.rooms[rid];
        },

        clear: function () {
            this.rooms = {};
        },

        getPrivateRooms: function () {

            if(!$rootScope.user) {
                return [];
            }

            this.loadPrivateRoomsToMemory();

            var rooms = [];
            for(var rid in this.rooms) {
                if(this.rooms.hasOwnProperty(rid)) {
                    var room = this.rooms[rid];
                    // Make sure that we only return private rooms for the current user
                    if(!room.isPublic() && !room.deleted && room.associatedUserID && room.associatedUserID == $rootScope.user.meta.uid) {
                        rooms.push(this.rooms[rid]);
                    }
                }
            }
            return rooms;
        },

        getPrivateRoomsWithUsers: function (user1, user2) {
            var rooms = [];
            for(var key in this.rooms) {
                if(this.rooms.hasOwnProperty(key)) {
                    if(!this.rooms[key].isPublic()) {
                        rooms.push(this.rooms[key]);
                    }
                }
            }
            rooms = ArrayUtils.getRoomsWithUsers(rooms, [user1, user2])
            return ArrayUtils.roomsSortedByMostRecent(rooms);
        },

        inboxBadgeCount: function () {
            var count = 0;
            var rooms = this.getPrivateRooms();
            for(var i = 0; i < rooms.length; i++) {
                count += rooms[i].badge;
            }
            return count;
        }

    };
    return RoomStore.init();
}]);


/**
 * Temporary cache i.e. current rooms etc...
 */
myApp.factory('Cache', ['$rootScope', '$timeout', 'ArrayUtils', 'Utils', function ($rootScope, $timeout, ArrayUtils, Utils) {
    var Cache = {

        // The user's active rooms
        //
        rooms: [],

        // These are user specific stores
        onlineUsers: {},
        friends: {},
        blockedUsers: {},

        init: function () {
            return this;
        },

        /**
         * Rooms
         */

        addRoom: function (room) {
            if(!ArrayUtils.contains(this.rooms, room)) {
                room.open = true;
                this.rooms.push(room);
            }
        },

//        roomExists: function (room) {
//            return ArrayUtils.contains(this.rooms, room);
//        },

        removeRoom: function (room) {
            room.open = false;
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
         * Friends
         */

        addFriend: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.friends[user.meta.uid] = user;
                user.friend = true;
                $rootScope.$broadcast(bFriendAddedNotification);
            }
        },

        isFriend: function (user) {
            if(user && user.meta) {
                return this.isFriendUID(user.meta.uid);
            }
            return false;
        },

        isFriendUID: function(uid) {
            return !Utils.unORNull(this.friends[uid]);
        },

        removeFriend: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeFriendWithID(user.meta.uid);
            }
        },

        removeFriendWithID: function (uid) {
            if(uid) {
                var user = this.friends[uid];
                if(user) {
                    user.friend = false;
                    delete this.friends[uid];
                    $rootScope.$broadcast(bFriendRemovedNotification);
                }
            }
        },

        /**
         * Blocked users
         */

        addBlockedUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.blockedUsers[user.meta.uid] = user;
                user.blocked = true;
                $rootScope.$broadcast(bUserBlockedNotification);
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
                    $rootScope.$broadcast(bUserUnblockedNotification);
                }
            }
        },

        /**
         * Online users
         */

        addOnlineUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                if(!$rootScope.user || user.meta.uid != $rootScope.user.meta.uid) {
                    user.online = true;
                    this.onlineUsers[user.meta.uid] = user;
                    $rootScope.$broadcast(bOnlineUserAddedNotification);
                    return true;
                }
            }
            return false;
        },

        removeOnlineUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeOnlineUserWithID(user.meta.uid);
            }
        },

        removeOnlineUserWithID: function (uid) {
            if(uid) {
                var user = this.onlineUsers[uid];
                if(user) {
                    user.online = false;
                    delete this.onlineUsers[uid];
                    $rootScope.$broadcast(bOnlineUserRemovedNotification);
                }
            }
        },

        isOnlineWithUID: function (uid) {
            return !Utils.unORNull(this.onlineUsers[uid]);
        },

        /**
         * Utility functions
         */

        clear: function () {

            //this.onlineUsers = {};
            // having the user.blocked is useful because it means
            // that the partials don't have to call a function
            // however when you logout you want the flags to be reset
            for(var key in this.onlineUsers) {
                if(this.onlineUsers.hasOwnProperty(key)) {
                    this.onlineUsers[key].blocked = false;
                    this.onlineUsers[key].friend = false;
                }
            }

            this.blockedUsers = {};
            this.friends = {};
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