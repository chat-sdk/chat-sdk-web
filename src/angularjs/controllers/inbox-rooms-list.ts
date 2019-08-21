import * as angular from 'angular'
import {N} from "../keys/notification-keys";
import {ArrayUtils} from "../services/array-utils";
import {Log} from "../services/log";

angular.module('myApp.controllers').controller('InboxRoomsListController', ['$scope', '$timeout', 'RoomStore', function($scope, $timeout, RoomStore) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(N.RoomAdded, () => {
            Log.notification(N.RoomAdded, 'InboxRoomsListController');
            $scope.updateList();

        });

        $scope.$on(N.RoomRemoved, () => {
            Log.notification(N.RoomRemoved, 'InboxRoomsListController');
            $scope.updateList();
        });

        $scope.$on(N.LoginComplete, () => {
            Log.notification(N.LoginComplete, 'InboxRoomsListController');
            RoomStore.loadPrivateRoomsToMemory();
            $scope.updateList();
        });

        // Update the list if the user count on a room changes
        $scope.$on(N.RoomUpdated, $scope.updateList);

        $scope.$on(N.Logout, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        $scope.allRooms = RoomStore.getPrivateRooms();

        $scope.allRooms = ArrayUtils.roomsSortedByMostRecent($scope.allRooms);

        $scope.rooms = ArrayUtils.filterByKey($scope.allRooms, $scope.search[$scope.activeTab], (room) => {
            return room.meta.name;
        });

        $timeout(() => {
            $scope.$digest();
        });
    };

    $scope.init();

}]);
