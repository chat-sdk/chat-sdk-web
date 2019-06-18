import * as angular from 'angular'
import {DEBUG} from "../keys/defines";
import * as FileSaver from 'FileSaver'

angular.module('myApp.controllers').controller('ChatSettingsController', ['$scope', function($scope) {

    $scope.saveTranscript = function () {

        let t = $scope.room.transcript();

        if(DEBUG) console.log(t);

        FileSaver.saveAs(new Blob([t], {type: "text/plain;charset=utf-8"}), $scope.room.name + "-transcript.txt");

    };

    $scope.copyTranscript = function () {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", $scope.room.transcript());
    };

}]);