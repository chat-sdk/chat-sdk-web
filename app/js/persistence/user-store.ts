import * as angular from 'angular'
import {IUser} from "../entities/user";
import {ILocalStorage} from "./local-storage";

angular.module('myApp.services').factory('UserStore', ['$rootScope', '$timeout', 'LocalStorage', 'User', 'BeforeUnload', 'NetworkManager',
    function ($rootScope, $timeout, LocalStorage, User, BeforeUnload, NetworkManager) {
        let UserStore = {

            users: {},

            init: function () {

                BeforeUnload.addListener(this);

                return this;
            },

            beforeUnload: function () {
                this.sync();
            },

            sync: function () {
                LocalStorage.storeUsers(this.users);
                LocalStorage.sync();
            },

            getOrCreateUserWithID: function(uid: string, cancelOn?: boolean): IUser {
                let user = this.getUserWithID(uid);
                if(!user) {
                    user = this.buildUserWithID(uid);
                    this.addUser(user);
                }
                if(!cancelOn)
                    user.on();

                return user;
            },

            buildUserWithID: function (uid) {
                const user = new User(uid);
                LocalStorage.updateUserFromStore(user);
                return user;
            },

            getUserWithID: function (uid): IUser {
                if (uid !== null) {
                    return this.users[uid];
                } else {
                    return null;
                }
            },

            // A cache of all users
            addUser: function (user) {
                if(user && user.meta && user.uid()) {
                    this.users[user.uid()] = user;
                }
            },

//        removeUser: function (user) {
//            if(user && user.meta && user.meta.uid) {
//                this.removeUserWithID(user.meta.uid);
//            }
//        },
//
//        removeUserWithID: function (uid) {
//            if(uid) {
//                delete this.users[uid];
//                this.digest();
//            }
//        },

            clear: function () {
                this.users = {};
            },

            currentUser: function(): IUser {
                return this.getOrCreateUserWithID(NetworkManager.auth.currentUserID(), true);
            }


        };
        return UserStore.init();
    }]);

export interface IUserStore {
    getUserWithID (uid): IUser
    getOrCreateUserWithID(uid: string, cancelOn?: boolean): IUser
    currentUser(): IUser
}
//
// class UserStore implements IUserStore {
//
//     static $inject = ['$rootScope', '$timeout', 'LocalStorage', 'User', 'BeforeUnload', 'NetworkManager'];
//
//     private users = new Map<string, IUser>();
//
//     private localStorage: ILocalStorage;
//
//     constructor ($rootScope, $timeout, LocalStorage, User, BeforeUnload, NetworkManager) {
//         BeforeUnload.addListener(this);
//         this.localStorage = LocalStorage;
//     }
//
//     beforeUnload() {
//         this.sync();
//     }
//
//     sync() {
//         this.localStorage.storeUsers(this.users);
//         this.localStorage.sync();
//     }
//
//     getOrCreateUserWithID(uid: string, cancelOn?: boolean): IUser {
//         let user = this.getUserWithID(uid);
//         if(!user) {
//             user = this.buildUserWithID(uid);
//             this.addUser(user);
//         }
//         if(!cancelOn)
//             user.on();
//
//         return user;
//     }
//
//     buildUserWithID(uid) {
//         const user = new User(uid);
//         this.localStorage.updateUserFromStore(user);
//         return user;
//     }
//
//     getUserWithID(uid): IUser {
//         if (uid !== null) {
//             return this.users[uid];
//         } else {
//             return null;
//         }
//     }
//
//     // A cache of all users
//     addUser(user) {
//         if(user && user.meta && user.uid()) {
//             this.users[user.uid()] = user;
//         }
//     }
//
//     clear() {
//         this.users.clear();
//     }
//
//     currentUser: function(): IUser {
//         return this.getOrCreateUserWithID(NetworkManager.auth.currentUserID(), true);
//     }
//
// }