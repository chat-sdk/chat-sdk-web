import * as angular from 'angular'


import {N} from "../keys/notification-keys";
import {ArrayUtils} from "../services/array-utils";
import {Log} from "../services/log";

export interface UserListScope extends ng.IScope {
    aUser: any,
}

angular.module('myApp.controllers').controller('UserListController', ['$scope', '$timeout', 'OnlineConnector', function($scope, $timeout, OnlineConnector) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(N.FriendAdded,() => {
            Log.notification(N.FriendAdded, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(N.FriendRemoved,() =>{
            Log.notification(N.FriendAdded, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(N.UserBlocked, () => {
            Log.notification(N.UserBlocked, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(N.UserUnblocked , () =>{
            Log.notification(N.UserUnblocked, 'UserListController');
            $scope.updateList();
        });

        // TODO: A bit hacky
        $scope.$on(N.RoomUpdated, (event, room) => {
            Log.notification(N.RoomUpdated, 'UserListController');
            if(room === $scope.room) {
                $scope.updateList();
            }
        });

        $scope.$on(N.Logout, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        // Filter online users to remove users that are blocking us
        $scope.allUsers = $scope.getAllUsers();

        if($scope.searchKeyword()) {
            $scope.users = ArrayUtils.filterByKey($scope.allUsers, $scope.searchKeyword(), (user) => {
                return user.getName();
            });
        }
        else {
            $scope.users = $scope.allUsers;
        }

        // Sort the array first by who's online
        // then alphabetically
        $scope.users.sort((user1, user2) => {
            // Sort by who's online first then alphabetcially
            let aOnline = OnlineConnector.onlineUsers[user1.uid()];
            let bOnline = OnlineConnector.onlineUsers[user2.uid()];

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

        $timeout(() => {
            $scope.$digest();
        });
    };

    $scope.init();

}]);