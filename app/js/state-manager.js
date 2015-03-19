/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.stateManager', ['firebase']);

myApp.factory('OnlineConnector', ['$rootScope', 'User', 'Cache', 'UserStore', function ($rootScope, User, Cache, UserStore) {
    return {

        isOn: false,

        on: function () {

            if(this.isOn) {
                return;
            }
            this.isOn = true;

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.on("child_added", (function (snapshot) {

                console.log('Online: ' + snapshot.val().uid);

                // Get the UID of the added user
                var uid = null;
                if (snapshot && snapshot.val()) {
                    uid = snapshot.val().uid;

                    var user = UserStore.getOrCreateUserWithID(uid);

                    if(Cache.addOnlineUser(user)) {
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
                    Cache.removeOnlineUser(user);
                }

                $rootScope.$broadcast(bUserOnlineStateChangedNotification, user);

            }).bind(this));
        },

        off: function () {

            this.isOn = false;

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.off('child_added');
            onlineUsersRef.off('child_removed');
        }

    }
}]);

myApp.factory('PublicRoomsConnector', ['$rootScope', 'Room', 'RoomStore', function ($rootScope, Room, RoomStore) {
    return {
        on: function () {
            var publicRoomsRef = Paths.publicRoomsRef();

            publicRoomsRef.on('child_added', (function (snapshot) {

                var rid = snapshot.key();
                if(rid) {
                    var room = RoomStore.getOrCreateRoomWithID(rid);
                    room.newPanel = snapshot.val().newPanel;
                    //Cache.addPublicRoom(room);

                    room.on().then(function () {

                        $rootScope.$broadcast(bPublicRoomAddedNotification, room);

                        RoomStore.addRoom(room);

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
myApp.factory('StateManager', ['$rootScope', 'Room', 'User', 'Cache', 'RoomStore', 'UserStore', 'RoomPositionManager', 'OnlineConnector', 'PublicRoomsConnector',
    function ($rootScope, Room, User, Cache, RoomStore, UserStore, RoomPositionManager, OnlineConnector, PublicRoomsConnector) {
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
            PublicRoomsConnector.on();

            /**
             * Online users ref
             */
            OnlineConnector.on();

        },

        /**
         * Stop listenering to Firebase
         */
        off: function () {

            this.isOn = false;

            PublicRoomsConnector.off();
            OnlineConnector.off();

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

            // Get the value of the rooms
            roomsRef.once('value', (function (snapshot) {

                this.impl_roomAddInitial(snapshot.val());

                // A new room was added so we should start listening to it
                roomsRef.on('child_added', (function (snapshot) {
                    var room = snapshot.val();
                    if(room) {
                        this.impl_roomAdded(room.rid, room.invitedBy);
                    }

                }).bind(this));

                roomsRef.on('child_removed', (function (snapshot) {

                    var room = snapshot.val();
                    if(room) {
                        this.impl_roomRemoved(room.rid);
                    }

                }).bind(this));

            }).bind(this));


            /**
             * Friends
             */

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

            var friendsRef = Paths.userFriendsRef(uid);

            friendsRef.off('child_added');
            friendsRef.off('child_removed');

            var blockedUsersRef = Paths.userBlockedRef(uid);

            blockedUsersRef.off('child_added');
            blockedUsersRef.off('child_removed');

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

        impl_friendAdded: function (snapshot) {

            var uid = snapshot.val().uid;
            if(uid) {
                var user = UserStore.getOrCreateUserWithID(uid);

                user.removeFriend = function () {
                    snapshot.ref().remove();
                };
                Cache.addFriend(user);
            }

        },

        impl_friendRemoved: function (snapshot) {
            Cache.removeFriendWithID(snapshot.val().uid);
        },

        impl_roomAddInitial: function (rooms) {
            var i = 0;

            var room = null;
            for(var key in rooms) {
                if(rooms.hasOwnProperty(key)) {
                    room = RoomStore.getOrCreateRoomWithID(key);

                    // The user is a member of this room
                    // We have to call this so the Room position manager can
                    // calculate the offsets
                    if(room.open) {
                        RoomPositionManager.insertRoom(room, i++, 0);
                    }
                }
            }

            RoomPositionManager.updateAllRoomActiveStatus();
        },

        /**
         *
         * @param snapshot
         */
        impl_roomAdded: function (rid, invitedBy) {

            if (rid && invitedBy) {

                // First check if we want to accept the room
                var invitedByUser = UserStore.getOrCreateUserWithID(invitedBy);

                // This should never happen
                if(Cache.isBlockedUser(invitedBy)) {
                    return;
                }

                if(!$rootScope.user.canBeInvitedByUser(invitedByUser)) {
                    return;
                }

                // Does the room already exist?
                var room = RoomStore.getOrCreateRoomWithID(rid);

                room.invitedBy = invitedByUser;

                room.userDeletedDate().then(function(timestamp) {

                    if(timestamp) {
                       room.deleted = true;
                    }

                    room.on().then(function () {

                        // Here there are two main options
                        // 1) We clicked on a room
                        // 2) We were invited by someone else
                        if($rootScope.user.meta.uid != invitedBy) {

                            //room.messagesOn();

                            // If the user is a friend
                            if(Cache.isFriendUID(invitedBy)) {
                                room.join(bUserStatusMember);
                                // Set the user to member
                                //room.setStatusForUser($rootScope.user, bUserStatusMember);
                            }
                            else {
                                // Join the room
                                room.join(bUserStatusMember);
                            }
                            // A room has been added
                            $rootScope.$broadcast(bRoomAddedNotification);
                        }

                        room.messagesOn(timestamp);
                    });
                });
            }
        },

        impl_roomRemoved: function (rid) {

            //var room = RoomCache.getRoomWithID(rid);

            //RoomPositionManager.closeRoom(room);

//            RoomPositionManager.removeRoom(room);
//            RoomPositionManager.autoPosition(300);
//            RoomPositionManager.updateAllRoomActiveStatus();
//
//            $rootScope.$broadcast(bRoomClosedNotification, room);
        }

    };
}]);