/**
 * Created by benjaminsmiley-andrews on 01/12/14.
 */
var myApp = angular.module('myApp.cache', []);

myApp.factory('UserCache', ['$rootScope', '$timeout', '$window', 'LocalStorage', 'User', function ($rootScope, $timeout, $window, LocalStorage, User) {
    var UserCache = {

        users: {},

        init: function () {

            // Populate the cache from the local storage
            var serializedUsers = LocalStorage.users;
            var su = null;
            var user = null;

            for(var uid in serializedUsers) {
                if(serializedUsers.hasOwnProperty(uid)) {
                    su = serializedUsers[uid];
                    //user = User.newUser()
                }
            }

            var beforeUnloadHandler = (function (e) {

                LocalStorage.storeUsers(this.users);

            }).bind(this);

            if ($window.addEventListener) {
                $window.addEventListener('beforeunload', beforeUnloadHandler);
            } else {
                $window.onbeforeunload = beforeUnloadHandler;
            }

            return this;
        },

        getOrCreateUserWithID: function(uid) {
            var user = this.getUserWithID(uid);
            if(!user) {
                user = this.buildUserWithID(uid);
                this.addUser(user);
            }
            user.on();
            return user;
        },

        buildUserWithID: function (uid) {
            var user = User.buildUserWithID(uid);
            LocalStorage.updateUserFromCookies(user);
            return user;
        },

        getUserWithID: function (uid) {
            var user = this.users[uid];
//            if(!user) {
//                user = this.onlineUsers[uid];
//            }
//            if(!user) {
//                user = this.friends[uid];
//            }
//            if(!user) {
//                user = this.blockedUsers[uid];
//            }
            return user;
        },

        // A cache of all users
        addUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.users[user.meta.uid] = user;
            }
        },

        removeUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeUserWithID(user.meta.uid);
            }
        },

        removeUserWithID: function (uid) {
            if(uid) {
                delete this.users[uid];
                this.digest();
            }
        },

        clear: function () {
            this.users = {};
        }

    };
    return UserCache.init();
}]);

myApp.factory('RoomCache', ['$rootScope', '$timeout', '$window', 'LocalStorage', 'Room', function ($rootScope, $timeout, $window, LocalStorage, Room) {
    var RoomCache = {

        rooms: {},

        init: function () {
            return this;
        },

        getOrCreateRoomWithID: function (rid) {

            var room = this.getRoomWithID(rid);

            if(!room) {
                room = this.buildRoomWithID(rid);
                this.addRoom(room);
            }
            room.height = bChatRoomHeight;
            room.width = bChatRoomWidth;

            return room;
        },

        buildRoomWithID: function (rid) {

            var room = Room.newRoom();
            room.meta.rid = rid;

            // Update the room from the saved state
            LocalStorage.updateRoomFromCookies(room);

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
        }

    };
    return RoomCache.init();
}]);


myApp.factory('Cache', ['$rootScope', '$timeout', '$window', 'LocalStorage', function ($rootScope, $timeout, $window, LocalStorage) {
    var Cache = {

        // The user's active rooms
        //
        rooms: [],

        // These are user specific stores
        onlineUsers: {},
        friends: {},
        blockedUsers: {},

        init: function () {

            var beforeUnloadHandler = (function (e) {

                // Save the rooms to cookies
//                var rooms = this.rooms;
//                for(var i in rooms) {
//                    LocalStorage.setRoom(rooms[i]);
//                }

                LocalStorage.storeRooms(this.rooms);

            }).bind(this);

            if ($window.addEventListener) {
                $window.addEventListener('beforeunload', beforeUnloadHandler);
            } else {
                $window.onbeforeunload = beforeUnloadHandler;
            }


            return this;
        },

        /**
         * Rooms
         */

        addRoom: function (room) {
            if(!CCArray.contains(this.rooms, room)) {
                this.rooms.push(room);
            }
        },

        roomExists: function (room) {
            return CCArray.contains(this.rooms, room);
        },

        removeRoom: function (room) {
            CCArray.remove(this.rooms, room);
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

        getRoomWithOtherUser: function (user) {
            var room;
            var rooms = this.rooms;

            for(var i = 0; i < rooms.length; i++) {
                room = rooms[i];

                // Only look at rooms that are private chats
                // between only two people
                if(room.userCount == 2 && !room.meta.isPublic) {
                    if(room.users[user.meta.uid]) {
                        return room;
                    }
                }
            }
            return null;
        },

        /**
         * Friends
         */

        addFriend: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.friends[user.meta.uid] = user;
                user.friend = true;
            }
        },

        isFriend: function (user) {
            if(user && user.meta) {
                return this.isFriendUID(user.meta.uid);
            }
            return false;
        },

        isFriendUID: function(uid) {
            return !unORNull(this.friends[uid]);
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
                    this.digest();
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
            }
        },

        isBlockedUser: function(uid) {
            return !unORNull(this.blockedUsers[uid]);
        },

        removeBlockedUserWithID: function (uid) {
            if(uid) {
                var user = this.blockedUsers[uid];
                if(user) {
                    user.blocked = false;
                    delete this.blockedUsers[uid];
                    this.digest();
                }
            }
        },

        /**
         * Online users
         */

        addOnlineUser: function (user) {
            if(user && user.meta && user.meta.uid && user.meta.uid != $rootScope.user.meta.uid) {
                user.online = true;
                this.onlineUsers[user.meta.uid] = user;
                this.digest();
            }
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
                    this.digest();
                }
            }
        },

        /**
         * Utility functions
         */

        clear: function () {
            this.onlineUsers = {};
            this.blockedUsers = {};
            this.friends = {};
            this.rooms = [];

            this.digest();
        },

        digest: function () {
            $timeout(function() {
                $rootScope.$digest();
            });
        }
    };

    return Cache.init();
}]);