import * as angular from 'angular'
import {N} from "../keys/notification-keys";
import {ArrayUtils} from "../services/array-utils";
import {Log} from "../services/log";

angular.module('myApp.controllers').controller('OnlineUsersListController', ['$scope', '$timeout', 'OnlineConnector', function($scope, $timeout, OnlineConnector) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(N.OnlineUserAdded, () => {
            Log.notification(N.OnlineUserAdded, 'OnlineUsersListController');
            $scope.updateList();

        });

        $scope.$on(N.OnlineUserRemoved, () => {
            Log.notification(N.OnlineUserRemoved, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(N.UserBlocked, () => {
            Log.notification(N.UserBlocked, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(N.UserUnblocked, () => {
            Log.notification(N.UserUnblocked, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(N.FriendAdded, () => {
            Log.notification(N.FriendAdded, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(N.FriendRemoved, () => {
            Log.notification(N.FriendAdded, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(N.Logout, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        // Filter online users to remove users that are blocking us
        $scope.allUsers = ArrayUtils.objectToArray(OnlineConnector.onlineUsers);
        $scope.users = ArrayUtils.filterByKey($scope.allUsers, $scope.search[$scope.activeTab], (user) => {
            return user.getName();
        });

        $timeout(() => {
            $scope.$digest();
        });
    };

    $scope.init();

}]);