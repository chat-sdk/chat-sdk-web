angular.module('myApp.directives').directive('onFileChange', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('change', function () {
                scope.$eval(attrs.onFileChange);
            });
        }
    };
});
