import * as angular from 'angular'

angular.module('myApp.directives').directive('onFileChange', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('change' , () =>{
                scope.$eval(attrs.onFileChange);
            });
        }
    };
});
