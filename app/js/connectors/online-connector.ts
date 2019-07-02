import * as angular from 'angular'
import * as firebase from 'firebase';

import {DEBUG} from "../keys/defines";
import {
    OnlineUserAddedNotification,
    OnlineUserRemovedNotification,
    UserOnlineStateChangedNotification
} from "../keys/notification-keys";
import {IUser} from "../entities/user";

angular.module('myApp.services').factory('OnlineConnector', ['$rootScope', 'User', 'UserStore', 'Paths', 'Utils', function ($rootScope, User, UserStore, Paths, Utils) {
    return {

        isOn: false,
        onlineUsers: {},

        on: function () {

            if(this.isOn) {
                return;
            }
            this.isOn = true;

            let onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.on("child_added", (function (snapshot: firebase.database.DataSnapshot) {

                if(DEBUG) console.log('Online: ' + snapshot.val().uid);

                // Get the UID of the added user
                let uid = null;
                if (snapshot && snapshot.val()) {
                    uid = snapshot.val().uid;

                    let user = UserStore.getOrCreateUserWithID(uid);

                    if(this.addOnlineUser(user)) {
                        // Update the user's rooms
                        $rootScope.$broadcast(UserOnlineStateChangedNotification, user);
                    }
                }

            }).bind(this));

            onlineUsersRef.on("child_removed", (function (snapshot: firebase.database.DataSnapshot) {

                console.log('Offline: ' + snapshot.val().uid);

                let user = UserStore.getOrCreateUserWithID(snapshot.val().uid);

                user.off();

                if (user) {
                    this.removeOnlineUser(user);
                }

                $rootScope.$broadcast(UserOnlineStateChangedNotification, user);

            }).bind(this));
        },

        off: function () {

            this.isOn = false;

            //this.onlineUsers = {};
            // having the user.blocked is useful because it means
            // that the partials don't have to call a function
            // however when you logout you want the flags to be reset
            for(let key in this.onlineUsers) {
                if(this.onlineUsers.hasOwnProperty(key)) {
                    this.onlineUsers[key].blocked = false;
                    this.onlineUsers[key].friend = false;
                }
            }
            this.onlineUsers = {};

            let onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.off('child_added');
            onlineUsersRef.off('child_removed');
        },

        /**
         * Online users
         */

        addOnlineUser: function (user: IUser) {
            if(user && user.uid()) {
                if(!user.isMe()) {
                    user.online = true;
                    this.onlineUsers[user.uid()] = user;
                    $rootScope.$broadcast(OnlineUserAddedNotification);
                    return true;
                }
            }
            return false;
        },

        removeOnlineUser: function (user) {
            if(user && user.meta && user.uid()) {
                this.removeOnlineUserWithID(user.uid());
            }
        },

        removeOnlineUserWithID: function (uid) {
            if(uid) {
                let user = this.onlineUsers[uid];
                if(user) {
                    user.online = false;
                    delete this.onlineUsers[uid];
                    $rootScope.$broadcast(OnlineUserRemovedNotification);
                }
            }
        },

        onlineUserCount: function () {
            let i = 0;
            for(let key in this.onlineUsers) {
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