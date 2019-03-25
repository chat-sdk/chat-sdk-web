angular.module('myApp.services').factory('FriendsConnector', ['$rootScope', 'User', 'UserStore', 'Paths', 'Utils', function ($rootScope, User, UserStore, Paths, Utils) {
    return {

        friends: {},

        on: function (uid) {
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
        },

        off: function (uid) {
            var friendsRef = Paths.userFriendsRef(uid);

            friendsRef.off('child_added');
            friendsRef.off('child_removed');

            this.friends = {};
        },

        /**
         * Friends
         */

        impl_friendAdded: function (snapshot) {

            var uid = snapshot.val().uid;
            if(uid) {
                var user = UserStore.getOrCreateUserWithID(uid);

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
            for(var i = 0; i < friends.length; i++) {
                var uid = friends[i];

                var user = UserStore.getOrCreateUserWithID(uid);
                user.ssoFriend = true;

                this.addFriend(user);
            }
        },

        addFriend: function (user) {
            if(user && user.uid()) {
                this.friends[user.uid()] = user;
                user.friend = true;
                $rootScope.$broadcast(bFriendAddedNotification);
            }
        },

        isFriend: function (user) {
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
                var user = this.friends[uid];
                if(user) {
                    user.friend = false;
                    delete this.friends[uid];
                    $rootScope.$broadcast(bFriendRemovedNotification);
                }
            }
        }
    }
}]);