import * as angular from 'angular';

import { Utils } from '../services/utils';
import { N } from '../keys/notification-keys';
import { IUser } from '../entities/user';
import { IRootScope } from '../interfaces/root-scope';
import { IUserStore } from '../persistence/user-store';
import { IPaths } from '../network/paths';

export interface IFriendsConnector {
    on(uid: string): void;
    off(uid: string): void;
    isFriend(user: IUser): boolean;
}

class FriendsConnector implements FriendsConnector {

    static $inject = ['$rootScope', 'User', 'UserStore', 'Paths'];

    friends: { [uid: string]: IUser } = {};

    constructor(
        private $rootScope: IRootScope,
        private User: IUser,
        private UserStore: IUserStore,
        private Paths: IPaths,
    ) { }

    on(uid: string) {
        let friendsRef = this.Paths.userFriendsRef(uid);

        friendsRef.on('child_added', (snapshot) => {

            if (snapshot && snapshot.val()) {
                this.impl_friendAdded(snapshot);
            }

        });

        friendsRef.on('child_removed', (snapshot) => {

            if (snapshot && snapshot.val()) {
                this.impl_friendRemoved(snapshot);
            }

        });
    }

    off(uid: string) {
        let friendsRef = this.Paths.userFriendsRef(uid);

        friendsRef.off('child_added');
        friendsRef.off('child_removed');

        this.friends = {};
    }

    // Friends

    impl_friendAdded(snapshot: firebase.database.DataSnapshot) {

        const uid: string = snapshot.val().uid;
        if (uid) {
            const user = this.UserStore.getOrCreateUserWithID(uid);

            user.removeFriend = () => {
                snapshot.ref.remove();
            }
            this.addFriend(user);
        }

    }

    impl_friendRemoved(snapshot: firebase.database.DataSnapshot) {
        this.removeFriendWithID(snapshot.val().uid);
    }

    addFriendsFromConfig(friends: string[]) {
        for(let i = 0; i < friends.length; i++) {
            const uid = friends[i];

            const user = this.UserStore.getOrCreateUserWithID(uid);
            user.ssoFriend = true;

            this.addFriend(user);
        }
    }

    addFriend(user: IUser) {
        if (user && user.uid()) {
            this.friends[user.uid()] = user;
            user.friend = true;
            this.$rootScope.$broadcast(N.FriendAdded);
        }
    }

    isFriend(user: IUser): boolean {
        if (user && user.uid()) {
            return this.isFriendUID(user.uid());
        }
        return false;
    }

    isFriendUID(uid: string): boolean {
        return !Utils.unORNull(this.friends[uid]);
    }

    removeFriend(user: IUser) {
        if (user && user.uid()) {
            this.removeFriendWithID(user.uid());
        }
    }

    removeFriendWithID(uid: string) {
        if (uid) {
            const user = this.friends[uid];
            if (user) {
                user.friend = false;
                delete this.friends[uid];
                this.$rootScope.$broadcast(N.FriendRemoved);
            }
        }
    }

}

angular.module('myApp.services').service('FriendsConnector', FriendsConnector);
