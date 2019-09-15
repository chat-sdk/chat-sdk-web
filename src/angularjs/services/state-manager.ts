import * as angular from 'angular';

import { RoomType } from '../keys/room-type';
import { UserAllowInvites } from '../keys/allow-invite-type';
import { RoomKeys } from '../keys/room-keys';
import { N } from '../keys/notification-keys';
import { IFriendsConnector } from '../connectors/friend-connector';
import { IConfig } from './config';
import { ICache } from '../persistence/cache';
import { IRoomStore } from '../persistence/room-store';
import { IUserStore } from '../persistence/user-store';
import { IOnlineConnector } from '../connectors/online-connector';
import { IPublicRoomsConnector } from '../connectors/public-rooms-connector';
import { IPaths } from '../network/paths';
import { IRoomOpenQueue } from './room-open-queue';
import { IRootScope } from '../interfaces/root-scope';

export interface IStateManager {
    on(): void;
    userOn(uid: string): void;
}

class StateManager implements IStateManager {

    isOn = false;
    onUserID = null;

    static $inject = ['$rootScope', 'FriendsConnector', 'Config', 'Cache', 'RoomStore', 'UserStore', 'OnlineConnector', 'PublicRoomsConnector', 'Paths', 'RoomOpenQueue'];

    constructor (
        private $rootScope: IRootScope,
        private FriendsConnector: IFriendsConnector,
        private Config: IConfig,
        private Cache: ICache,
        private RoomStore: IRoomStore,
        private UserStore: IUserStore,
        private OnlineConnector: IOnlineConnector,
        private PublicRoomsConnector: IPublicRoomsConnector,
        private Paths: IPaths,
        private RoomOpenQueue: IRoomOpenQueue,
    ) { }

    /**
     * Add universal listeners to Firebase
     * these listeners are not specific to an individual user
     */
    on() {

        if (this.isOn) {
            return;
        }
        this.isOn = true;

        /**
         * Public rooms ref
         */
        if (this.Config.publicRoomsEnabled) {
            this.PublicRoomsConnector.on();
        }

        /**
         * Online users ref
         */
        if (this.Config.onlineUsersEnabled) {
            this.OnlineConnector.on();
        }

    }

    /**
     * Stop listening to Firebase
     */
    off() {

        this.isOn = false;

        this.PublicRoomsConnector.off();

        if (this.Config.onlineUsersEnabled) {
            this.OnlineConnector.off();
        }

    }

    /**
     * Start listening to a specific user location
     */
    userOn(uid: string) {

        // Check to see that we've not already started to listen to this user
        if (this.onUserID) {
            if (this.onUserID == uid) {
                console.log('You can\'t call "userOn" on a user twice');
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

        let roomsRef = this.Paths.userRoomsRef(uid);

        roomsRef.on('child_added', (snapshot) => {
            if (snapshot.val()) {
                this.impl_roomAdded(snapshot.key, snapshot.val()[RoomKeys.InvitedBy]);
            }
        });

        roomsRef.on('child_removed', (snapshot) => {
            let rid = snapshot.key;
            if (rid) {
                this.impl_roomRemoved(rid);
            }
        });

        /**
         * Friends
         */

        if (this.Config.friendsEnabled) {
            this.FriendsConnector.on(uid);
        }

        /**
         * Blocked
         */

        let blockedUsersRef = this.Paths.userBlockedRef(uid);
        blockedUsersRef.on('child_added', (snapshot) => {

            if (snapshot && snapshot.val()) {
                this.impl_blockedAdded(snapshot);
            }

        });

        blockedUsersRef.on('child_removed', (snapshot) => {

            if (snapshot && snapshot.val()) {
                this.impl_blockedRemoved(snapshot);
            }

        });

    }

    userOff(uid: string) {

        this.onUserID = null;

        let roomsRef = this.Paths.userRoomsRef(uid);

        roomsRef.off('child_added');
        roomsRef.off('child_removed');

        this.FriendsConnector.off(uid);

        let blockedUsersRef = this.Paths.userBlockedRef(uid);

        blockedUsersRef.off('child_added');
        blockedUsersRef.off('child_removed');

        // Switch the rooms off
        for (let i = 0; i < this.Cache.rooms.length; i++) {
            let room = this.Cache.rooms[i];
            room.off();
        }

    }

    impl_blockedAdded(snapshot: firebase.database.DataSnapshot) {

        let uid = snapshot.key;
        if (uid) {
            let user = this.UserStore.getOrCreateUserWithID(uid);

            user.unblock = () => {
                snapshot.ref.remove();
            };

            this.Cache.addBlockedUser(user);
        }

    }

    impl_blockedRemoved(snapshot: firebase.database.DataSnapshot) {
        this.Cache.removeBlockedUserWithID(snapshot.key);
    }

    /**
     * This is called each time a room is added to the user's
     * list of rooms
     * @param rid
     * @param invitedBy
     */
    impl_roomAdded(rid: string, invitedBy: string) {

        if (rid && invitedBy) {
            const invitedByUser = this.UserStore.getOrCreateUserWithID(invitedBy);

            // First check if we want to accept the room
            // This should never happen
            if (this.Cache.isBlockedUser(invitedBy)) {
                return;
            }

            if (!this.UserStore.currentUser().canBeInvitedByUser(invitedByUser)) {
                return;
            }
            // If they only allow invites from friends
            // the other user must be a friend
            if (this.UserStore.currentUser().allowInvitesFrom(UserAllowInvites.Friends) && !this.FriendsConnector.isFriend(invitedByUser) && !invitedByUser.isMe()) {
                return;
            }

            // Does the room already exist?
            const room = this.RoomStore.getOrCreateRoomWithID(rid);

            // If you clear the cache without this all the messages
            // would show up as unread...
            room.invitedBy = invitedByUser;
            room.deleted = false;

            room.on().then(() => {
                if (room.isOpen) {
                    room.open(-1, 0);
                }
                // If the user just created the room...
                if (this.RoomOpenQueue.roomExistsAndPop(room.rid())) {
                    room.open(0);
                }
            });
        }
    }

    impl_roomRemoved(rid: string) {

        let room = this.RoomStore.getRoomWithID(rid);
        room.close();

        if (room.getType() === RoomType.OneToOne){
            this.RoomStore.removeRoom(room);
            this.$rootScope.$broadcast(N.RoomRemoved);
        }
    }

}

angular.module('myApp.services').service('StateManager', StateManager);
