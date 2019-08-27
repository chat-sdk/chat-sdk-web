import * as angular from 'angular'


import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('fitText', function () {

    return {
        link: function(scope: IRoomScope, element, attr) {

            element.bind('keyup', function (e) {
                //jQuery(element).height(0);
                //let height = jQuery(element)[0].scrollHeight;
                let height = element.prop('scrollHeight');

                // 8 is for the padding
                if (height < 26) {
                    height = 26;
                }

                // If we go over the max height
                let maxHeight = eval(attr.fitText);
                if (height > maxHeight) {
                    height = maxHeight;
                    element.css({overflow: 'auto'});
                } else {
                    element.css({overflow: 'hidden'});
                }

                scope.$apply(() => {
                    scope.inputHeight = height;
                });

                element.css({'max-height': height + 'px'});
                element.css({'height': height + 'px'});

            });
        }
    };
});