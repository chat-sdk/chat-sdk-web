import * as angular from 'angular'

angular.module('myApp.directives').directive('enterSubmit', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {

            elem.bind('keydown', function(event) {
                let code = event.keyCode || event.which;

                if (code === 13) {
                    if (!event.shiftKey) {
                        event.preventDefault();
                        scope.$apply(attrs.enterSubmit);

                        // Scroll down on enter too
                        scope.$broadcast('enterScrollDown');

                    }
                }
            });
        }
    };
});
