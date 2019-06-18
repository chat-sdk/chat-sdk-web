import * as angular from 'angular'
import {
    FriendAddedNotification, FriendRemovedNotification, LogoutNotification,
    OnlineUserAddedNotification,
    OnlineUserRemovedNotification,
    UserBlockedNotification, UserUnblockedNotification
} from "../keys/notification-keys";

angular.module('myApp.controllers').controller('OnlineUsersListController', ['$scope', '$timeout', 'Log', 'ArrayUtils', 'OnlineConnector', function($scope, $timeout, Log, ArrayUtils, OnlineConnector) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(OnlineUserAddedNotification, (function () {
            Log.notification(OnlineUserAddedNotification, 'OnlineUsersListController');
            $scope.updateList();

        }).bind(this));

        $scope.$on(OnlineUserRemovedNotification, function () {
            Log.notification(OnlineUserRemovedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(UserBlockedNotification, function () {
            Log.notification(UserBlockedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(UserUnblockedNotification, function () {
            Log.notification(UserUnblockedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(FriendAddedNotification, function () {
            Log.notification(FriendAddedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(FriendRemovedNotification, function () {
            Log.notification(FriendAddedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(LogoutNotification, $scope.updateList);

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