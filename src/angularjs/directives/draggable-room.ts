import * as angular from 'angular'
import * as $ from 'jquery'


import {N} from "../keys/notification-keys";
import {IRoomScope} from "../controllers/chat";
import {Dimensions} from "../keys/dimensions";
import {Utils} from "../services/utils";

angular.module('myApp.directives').directive('draggableRoom', ['$rootScope', '$document', '$timeout', 'RoomPositionManager', function ($rootScope, $document, $timeout, RoomPositionManager) {

    return function (scope: IRoomScope, elm, attrs) {

        let lastClientX = 0;

        // Set the room as draggable - this will interact
        // with the layout manager i.e. draggable rooms
        // will be animated to position whereas non-draggable
        // rooms will be moved position manually
        scope.room.draggable = true;

        $(elm).mousedown((e) => {

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
        });

        $document.mousemove((e) => {

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
                scope.room.offset = Math.max(scope.room.offset, Dimensions.MainBoxWidth + Dimensions.ChatRoomSpacing);
                scope.room.offset = Math.min(scope.room.offset, RoomPositionManager.effectiveScreenWidth() - scope.room.width - Dimensions.ChatRoomSpacing);

                scope.wasDragged();

                RoomPositionManager.roomDragged(scope.room);

                // Apply the change
                $timeout(() => {
                    scope.$digest();
                });

                return false;
            }
        });

        $document.mouseup((e) => {
            if(scope.dragging) {

                scope.dragging = false;

                $rootScope.$broadcast(N.AnimateRoom, {
                    room: scope.room
                });

            }
        });
    };
}]);