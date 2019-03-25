angular.module('myApp.controllers').controller('ChatBarController', ['$scope', '$timeout', 'Cache', 'Log', function($scope, $timeout, Cache, Log) {

    $scope.rooms = [];

    $scope.init = function () {

        $scope.$on(RoomOpenedNotification, $scope.updateList);
        $scope.$on(RoomClosedNotification, $scope.updateList);

        $scope.$on(UpdateRoomActiveStatusNotification, function () {
            Log.notification(UpdateRoomActiveStatusNotification, 'ChatBarController');
            $scope.updateList();
        });

        $scope.$on(LogoutNotification, $scope.updateList);

    };

    $scope.updateList = function () {

        Log.notification(RoomOpenedNotification + "/" + RoomClosedNotification, 'ChatBarController');

        // Only include rooms that are active
        $scope.rooms = Cache.activeRooms();

        $timeout(function () {
            $scope.$digest();
        });
    };

    $scope.init();

}]);