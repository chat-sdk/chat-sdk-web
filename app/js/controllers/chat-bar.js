angular.module('myApp.controllers').controller('ChatBarController', ['$scope', '$timeout', 'Cache', 'Log', function($scope, $timeout, Cache, Log) {

    $scope.rooms = [];

    $scope.init = function () {

        $scope.$on(bRoomOpenedNotification, $scope.updateList);
        $scope.$on(bRoomClosedNotification, $scope.updateList);

        $scope.$on(bUpdateRoomActiveStatusNotification, function () {
            Log.notification(bUpdateRoomActiveStatusNotification, 'ChatBarController');
            $scope.updateList();
        });

        $scope.$on(bLogoutNotification, $scope.updateList);

    };

    $scope.updateList = function () {

        Log.notification(bRoomOpenedNotification + "/" + bRoomClosedNotification, 'ChatBarController');

        // Only include rooms that are active
        $scope.rooms = Cache.activeRooms();

        $timeout(function () {
            $scope.$digest();
        });
    };

    $scope.init();

}]);