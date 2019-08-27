import * as angular from 'angular'
import * as $ from 'jquery'

import {IRoomScope} from "../controllers/chat";
import {Dimensions} from "../keys/dimensions";
import {Utils} from "../services/utils";
import {N} from "../keys/notification-keys";

angular.module('myApp.directives').directive('resizeRoom',['$rootScope', '$timeout', '$document', 'Screen', 'RoomPositionManager', function ($rootScope, $timeout, $document, Screen, RoomPositionManager) {
    return {
        link: function(scope: IRoomScope, elm, attrs) {

            let lastClientX = 0;
            let lastClientY = 0;

            $(elm).mousedown((e) => {
                Utils.stopDefault(e);
                scope.resizing = true;
                lastClientX = e.clientX;
                lastClientY = e.clientY;
            });

            $(document).mousemove((e) => {
                if (scope.resizing) {

                    Utils.stopDefault(e);

                    // Min width
                    scope.room.width += lastClientX - e.clientX;
                    scope.room.width = Math.max(scope.room.width, Dimensions.ChatRoomWidth);
                    scope.room.width = Math.min(scope.room.width, RoomPositionManager.effectiveScreenWidth() - scope.room.offset - Dimensions.ChatRoomSpacing);

                    lastClientX = e.clientX;

                    // Min height
                    scope.room.height += lastClientY - e.clientY;
                    scope.room.height = Math.max(scope.room.height, Dimensions.ChatRoomHeight);
                    scope.room.height = Math.min(scope.room.height, Screen.screenHeight - Dimensions.ChatRoomTopMargin);

                    lastClientY = e.clientY;

                    // Update the room's scope
                    $timeout(() => {
                        scope.$digest();
                    });

                    // We've changed the room's size so we need to re-calculate
                    RoomPositionManager.setDirty();

                    // Update the rooms to the left
                    let rooms = RoomPositionManager.getRooms();

                    // Only loop from this room's position onwards
                    let room;
                    for (let i = rooms.indexOf(scope.room); i < rooms.length; i++) {
                        room = rooms[i];
                        if (room != scope.room) {
                            room.setOffset(RoomPositionManager.offsetForSlot(i));
                            $rootScope.$broadcast(N.RoomPositionUpdated, room);
                            RoomPositionManager.updateAllRoomActiveStatus();
                        }
                    }

                    return false;
                }
            });

            $(document).mouseup((e) => {
                if (scope.resizing) {
                    scope.resizing = false;
                }
            });
        }
    };
}]);