

angular.module('myApp.controllers').controller('NotificationController', ['$scope', function($scope) {
    $scope.submit = function () {
        $scope.notification.show = false;
    };
}]);