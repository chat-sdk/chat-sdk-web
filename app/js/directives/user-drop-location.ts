import * as angular from 'angular'
import {UserStatusMember} from "../keys/user-status";
import {NotificationTypeAlert} from "../keys/defines";
import $ from 'jQuery'

angular.module('myApp.directives').directive('userDropLocation', ['$rootScope', 'Room', function ($rootScope, Room) {
    return function (scope, elm, attrs) {

        $(elm).mouseenter(function(e) {
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                $rootScope.userDrag.dropLoc = true;
            }
        });

        $(elm).mouseleave(function(e) {
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                $rootScope.userDrag.dropLoc = false;
            }
        });

        $(elm).mouseup((function(e) {
            // Add the user to this chat
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                // Is the user already a member of this room?

                // This isn't really needed since it's handled with security rules
                //if(!scope.room.userIsMember($rootScope.userDrag.user)) {
                Room.addUserToRoom(scope.room.rid(), $rootScope.userDrag.user, UserStatusMember).then(function () {
                    // Update the room's type
                    scope.room.updateType();
                }, function (error) {
                    $rootScope.showNotification(NotificationTypeAlert, "Error", error.message, "Ok");
                });
                //}
            }
        }).bind(this));
    };
}]);