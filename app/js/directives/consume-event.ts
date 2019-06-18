import * as angular from 'angular'
import * as $ from 'jquery'

angular.module('myApp.directives').directive('consumeEvent', ['Utils', function (Utils) {
    return function (scope, elm, attrs) {
        $(elm).mousedown((function(e) {
            Utils.stopDefault(e);
            return false;
        }).bind(this));
    };
}]);
