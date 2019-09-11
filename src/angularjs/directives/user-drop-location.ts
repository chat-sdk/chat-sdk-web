import * as angular from 'angular';
import * as $ from 'jquery';

import { NotificationTypeAlert } from '../keys/defines';
import { IRoomScope } from '../controllers/chat';
import { UserStatus } from '../keys/user-status';
import { IRootScope } from '../interfaces/root-scope';
import { IRoomFactory } from '../entities/room';

export interface IUserDropLocation extends ng.IDirective {

}

class UserDropLocation implements IUserDropLocation {

    static $inject = ['$rootScope', 'RoomFactory'];

    constructor(
        private $rootScope: IRootScope,
        private RoomFactory: IRoomFactory,
    ) { }

    link(scope: IRoomScope, element: JQLite) {
        $(element).mouseenter((e) => {
            if (this.$rootScope.userDrag && this.$rootScope.userDrag.dragging) {
                this.$rootScope.userDrag.dropLoc = true;
            }
        });

        $(element).mouseleave((e) => {
            if (this.$rootScope.userDrag && this.$rootScope.userDrag.dragging) {
                this.$rootScope.userDrag.dropLoc = false;
            }
        });

        $(element).mouseup((e) => {
            // Add the user to this chat
            if (this.$rootScope.userDrag && this.$rootScope.userDrag.dragging) {
                // Is the user already a member of this room?

                // This isn't really needed since it's handled with security rules
                this.RoomFactory.addUserToRoom(this.$rootScope.userDrag.user, scope.room, UserStatus.Member).then(() => {
                    // Update the room's type
                    scope.room.updateType();
                }, (error) => {
                    this.$rootScope.showNotification(NotificationTypeAlert, 'Error', error.message, 'Ok');
                });
            }
        });
    }

    static factory(): ng.IDirectiveFactory {
        return ($rootScope: IRootScope, RoomFactory: IRoomFactory) => new UserDropLocation($rootScope, RoomFactory);
    }

}

angular.module('myApp.directives').directive('userDropLocation', UserDropLocation.factory());
