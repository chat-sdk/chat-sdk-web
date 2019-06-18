import * as angular from 'angular'

angular.module('myApp.directives').directive('disableDrag', ['$rootScope','$document', function ($rootScope, $document) {
    return function (scope, elm, attrs) {

        elm.mousedown((function(e) {
            $rootScope.disableDrag = true;
        }).bind(this));

        $document.mouseup((function(e) {
            $rootScope.disableDrag = false;
        }).bind(this));
    };
}]);
