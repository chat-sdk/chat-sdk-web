import * as angular from 'angular'

angular.module('myApp.controllers').controller('EmojiController', ['$scope', 'Emojis', function($scope, Emojis) {

    $scope.init = function () {
        // Get a list of the emoji
        $scope.emojis = Emojis.getEmojis();
    };

    $scope.addEmoji = function (e) {
        if(!$scope.input.text) {
            $scope.input.text = "";
        }
        $scope.input.text += e;
    };

    $scope.init();

}]);