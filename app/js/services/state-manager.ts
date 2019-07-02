import * as angular from 'angular'
import {UserAllowInvitesFriends} from "../keys/allow-invite-type";
import {RoomType1to1} from "../keys/room-type";
import {RoomRemovedNotification} from "../keys/notification-keys";

export interface IStateManager {

}

angular.module('myApp.services').service('StateManager', ['$rootScope', 'FriendsConnector', 'Config', 'Room', 'User', 'Cache', 'RoomStore', 'UserStore', 'RoomPositionManager', 'OnlineConnector', 'PublicRoomsConnector', 'Paths', 'RoomOpenQueue',
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
         * Stop listening to Firebase
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

            let roomsRef = Paths.userRoomsRef(uid);

            roomsRef.on('child_added', (function (snapshot) {
                if(snapshot.val()) {
                    this.impl_roomAdded(snapshot.key, snapshot.val().invitedBy);
                }

            }).bind(this));

            roomsRef.on('child_removed', (function (snapshot) {
                let rid = snapshot.key;
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

            let roomsRef = Paths.userRoomsRef(uid);

            roomsRef.off('child_added');
            roomsRef.off('child_removed');

            FriendsConnector.off(uid);

            let blockedUsersRef = Paths.userBlockedRef(uid);

            blockedUsersRef.off('child_added');
            blockedUsersRef.off('child_removed');

            // Switch the rooms off
            for(var i = 0; i < Cache.rooms.length; i++) {
                let room = Cache.rooms[i];
                room.off();
            }

        },

        impl_blockedAdded: function (snapshot) {

            let uid = snapshot.val().uid;
            if(uid) {
                var user = UserStore.getOrCreateUserWithID(uid);

                user.unblock = function () {
                    snapshot.ref.remove();
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
        impl_roomAdded: function (rid, invitedBy) {

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
                if($rootScope.user.allowInvitesFrom(UserAllowInvitesFriends) && !FriendsConnector.isFriend(invitedByUser) && invitedByUser != $rootScope.user) {
                    return;
                }

                // Does the room already exist?
                let room = RoomStore.getOrCreateRoomWithID(rid);

                // If you clear the cache without this all the messages
                // would show up as unread...
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

            let room = RoomStore.getRoomWithID(rid);
            room.close();

            if(room.type() === RoomType1to1){
                RoomStore.removeRoom(room);
                $rootScope.$broadcast(RoomRemovedNotification);
            }
        }

    };
}]);