import * as angular from 'angular'
import * as $ from 'jquery'


angular.module('myApp.directives').directive('disableDrag', ['$rootScope','$document', function ($rootScope, $document) {
    return {
        link: function (scope, elm, attrs) {

            $(elm).mousedown((e) => {
                $rootScope.disableDrag = true;
            });

            // TODO: Check this MM1
            $(document).mouseup((e) => {
                $rootScope.disableDrag = false;
            });

            // $document.mouseup((e) => {
            //     $rootScope.disableDrag = false;
            // });
        }
    };
}]);
