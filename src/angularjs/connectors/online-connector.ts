import * as angular from 'angular'
import * as firebase from 'firebase';

import {DEBUG} from "../keys/defines";
import {N} from "../keys/notification-keys";
import {IUser} from "../entities/user";
import {IPaths} from "../network/paths";
import {IUserStore} from "../persistence/user-store";
import {IRootScope} from "../interfaces/root-scope";

export interface IOnlineConnector {
    on(): void
    off(): void
}

class OnlineConnector implements IOnlineConnector {

    isOn = false;
    onlineUsers = {};

    static $inject = ['$rootScope', 'UserStore', 'Paths'];

    constructor (
        private $rootScope: IRootScope,
        private UserStore: IUserStore,
        private Paths: IPaths) {}


    on(): void {

        if(this.isOn) {
            return;
        }
        this.isOn = true;

        let onlineUsersRef = this.Paths.onlineUsersRef();

        onlineUsersRef.on("child_added", (snapshot: firebase.database.DataSnapshot) => {

            if(DEBUG) console.log('Online: ' + snapshot.key);

            // Get the UID of the added user
            let uid = null;
            if (snapshot && snapshot.val()) {
                uid = snapshot.key;

                let user = this.UserStore.getOrCreateUserWithID(uid);

                if(this.addOnlineUser(user)) {
                    // Update the user's rooms
                    this.$rootScope.$broadcast(N.UserOnlineStateChanged, user);
                }
            }

        }, (error) => {
            console.log(error.message);
        });

        onlineUsersRef.on("child_removed", (snapshot: firebase.database.DataSnapshot) => {

            console.log('Offline: ' + snapshot.key);

            let user = this.UserStore.getOrCreateUserWithID(snapshot.key);

            user.off();

            if (user) {
                this.removeOnlineUser(user);
            }

            this.$rootScope.$broadcast(N.UserOnlineStateChanged, user);

        }, (error) => {
            console.log(error.message);
        });
    }

    off(): void {

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

        let onlineUsersRef = this.Paths.onlineUsersRef();

        onlineUsersRef.off('child_added');
        onlineUsersRef.off('child_removed');
    }

    /**
     * Online users
     */

    addOnlineUser(user: IUser) {
        if(user && user.uid()) {
            if(!user.isMe()) {
                user.online = true;
                this.onlineUsers[user.uid()] = user;
                this.$rootScope.$broadcast(N.OnlineUserAdded);
                return true;
            }
        }
        return false;
    }

    removeOnlineUser(user) {
        if(user && user.meta && user.uid()) {
            this.removeOnlineUserWithID(user.uid());
        }
    }

    removeOnlineUserWithID(uid) {
        if(uid) {
            let user = this.onlineUsers[uid];
            if(user) {
                user.online = false;
                delete this.onlineUsers[uid];
                this.$rootScope.$broadcast(N.OnlineUserRemoved);
            }
        }
    }

    onlineUserCount() {
        let i = 0;
        for(let key in this.onlineUsers) {
            if(this.onlineUsers.hasOwnProperty(key)) {
                i++;
            }
        }
        return i;
    }

}

angular.module('myApp.services').service('OnlineConnector', OnlineConnector);