import * as angular from 'angular'
import {AnimateRoomNotification} from "../keys/notification-keys";

angular.module('myApp.directives').directive('animateRoom', ['$timeout', 'RoomPositionManager', 'Log', 'Utils', function ($timeout, RoomPositionManager, Log, Utils) {
    return function (scope, elm) {

        scope.$on(AnimateRoomNotification, (function (event, args) {

            Log.notification(AnimateRoomNotification, 'animateRoom');

            if(args.room == scope.room) {

                if(!Utils.unORNull(args.slot)) {
                    scope.room.slot = args.slot;
                }

                // Get the final offset
                var toOffset = RoomPositionManager.offsetForSlot(scope.room.slot);

                // Stop the previous animation
                elm.stop(true, false);

                var completion = function () {
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
                    elm.animate({right: toOffset}, !Utils.unORNull(args.duration) ? args.duration : 300, function () {
                        completion();
                    });
                }
            }
        }).bind(this));
    };
}]);