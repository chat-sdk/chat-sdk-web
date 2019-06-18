import * as angular from 'angular'

angular.module('myApp.services').factory('UserStore', ['$rootScope', '$timeout', 'LocalStorage', 'User', 'BeforeUnload',
    function ($rootScope, $timeout, LocalStorage, User, BeforeUnload) {
        var UserStore = {

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

            getOrCreateUserWithID: function(uid, cancelOn) {
                var user = this.getUserWithID(uid);
                if(!user) {
                    user = this.buildUserWithID(uid);
                    this.addUser(user);
                }
                if(!cancelOn)
                    user.on();

                return user;
            },

            buildUserWithID: function (uid) {
                var user = new User(uid);
                LocalStorage.updateUserFromStore(user);
                return user;
            },

            getUserWithID: function (uid) {
                return this.users[uid];
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
            }

        };
        return UserStore.init();
    }]);