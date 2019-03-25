angular.module('myApp.services').factory('OnlineConnector', ['$rootScope', 'User', 'UserStore', 'Paths', 'Utils', function ($rootScope, User, UserStore, Paths, Utils) {
    return {

        isOn: false,
        onlineUsers: {},

        on: function () {

            if(this.isOn) {
                return;
            }
            this.isOn = true;

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.on("child_added", (function (snapshot) {

                if(DEBUG) console.log('Online: ' + snapshot.val().uid);

                // Get the UID of the added user
                var uid = null;
                if (snapshot && snapshot.val()) {
                    uid = snapshot.val().uid;

                    var user = UserStore.getOrCreateUserWithID(uid);

                    if(this.addOnlineUser(user)) {
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
                    this.removeOnlineUser(user);
                }

                $rootScope.$broadcast(bUserOnlineStateChangedNotification, user);

            }).bind(this));
        },

        off: function () {

            this.isOn = false;

            //this.onlineUsers = {};
            // having the user.blocked is useful because it means
            // that the partials don't have to call a function
            // however when you logout you want the flags to be reset
            for(var key in this.onlineUsers) {
                if(this.onlineUsers.hasOwnProperty(key)) {
                    this.onlineUsers[key].blocked = false;
                    this.onlineUsers[key].friend = false;
                }
            }
            this.onlineUsers = {};

            var onlineUsersRef = Paths.onlineUsersRef();

            onlineUsersRef.off('child_added');
            onlineUsersRef.off('child_removed');
        },

        /**
         * Online users
         */

        addOnlineUser: function (user) {
            if(user && user.uid()) {
                if(!$rootScope.user || user.uid() != $rootScope.user.uid()) {
                    user.online = true;
                    this.onlineUsers[user.uid()] = user;
                    $rootScope.$broadcast(bOnlineUserAddedNotification);
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
                var user = this.onlineUsers[uid];
                if(user) {
                    user.online = false;
                    delete this.onlineUsers[uid];
                    $rootScope.$broadcast(bOnlineUserRemovedNotification);
                }
            }
        },

        onlineUserCount: function () {
            var i = 0;
            for(var key in this.onlineUsers) {
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