import * as angular from 'angular'


angular.module('myApp.directives').directive('ccUncloak', function () {
    return function (scope, element, attr) {
        element.removeAttr('style');
    };
});