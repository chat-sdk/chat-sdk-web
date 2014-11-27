/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.stateManager', ['firebase']);

myApp.factory('StateManager', ['$rootScope', 'Room', 'User', 'Cache', 'Layout', function ($rootScope, Room, User, Cache, Layout) {
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

            var publicRoomsRef = Paths.publicRoomsRef();

            publicRoomsRef.on('child_added', (function (snapshot) {

                var rid = snapshot.key();
                if(rid) {
                    var room = Room.getOrCreateRoomWithID(rid);
                    //Cache.addPublicRoom(room);

                    room.on().then(function () {

                        Cache.addPublicRoom(room);

                    });

                }

            }).bind(this));

            publicRoomsRef.on('child_removed', (function (snapshot) {

                Cache.removePublicRoomWithID(snapshot.key());

            }).bind(this));

            /**
             * Online users ref
             */

            var onlineUsersRef = Paths.onlineUsersRef();


            onlineUsersRef.on("child_added", (function (snapshot) {

                // Get the UID of the added user
                var uid = null;
                if (snapshot && snapshot.val()) {
                    uid = snapshot.val().uid;

                    var user = User.getOrCreateUserWithID(uid);

                    Cache.addOnlineUser(user);

                    // Update the user's rooms
                    $rootScope.$broadcast(bUserOnlineStateChangedNotification, user);
                }

            }).bind(this));

            onlineUsersRef.on("child_removed", (function (snapshot) {

                var user = User.getOrCreateUserWithID(snapshot.val().uid);

                user.off();
                user.thumbnailOff();

                if (user) {
                    Cache.removeOnlineUser(user);
                }

                $rootScope.$broadcast(bUserOnlineStateChangedNotification, user);

            }).bind(this));

        },

        /**
         * Stop listenering to Firebase
         */
        off: function () {

            this.isOn = false;

            var publicRoomsRef = Paths.publicRoomsRef();

            publicRoomsRef.off('child_added');
            publicRoomsRef.off('child_removed');

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.off('child_added');
            onlineUsersRef.off('child_removed');

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
             * Image
             */

            var imageRef = Paths.userImageRef(uid);
            imageRef.once('value', function (snapshot) {
                if(snapshot && snapshot.val()) {
                    $rootScope.user.setImage(snapshot.val()[bImageKey]);
                }
            });

            /**
             * Thumbnail
             */

            var thumbnailRef = Paths.userThumbnailRef(uid);
            thumbnailRef.once('value', function (snapshot) {
                if(snapshot && snapshot.val()) {
                    $rootScope.user.setThumbnail(snapshot.val()[bThumbnailKey]);
                }
            });

            /**
             * Rooms
             */

            var roomsRef = Paths.userRoomsRef(uid);

            // A new room was added so we should start listening to it
            roomsRef.on('child_added', (function (snapshot) {

                if(snapshot && snapshot.val()) {
                    this.impl_roomAdded(snapshot);
                }

            }).bind(this));

            roomsRef.on('child_removed', (function (snapshot) {

                if(snapshot && snapshot.val()) {
                    this.impl_roomRemoved(snapshot);
                }

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
                var user = User.getOrCreateUserWithID(uid);

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
                var user = User.getOrCreateUserWithID(uid);

                user.removeFriend = function () {
                    snapshot.ref().remove();
                };
                Cache.addFriend(user);
            }

        },

        impl_friendRemoved: function (snapshot) {
            Cache.removeFriendWithID(snapshot.val().uid);
        },

        /**
         *
         * @param snapshot
         */
        impl_roomAdded: function (snapshot) {

            // Get the room id
            var rid = snapshot.val().rid;
            var invitedBy = snapshot.val().invitedBy;

            if (rid) {

                var room = Room.getOrCreateRoomWithID(rid);
                room.on().then(function () {

                    // Make sure we reset the offset
                    // this can cause a bug with pu rooms
                    // because when they're removed they
                    // aren't necessarily destroyed because
                    // they stay in the cache
                    room.offset = 0;

                    if (room) {

                        // If we've created this room just return
                        if(invitedBy && invitedBy !== $rootScope.user.meta.uid) {

                            if(invitedBy) {
                                room.invitedBy = User.getOrCreateUserWithID(invitedBy);
                            }

                            if(Cache.isBlockedUser(invitedBy)) {
                                return;
                            }

                            // If the user is a friend
                            if(Cache.isFriend(invitedBy)) {
                                // Set the user to member
                                room.setStatusForUser($rootScope.user, bUserStatusMember);
                            }
                            else {
                                // Join the room
                                room.join(bUserStatusInvited);
                            }

                        }

                        var slot = snapshot.val().slot;

                        Layout.insertRoom(room, slot ? slot : 0);

                    }

                    room.messagesOn();

                });
            }

        },

        impl_roomRemoved: function (snapshot) {
            Layout.removeRoomWithID(snapshot.key());
        }

    };
}]);