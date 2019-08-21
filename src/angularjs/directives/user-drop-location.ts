import * as angular from 'angular'
import {NotificationTypeAlert} from "../keys/defines";
import * as $ from 'jquery'
import {IRoomScope} from "../controllers/chat";
import {UserStatus} from "../keys/user-status";

angular.module('myApp.directives').directive('userDropLocation', ['$rootScope', 'RoomFactory', function ($rootScope, RoomFactory) {
    return function (scope: IRoomScope, elm, attrs) {

        $(elm).mouseenter((e) => {
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                $rootScope.userDrag.dropLoc = true;
            }
        });

        $(elm).mouseleave((e) => {
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                $rootScope.userDrag.dropLoc = false;
            }
        });

        $(elm).mouseup((e) => {
            // Add the user to this chat
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                // Is the user already a member of this room?

                // This isn't really needed since it's handled with security rules
                RoomFactory.addUserToRoom(scope.room.rid(), $rootScope.userDrag.user, UserStatus.Member).then(() => {
                    // Update the room's type
                    scope.room.updateType();
                }, (error) => {
                    $rootScope.showNotification(NotificationTypeAlert, "Error", error.message, "Ok");
                });
            }
        });
    };
}]);