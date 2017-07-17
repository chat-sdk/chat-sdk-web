/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.stateManager', ['firebase']);

myApp.factory('FriendsConnector', ['$rootScope', 'User', 'UserStore', 'Paths', 'Utils', function ($rootScope, User, UserStore, Paths, Utils) {
    return {

        friends: {},

        on: function (uid) {
            var friendsRef = Paths.userFriendsRef(uid);

            friendsRef.on('child_added', (function (snapshot) {

                if(snapshot && snapshot.val()) {
                    this.impl_friendAdded(snapshot);
                }

            }).bind(this));

            friendsRef.on('child_removed', (function (snapshot) {

                if(snapshot && snapshot.val()) {
                    this.impl_friendRemoved(snapshot);
                }

            }).bind(this));
        },

        off: function (uid) {
            var friendsRef = Paths.userFriendsRef(uid);

            friendsRef.off('child_added');
            friendsRef.off('child_removed');

            this.friends = {};
        },

        /**
         * Friends
         */

        impl_friendAdded: function (snapshot) {

            var uid = snapshot.val().uid;
            if(uid) {
                var user = UserStore.getOrCreateUserWithID(uid);

                user.removeFriend = function () {
                    snapshot.ref().remove();
                };
                this.addFriend(user);
            }

        },

        impl_friendRemoved: function (snapshot) {
            this.removeFriendWithID(snapshot.val().uid);
        },

        addFriendsFromSSO: function (friends) {
            for(var i = 0; i < friends.length; i++) {
                var uid = friends[i];

                var user = UserStore.getOrCreateUserWithID(uid);
                user.ssoFriend = true;

                this.addFriend(user);
            }
        },

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
        }
    }
}]);

myApp.factory('OnlineConnector', ['$rootScope', 'User', 'UserStore', 'Paths', 'Utils', function ($rootScope, User, UserStore, Paths, Utils) {
    return {

        isOn: false,
        onlineUsers: {},

        on: function () {

            if(this.isOn) {
                return;
            }
            this.isOn = true;

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.on("child_added", (function (snapshot) {

                if(DEBUG) console.log('Online: ' + snapshot.val().uid);

                // Get the UID of the added user
                var uid = null;
                if (snapshot && snapshot.val()) {
                    uid = snapshot.val().uid;

                    var user = UserStore.getOrCreateUserWithID(uid);

                    if(this.addOnlineUser(user)) {
                        // Update the user's rooms
                        $rootScope.$broadcast(bUserOnlineStateChangedNotification, user);
                    }
                }

            }).bind(this));

            onlineUsersRef.on("child_removed", (function (snapshot) {

                console.log('Offline: ' + snapshot.val().uid);

                var user = UserStore.getOrCreateUserWithID(snapshot.val().uid);

                user.off();

                if (user) {
                    this.removeOnlineUser(user);
                }

                $rootScope.$broadcast(bUserOnlineStateChangedNotification, user);

            }).bind(this));
        },

        off: function () {

            this.isOn = false;

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
            this.onlineUsers = {};

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.off('child_added');
            onlineUsersRef.off('child_removed');
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

        onlineUserCount: function () {
            var i = 0;
            for(var key in this.onlineUsers) {
                if(this.onlineUsers.hasOwnProperty(key)) {
                    i++;
                }
            }
            return i;
        }

//        isOnlineWithUID: function (uid) {
//            return !Utils.unORNull(this.onlineUsers[uid]);
//        }

    }
}]);

myApp.factory('PublicRoomsConnector', ['$rootScope', 'Room', 'RoomStore', 'Paths',
    function ($rootScope, Room, RoomStore, Paths) {
    return {
        on: function () {
            var publicRoomsRef = Paths.publicRoomsRef();

            // Start listening to Firebase
            publicRoomsRef.on('child_added', (function (snapshot) {

                var rid = snapshot.key();
                if(rid) {
                    var room = RoomStore.getOrCreateRoomWithID(rid);

                    // TODO: Remove this
                    //room.newPanel = snapshot.val().newPanel;

                    room.on().then(function () {

                        $rootScope.$broadcast(bPublicRoomAddedNotification, room);

                        // Check to see if the room is marked as public
                        // TODO: Depricated code fix for old customers who didn't have
                        // public room flagged
//                        if(!room.meta.isPublic && !room.meta.type) {
//                            var ref = Paths.roomMetaRef(room.rid());
//                            ref.update({type: bRoomTypePublic});
//                        }

                        //RoomStore.addRoom(room);

                    });

                }

            }).bind(this));

            publicRoomsRef.on('child_removed', (function (snapshot) {

                var room = RoomStore.getOrCreateRoomWithID(snapshot.key());
                $rootScope.$broadcast(bPublicRoomRemovedNotification, room);


            }).bind(this));
        },

        off: function () {
            var publicRoomsRef = Paths.publicRoomsRef();

            publicRoomsRef.off('child_added');
            publicRoomsRef.off('child_removed');
        }
    }
}]);

/**
 * This should really be called the CurrentUserConnector
 */
myApp.factory('StateManager', ['$rootScope', 'FriendsConnector', 'Config', 'Room', 'User', 'Cache', 'RoomStore', 'UserStore', 'RoomPositionManager', 'OnlineConnector', 'PublicRoomsConnector', 'Paths', 'RoomOpenQueue',
    function ($rootScope, FriendsConnector, Config, Room, User, Cache, RoomStore, UserStore, RoomPositionManager, OnlineConnector, PublicRoomsConnector, Paths, RoomOpenQueue) {
    return {

        isOn: false,
        onUserID: null,

        /**
         * Add universal listeners to Firebase
         * these listeners are not specific to an individual user
         */
        on: function () {

            if(this.isOn) {
                return;
            }
            this.isOn = true;

            /**
             * Public rooms ref
             */
            if(Config.publicRoomsEnabled) {
                PublicRoomsConnector.on();
            }

            /**
             * Online users ref
             */
            if(Config.onlineUsersEnabled) {
                OnlineConnector.on();
            }

        },

        /**
         * Stop listenering to Firebase
         */
        off: function () {

            this.isOn = false;

            PublicRoomsConnector.off();

            if(Config.onlineUsersEnabled) {
                OnlineConnector.off();
            }

        },

        /**
         * Start listening to a specific user location
         */
        userOn: function (uid) {

            // Check to see that we've not already started to listen to this user
            if(this.onUserID) {
                if(this.onUserID == uid) {
                    console.log("You can't call on on a user twice");
                    return;
                }
                else {
                    this.userOff(this.onUserID);
                }
            }

            this.onUserID = uid;

            /**
             * Rooms
             */

            var roomsRef = Paths.userRoomsRef(uid);

            roomsRef.on('child_added', (function (snapshot) {
                var room = snapshot.val();
                if(room && room.rid) {
                    this.impl_roomAdded(room.rid, room.invitedBy, room.read);
                }

            }).bind(this));

            roomsRef.on('child_removed', (function (snapshot) {
                var rid = snapshot.key();
                if(rid) {
                    this.impl_roomRemoved(rid);
                }
            }).bind(this));

            /**
             * Friends
             */

            if(Config.friendsEnabled) {
                FriendsConnector.on(uid);
            }

            /**
             * Blocked
             */

            var blockedUsersRef = Paths.userBlockedRef(uid);
            blockedUsersRef.on('child_added', (function (snapshot) {

                if(snapshot && snapshot.val()) {
                    this.impl_blockedAdded(snapshot);
                }

            }).bind(this));

            blockedUsersRef.on('child_removed', (function (snapshot) {

                if(snapshot && snapshot.val()) {
                    this.impl_blockedRemoved(snapshot);
                }

            }).bind(this));

        },

        userOff: function (uid) {

            this.onUserID = null;

            var roomsRef = Paths.userRoomsRef(uid);

            roomsRef.off('child_added');
            roomsRef.off('child_removed');

            FriendsConnector.off(uid);

            var blockedUsersRef = Paths.userBlockedRef(uid);

            blockedUsersRef.off('child_added');
            blockedUsersRef.off('child_removed');

            // Switch the rooms off
            for(var i = 0; i < Cache.rooms.length; i++) {
                var room = Cache.rooms[i];
                room.off();
            }

        },

        impl_blockedAdded: function (snapshot) {

            var uid = snapshot.val().uid;
            if(uid) {
                var user = UserStore.getOrCreateUserWithID(uid);

                user.unblock = function () {
                    snapshot.ref().remove();
                };

                Cache.addBlockedUser(user);
            }

        },

        impl_blockedRemoved: function (snapshot) {

            Cache.removeBlockedUserWithID(snapshot.val().uid);

        },

        /**
         * This is called each time a room is added to the user's
         * list of rooms
         * @param rid
         * @param invitedBy
         * @param readTimestamp
         */
        impl_roomAdded: function (rid, invitedBy, readTimestamp) {

            if (rid && invitedBy) {
                var invitedByUser = UserStore.getOrCreateUserWithID(invitedBy);

                // First check if we want to accept the room
                // This should never happen
                if(Cache.isBlockedUser(invitedBy)) {
                    return;
                }

                if(!$rootScope.user.canBeInvitedByUser(invitedByUser)) {
                    return;
                }
                // If they only allow invites from friends
                // the other user must be a friend
                if($rootScope.user.allowInvitesFrom(bUserAllowInvitesFriends) && !FriendsConnector.isFriend(invitedByUser) && invitedByUser != $rootScope.user) {
                    return;
                }

                // Does the room already exist?
                var room = RoomStore.getOrCreateRoomWithID(rid);

                // If you clear the cache without this all the messages
                // would show up as unread...
                room.readTimestamp = readTimestamp;
                room.invitedBy = invitedByUser;
                room.deleted = false;

                room.on().then(function () {
                    if(room.isOpen) {
                        room.open(-1, 0);
                    }
                    // If the user just created the room...
                    if(RoomOpenQueue.roomExistsAndPop(room.rid())) {
                        room.open(0, 300);
                    }
                });
            }
        },

        impl_roomRemoved: function (rid) {

            var room = RoomStore.getRoomWithID(rid);
            room.close();

            if(room.type() == bRoomType1to1){
                RoomStore.removeRoom(room);
                $rootScope.$broadcast(bRoomRemovedNotification);
            }
        }

    };
}]);