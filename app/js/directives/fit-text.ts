import * as angular from 'angular'
import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('fitText', function () {

    return function(scope: IRoomScope, element, attr) {

        element.bind('keyup', function(e) {
            //jQuery(element).height(0);
            //var height = jQuery(element)[0].scrollHeight;
            var height = element.prop('scrollHeight');

            // 8 is for the padding
            if (height < 26) {
                height = 26;
            }

            // If we go over the max height
            var maxHeight = eval(attr.fitText);
            if(height > maxHeight) {
                height = maxHeight;
                element.css({overflow: 'auto'});
            }
            else {
                element.css({overflow: 'hidden'});
            }

            scope.$apply(function () {
                scope.inputHeight = height;
            });

            element.css({'max-height': height});
            element.css({'height': height});

        });
    };
});