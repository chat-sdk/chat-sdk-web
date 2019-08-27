import * as angular from 'angular'


angular.module('myApp.directives').directive('ccUncloak', function () {
    return {
        link: function (scope, element, attr) {
            element.removeAttr('style');
        }
    };
});