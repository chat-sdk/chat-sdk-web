import * as angular from 'angular'

angular.module('myApp.directives').directive('ccFocus', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            scope.$watch(attr.ccFocus, function (n, o) {
                if (n !== 0 && n) {
                    element[0].focus();
                }
            });
        }
    };
});
