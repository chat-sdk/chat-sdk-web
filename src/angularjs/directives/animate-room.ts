import * as angular from 'angular';
import * as $ from 'jquery';

import { N } from '../keys/notification-keys';
import { IRoomScope } from '../controllers/chat';
import { Utils } from '../services/utils';
import { Log } from '../services/log';
import { IRoomPositionManager } from '../services/room-position-manager';

export interface IAnimateRoom extends ng.IDirective {

}

class AnimateRoom implements IAnimateRoom {

    static $inject = ['$timeout', 'RoomPositionManager'];

    constructor(
        private $timeout: ng.ITimeoutService,
        private RoomPositionManager: IRoomPositionManager,
    ) { }

    link(scope: IRoomScope, element: JQLite) {
        scope.$on(N.AnimateRoom, (event, args) => {

            Log.notification(N.AnimateRoom, 'animateRoom');

            if (args.room == scope.room) {

                if (!Utils.unORNull(args.slot)) {
                    scope.room.slot = args.slot;
                }

                // Get the final offset
                const toOffset = this.RoomPositionManager.offsetForSlot(scope.room.slot);

                // Stop the previous animation
                $(element).stop(true, false);

                let completion = function () {
                    scope.room.setOffset(toOffset);

                    scope.room.zIndex = null;

                    this.RoomPositionManager.updateAllRoomActiveStatus();

                    this.$timeout(() => {
                        scope.$digest();
                    });
                };

                if (!Utils.unORNull(args.duration) && args.duration == 0) {
                    completion();
                } else {
                    // Animate the chat room into position
                    $(element).animate({right: toOffset}, !Utils.unORNull(args.duration) ? args.duration : 300, () => {
                        completion.bind(this)();
                    });
                }
            }
        });
    }

    static factory() {
        return ($timeout: ng.ITimeoutService, RoomPositionManager: IRoomPositionManager) => new AnimateRoom($timeout, RoomPositionManager);
    }

}

angular.module('myApp.directives').directive('animateRoom', AnimateRoom.factory());
