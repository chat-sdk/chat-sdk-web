import * as angular from 'angular'
import {
    LoginCompleteNotification, LogoutNotification,
    RoomAddedNotification,
    RoomRemovedNotification,
    RoomUpdatedNotification
} from "../keys/notification-keys";

angular.module('myApp.controllers').controller('InboxRoomsListController', ['$scope', '$timeout', 'Log', 'RoomStore', 'ArrayUtils', function($scope, $timeout, Log, RoomStore, ArrayUtils) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(RoomAddedNotification, (function () {
            Log.notification(RoomAddedNotification, 'InboxRoomsListController');
            $scope.updateList();

        }).bind(this));

        $scope.$on(RoomRemovedNotification, function () {
            Log.notification(RoomRemovedNotification, 'InboxRoomsListController');
            $scope.updateList();
        });

        $scope.$on(LoginCompleteNotification, function () {
            Log.notification(LoginCompleteNotification, 'InboxRoomsListController');
            RoomStore.loadPrivateRoomsToMemory();
            $scope.updateList();
        });

        // Update the list if the user count on a room changes
        $scope.$on(RoomUpdatedNotification, $scope.updateList);

        $scope.$on(LogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        $scope.allRooms = RoomStore.getPrivateRooms();

        $scope.allRooms = ArrayUtils.roomsSortedByMostRecent($scope.allRooms);

        $scope.rooms = ArrayUtils.filterByKey($scope.allRooms, $scope.search[$scope.activeTab], function (room) {
            return room.meta.name;
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.init();

}]);
