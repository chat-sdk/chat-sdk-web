import * as angular from 'angular'
import {Utils} from "../services/utils";
import {N} from "../keys/notification-keys";
import {IUser} from "../entities/user";

export interface IFriendsConnector {
    on(uid: string): void
    off(uid: string): void
    isFriend(user: IUser): boolean
}

angular.module('myApp.services').factory('FriendsConnector', ['$rootScope', 'User', 'UserStore', 'Paths', function ($rootScope, User, UserStore, Paths) {
    return {

        friends: {},

        on: function (uid: string): void {
            let friendsRef = Paths.userFriendsRef(uid);

            friendsRef.on('child_added', (snapshot) => {

                if(snapshot && snapshot.val()) {
                    this.impl_friendAdded(snapshot);
                }

            });

            friendsRef.on('child_removed', (snapshot) => {

                if(snapshot && snapshot.val()) {
                    this.impl_friendRemoved(snapshot);
                }

            });
        },

        off: function (uid: string): void {
            let friendsRef = Paths.userFriendsRef(uid);

            friendsRef.off('child_added');
            friendsRef.off('child_removed');

            this.friends = {};
        },

        /**
         * Friends
         */

        impl_friendAdded: function (snapshot) {

            let uid = snapshot.val().uid;
            if(uid) {
                let user = UserStore.getOrCreateUserWithID(uid);

                user.removeFriend = function () {
                    snapshot.ref.remove();
                };
                this.addFriend(user);
            }

        },

        impl_friendRemoved: function (snapshot) {
            this.removeFriendWithID(snapshot.val().uid);
        },

        addFriendsFromConfig: function (friends) {
            for(let i = 0; i < friends.length; i++) {
                let uid = friends[i];

                let user = UserStore.getOrCreateUserWithID(uid);
                user.ssoFriend = true;

                this.addFriend(user);
            }
        },

        addFriend: function (user) {
            if(user && user.uid()) {
                this.friends[user.uid()] = user;
                user.friend = true;
                $rootScope.$broadcast(N.FriendAdded);
            }
        },

        isFriend: function (user: IUser): boolean {
            if(user && user.uid()) {
                return this.isFriendUID(user.uid());
            }
            return false;
        },

        isFriendUID: function(uid) {
            return !Utils.unORNull(this.friends[uid]);
        },

        removeFriend: function (user) {
            if(user && user.uid()) {
                this.removeFriendWithID(user.uid());
            }
        },

        removeFriendWithID: function (uid) {
            if(uid) {
                let user = this.friends[uid];
                if(user) {
                    user.friend = false;
                    delete this.friends[uid];
                    $rootScope.$broadcast(N.FriendRemoved);
                }
            }
        }
    }
}]);