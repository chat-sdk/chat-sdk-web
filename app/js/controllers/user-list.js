angular.module('myApp.controllers').controller('UserListController', ['$scope', '$timeout', 'OnlineConnector', 'ArrayUtils', 'Log', function($scope, $timeout, OnlineConnector, ArrayUtils, Log) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(FriendAddedNotification, function () {
            Log.notification(FriendAddedNotification, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(FriendRemovedNotification, function () {
            Log.notification(FriendAddedNotification, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(UserBlockedNotification, function () {
            Log.notification(UserBlockedNotification, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(UserUnblockedNotification, function () {
            Log.notification(UserUnblockedNotification, 'UserListController');
            $scope.updateList();
        });

        // TODO: A bit hacky
        $scope.$on(RoomUpdatedNotification, function (event, room) {
            Log.notification(RoomUpdatedNotification, 'UserListController');
            if(room === $scope.room) {
                $scope.updateList();
            }
        });

        $scope.$on(LogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        // Filter online users to remove users that are blocking us
        $scope.allUsers = $scope.getAllUsers();

        if($scope.searchKeyword()) {
            $scope.users = ArrayUtils.filterByKey($scope.allUsers, $scope.searchKeyword(), function (user) {
                return user.getName();
            });
        }
        else {
            $scope.users = $scope.allUsers;
        }

        // Sort the array first by who's online
        // then alphabetically
        $scope.users.sort(function (user1, user2) {
            // Sort by who's online first then alphabetcially
            var aOnline = OnlineConnector.onlineUsers[user1.uid()];
            var bOnline = OnlineConnector.onlineUsers[user2.uid()];

            if(aOnline !== bOnline) {
                return aOnline ? 1 : -1;
            }
            else {
                if(user1.getName() !== user2.getName()) {
                    return user1.getName() > user2.getName() ? 1 : -1;
                }
                return 0;
            }
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.init();

}]);