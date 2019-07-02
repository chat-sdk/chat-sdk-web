import * as angular from 'angular'
import * as $ from 'jquery'

import {ChatRoomSpacing, MainBoxWidth} from "../keys/dimensions";
import {AnimateRoomNotification} from "../keys/notification-keys";
import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('draggableRoom', ['$rootScope', '$document', '$timeout', 'RoomPositionManager', 'Utils', function ($rootScope, $document, $timeout, RoomPositionManager, Utils) {

    return function (scope: IRoomScope, elm, attrs) {

        let lastClientX = 0;

        // Set the room as draggable - this will interact
        // with the layout manager i.e. draggable rooms
        // will be animated to position whereas non-draggable
        // rooms will be moved position manually
        scope.room.draggable = true;

        $(elm).mousedown((function (e) {

            // If the user clicked in the text box
            // then don't drag
            if($rootScope.disableDrag) {
                return true;
            }

            if(scope.resizing) {
                return;
            }

            scope.room.zIndex = 1000;

            $(elm).stop(true, false);

            scope.startDrag();

            scope.dragging = true;
            lastClientX = e.clientX;

            return false;
        }).bind(this));

        $document.mousemove((function (e) {

            if(scope.dragging && !$rootScope.disableDrag) {

                Utils.stopDefault(e);

                let dx = lastClientX - e.clientX;

                // We must be moving in either a positive direction
                if(dx === 0) {
                    return false;
                }

                // Modify the chat's offset
                scope.room.dragDirection = dx;
                scope.room.setOffset(scope.room.offset + dx);

                lastClientX = e.clientX;

                // Apply constraints
                scope.room.offset = Math.max(scope.room.offset, MainBoxWidth + ChatRoomSpacing);
                scope.room.offset = Math.min(scope.room.offset, RoomPositionManager.effectiveScreenWidth() - scope.room.width - ChatRoomSpacing);

                scope.wasDragged();

                RoomPositionManager.roomDragged(scope.room);

                // Apply the change
                $timeout(function () {
                    scope.$digest();
                });

                return false;
            }
        }).bind(this));

        $document.mouseup((function (e) {
            if(scope.dragging) {

                scope.dragging = false;

                $rootScope.$broadcast(AnimateRoomNotification, {
                    room: scope.room
                });

            }
        }).bind(this));
    };
}]);