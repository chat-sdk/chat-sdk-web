import * as angular from 'angular'
import $ from 'jQuery'

angular.module('myApp.directives').directive('consumeEvent', ['Utils', function (Utils) {
    return function (scope, elm, attrs) {
        $(elm).mousedown((function(e) {
            Utils.stopDefault(e);
            return false;
        }).bind(this));
    };
}]);
