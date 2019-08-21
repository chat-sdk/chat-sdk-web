import * as angular from 'angular'
import * as $ from 'jquery'

angular.module('myApp.directives').directive('disableDrag', ['$rootScope','$document', function ($rootScope, $document) {
    return function (scope, elm, attrs) {

        $(elm).mousedown((e) => {
            $rootScope.disableDrag = true;
        });

        $document.mouseup((e) => {
            $rootScope.disableDrag = false;
        });
    };
}]);
