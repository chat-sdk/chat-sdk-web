angular.module('myApp.controllers').controller('OnlineUsersListController', ['$scope', '$timeout', 'Log', 'ArrayUtils', 'OnlineConnector', function($scope, $timeout, Log, ArrayUtils, OnlineConnector) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(bOnlineUserAddedNotification, (function () {
            Log.notification(bOnlineUserAddedNotification, 'OnlineUsersListController');
            $scope.updateList();

        }).bind(this));

        $scope.$on(bOnlineUserRemovedNotification, function () {
            Log.notification(bOnlineUserRemovedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bUserBlockedNotification, function () {
            Log.notification(bUserBlockedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bUserUnblockedNotification, function () {
            Log.notification(bUserUnblockedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bFriendAddedNotification, function () {
            Log.notification(bFriendAddedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bFriendRemovedNotification, function () {
            Log.notification(bFriendAddedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bLogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        // Filter online users to remove users that are blocking us
        $scope.allUsers = ArrayUtils.objectToArray(OnlineConnector.onlineUsers);
        $scope.users = ArrayUtils.filterByKey($scope.allUsers, $scope.search[$scope.activeTab], function (user) {
            return user.getName();
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.init();

}]);