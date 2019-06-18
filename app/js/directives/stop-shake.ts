import * as angular from 'angular'
import * as $ from 'jquery'

/**
 * #54
 * This directive is used for scrollbars when the component can
 * also be dragged horizontally. If the user has shaky hands then
 * the chat will shake while they're scrolling. To prevent this
 * we add a listener to hear when they're scrolling.
 */
angular.module('myApp.directives').directive('stopShake', ['$rootScope', '$document',function ($rootScope, $document) {
    return function (scope, elm, attrs) {

        $(elm).scroll(function () {
            $rootScope.disableDrag = true;
        });

        // Allow dragging again on mouse up
        $document.mouseup((function(e) {
            $rootScope.disableDrag = false;
        }).bind(this));
    };
}]);