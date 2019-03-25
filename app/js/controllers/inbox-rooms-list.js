angular.module('myApp.controllers').controller('InboxRoomsListController', ['$scope', '$timeout', 'Log', 'RoomStore', 'ArrayUtils', function($scope, $timeout, Log, RoomStore, ArrayUtils) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(bRoomAddedNotification, (function () {
            Log.notification(bRoomAddedNotification, 'InboxRoomsListController');
            $scope.updateList();

        }).bind(this));

        $scope.$on(bRoomRemovedNotification, function () {
            Log.notification(bRoomRemovedNotification, 'InboxRoomsListController');
            $scope.updateList();
        });

        $scope.$on(bLoginCompleteNotification, function () {
            Log.notification(bLoginCompleteNotification, 'InboxRoomsListController');
            RoomStore.loadPrivateRoomsToMemory();
            $scope.updateList();
        });

        // Update the list if the user count on a room changes
        $scope.$on(bRoomUpdatedNotification, $scope.updateList);

        $scope.$on(bLogoutNotification, $scope.updateList);

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
