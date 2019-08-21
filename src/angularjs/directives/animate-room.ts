import * as angular from 'angular'
import * as $ from 'jquery'

import {N} from "../keys/notification-keys";
import {IRoomScope} from "../controllers/chat";
import {Utils} from "../services/utils";
import {Log} from "../services/log";

angular.module('myApp.directives').directive('animateRoom', ['$timeout', 'RoomPositionManager', function ($timeout, RoomPositionManager) {
    return function (scope: IRoomScope, elm) {

        scope.$on(N.AnimateRoom, (event, args) => {

            Log.notification(N.AnimateRoom, 'animateRoom');

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

                    $timeout(() => {
                        scope.$digest();
                    });
                };

                if(!Utils.unORNull(args.duration) && args.duration == 0) {
                    completion();
                }
                else {
                    // Animate the chat room into position
                    $(elm).animate({right: toOffset}, !Utils.unORNull(args.duration) ? args.duration : 300 , () =>{
                        completion();
                    });
                }
            }
        });
    };
}]);