import * as angular from 'angular'
import {RoomFlashHeaderNotification} from "../keys/notification-keys";
import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('ccFlash', ['$timeout', 'Config', function ($timeout, Config) {
    return function (scope: IRoomScope, element, attr) {

        let originalColor = element.css('background-color');
        let originalTag = element.attr('cc-flash');
        let animating = false;

        scope.$on(RoomFlashHeaderNotification, function (event, room, color, period, tag) {
            if(scope.room == room && color && period && !animating) {
                if(!tag || tag == originalTag) {
                    animating = true;

                    element.css('background-color', color);

                    $timeout(function () {
                        scope.$digest();
                    });

                    // Set another timeout
                    $timeout(function () {
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