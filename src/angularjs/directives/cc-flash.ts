import * as angular from 'angular'


import {N} from "../keys/notification-keys";
import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('ccFlash', ['$timeout', 'Config', function ($timeout, Config) {
    return function (scope: IRoomScope, element, attr) {

        let originalColor = element.css('background-color');
        let originalTag = element.attr('cc-flash');
        let animating = false;

        scope.$on(N.RoomFlashHeader, (event, room, color, period, tag) => {
            if(scope.room == room && color && period && !animating) {
                if(!tag || tag == originalTag) {
                    animating = true;

                    element.css('background-color', color);

                    $timeout(() => {
                        scope.$digest();
                    });

                    // Set another timeout
                    $timeout(() => {
                        if(tag == "room-header") {
                            originalColor = Config.headerColor;
                        }
                        element.css('background-color', originalColor);
                        scope.$digest();
                        animating = false;
                    }, period);
                }
            }
        });
    };
}]);