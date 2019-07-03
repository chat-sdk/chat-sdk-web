import * as angular from 'angular'
import * as $ from 'jquery'

import {AnimateRoomNotification} from "../keys/notification-keys";
import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('animateRoom', ['$timeout', 'RoomPositionManager', 'Log', 'Utils', function ($timeout, RoomPositionManager, Log, Utils) {
    return function (scope: IRoomScope, elm) {

        scope.$on(AnimateRoomNotification, (function (event, args) {

            Log.notification(AnimateRoomNotification, 'animateRoom');

            if(args.room == scope.room) {

                if(!Utils.unORNull(args.slot)) {
                    scope.room.slot = args.slot;
                }

                // Get the final offset
                const toOffset = RoomPositionManager.offsetForSlot(scope.room.slot);

                // Stop the previous animation
                $(elm).stop(true, false);

                let completion = function () {
                    scope.room.setOffset(toOffset);

                    scope.room.zIndex = null;

                    RoomPositionManager.updateAllRoomActiveStatus();

                    $timeout(function () {
                        scope.$digest();
                    });
                };

                if(!Utils.unORNull(args.duration) && args.duration == 0) {
                    completion();
                }
                else {
                    // Animate the chat room into position
                    $(elm).animate({right: toOffset}, !Utils.unORNull(args.duration) ? args.duration : 300, function () {
                        completion();
                    });
                }
            }
        }).bind(this));
    };
}]);