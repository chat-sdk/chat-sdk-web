import * as angular from 'angular';
import * as $ from 'jquery';

import { N } from '../keys/notification-keys';
import { Dimensions } from '../keys/dimensions';
import { IRoomScope } from '../controllers/chat';
import { Utils } from '../services/utils';
import { IScreen } from '../services/screen';
import { IRoomPositionManager } from '../services/room-position-manager';
import { IRootScope } from '../interfaces/root-scope';

export interface IResizeRoom extends ng.IDirective {

}

class ResizeRoom implements IResizeRoom {

    static $inject = ['$rootScope', '$timeout', '$document', 'Screen', 'RoomPositionManager'];

    constructor(
        private $rootScope: IRootScope,
        private $timeout: ng.ITimeoutService,
        private $document: ng.IDocumentService,
        private Screen: IScreen,
        private RoomPositionManager: IRoomPositionManager
    ) { }

    link(scope: IRoomScope, element: JQLite) {
        let lastClientX = 0;
        let lastClientY = 0;

        $(element).mousedown((e) => {
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
                scope.room.width = Math.min(scope.room.width, this.RoomPositionManager.effectiveScreenWidth() - scope.room.offset - Dimensions.ChatRoomSpacing);

                lastClientX = e.clientX;

                // Min height
                scope.room.height += lastClientY - e.clientY;
                scope.room.height = Math.max(scope.room.height, Dimensions.ChatRoomHeight);
                scope.room.height = Math.min(scope.room.height, this.Screen.screenHeight - Dimensions.ChatRoomTopMargin);

                lastClientY = e.clientY;

                // Update the room's scope
                this.$timeout(() => {
                    scope.$digest();
                });

                // We've changed the room's size so we need to re-calculate
                this.RoomPositionManager.setDirty();

                // Update the rooms to the left
                let rooms = this.RoomPositionManager.getRooms();

                // Only loop from this room's position onwards
                let room;
                for (let i = rooms.indexOf(scope.room); i < rooms.length; i++) {
                    room = rooms[i];
                    if (room != scope.room) {
                        room.setOffset(this.RoomPositionManager.offsetForSlot(i));
                        this.$rootScope.$broadcast(N.RoomPositionUpdated, room);
                        this.RoomPositionManager.updateAllRoomActiveStatus();
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

    static factory(): ng.IDirectiveFactory {
        return ($rootScope: IRootScope, $timeout: ng.ITimeoutService, $document: ng.IDocumentService, Screen: IScreen, RoomPositionManager: IRoomPositionManager) => new ResizeRoom($rootScope, $timeout, $document, Screen, RoomPositionManager);
    }

}

angular.module('myApp.directives').directive('resizeRoom', ResizeRoom.factory());
