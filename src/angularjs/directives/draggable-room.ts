import * as angular from 'angular';
import * as $ from 'jquery';

import { N } from '../keys/notification-keys';
import { Dimensions } from '../keys/dimensions';
import { IRoomScope } from '../controllers/chat';
import { Utils } from '../services/utils';
import { IRoomPositionManager } from '../services/room-position-manager';

export interface IDraggableRoom extends ng.IDirective {

}

class DraggableRoom implements IDraggableRoom {

    static $inject = ['$rootScope', '$document', '$timeout', 'RoomPositionManager'];

    constructor(
        private $rootScope: IRoomScope,
        private $document: ng.IDocumentService, 
        private $timeout: ng.ITimeoutService,
        private RoomPositionManager: IRoomPositionManager
    ) { }

    link(scope: IRoomScope, element: JQLite) {
        let lastClientX = 0;

        console.log('Add draggable room directive');

        // Set the room as draggable - this will interact
        // with the layout manager i.e. draggable rooms
        // will be animated to position whereas non-draggable
        // rooms will be moved position manually
        scope.room.draggable = true;

        $(element).mousedown((e) => {

            // If the user clicked in the text box
            // then don't drag
            if (this.$rootScope.disableDrag) {
                return true;
            }

            if (scope.resizing) {
                return;
            }

            scope.room.zIndex = 1000;

            $(element).stop(true, false);

            scope.startDrag();

            scope.dragging = true;
            lastClientX = e.clientX;

            return false;
        });

        $(document).mousemove((e) => {

            if (scope.dragging && !this.$rootScope.disableDrag) {

                Utils.stopDefault(e);

                let dx = lastClientX - e.clientX;

                // We must be moving in either a positive direction
                if (dx === 0) {
                    return false;
                }

                // Modify the chat's offset
                scope.room.dragDirection = dx;
                scope.room.setOffset(scope.room.offset + dx);

                lastClientX = e.clientX;

                // Apply constraints
                scope.room.offset = Math.max(scope.room.offset, Dimensions.MainBoxWidth + Dimensions.ChatRoomSpacing);
                scope.room.offset = Math.min(scope.room.offset, this.RoomPositionManager.effectiveScreenWidth() - scope.room.width - Dimensions.ChatRoomSpacing);

                scope.wasDragged();

                this.RoomPositionManager.roomDragged(scope.room);

                // Apply the change
                this.$timeout(() => {
                    scope.$digest();
                });

                return false;
            }
        });

        $(document).mouseup((e) => {
            if (scope.dragging) {

                scope.dragging = false;

                this.$rootScope.$broadcast(N.AnimateRoom, {
                    room: scope.room
                });

            }
        });
    }

    static factory(): ng.IDirectiveFactory {
        return ($rootScope: IRoomScope, $document: ng.IDocumentService, $timeout: ng.ITimeoutService, RoomPositionManager: IRoomPositionManager) => new DraggableRoom($rootScope, $document, $timeout, RoomPositionManager);
    }

}

angular.module('myApp.directives').directive('draggableRoom', DraggableRoom.factory());
