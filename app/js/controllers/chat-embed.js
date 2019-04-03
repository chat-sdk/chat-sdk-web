angular.module('myApp.controllers').controller('ChatEmbedController', ['$scope', '$rootScope', 'RoomStore', 'Utils', function($scope, $rootScope, RoomStore, Utils) {

    $scope.rooms = [];

    $scope.init = function (rid) {
        $scope.rid = rid;

        // When login is complete setup this room
        $scope.$on(LoginCompleteNotification, (function () {

            let rid = $scope.rid;
            $scope.rooms = [
                RoomStore.getRoomWithID(rid)
            ]

        }).bind($scope));

    };

}]);