import * as angular from 'angular'
import * as $ from 'jquery'
import {UserListScope} from "../controllers/user-list";
import {Utils} from "../services/utils";

angular.module('myApp.directives').directive('draggableUser', ['$rootScope','$document', '$timeout', 'Screen', function ($rootScope, $document, $timeout, Screen) {
    return function (scope: UserListScope, elm, attrs) {

        $rootScope.userDrag = {};

        $(elm).mousedown((e) => {
            // Set the current user
            $rootScope.userDrag = {
                user: scope.aUser,
                x:0,
                y:0,
                dragging: true,
                dropLoc:false,
                visible: false
            };

            Utils.stopDefault(e);

            return false;

        });

        $document.mousemove((e) => {

            if($rootScope.userDrag.dragging) {

                $rootScope.userDrag.visible = true;

                $rootScope.userDrag.x = e.clientX - 10;
                $rootScope.userDrag.y = e.clientY - 10;

                // TODO: Don't hardcode these values
                // for some reason .width() isn't working
                // Stop the dragged item going off the screen
                $rootScope.userDrag.x = Math.max($rootScope.userDrag.x, 0);
                $rootScope.userDrag.x = Math.min($rootScope.userDrag.x, Screen.screenWidth - 200);

                $rootScope.userDrag.y = Math.max($rootScope.userDrag.y, 0);
                $rootScope.userDrag.y = Math.min($rootScope.userDrag.y, Screen.screenHeight - 30);

                // If we're in the drop loc
                $timeout(() => {
                    scope.$apply();
                });
            }

        });

        $document.mouseup((e) => {
            if($rootScope.userDrag.dragging) {
                $rootScope.userDrag.dragging = false;
                $rootScope.userDrag.visible = false;

                $timeout(() => {
                    scope.$apply();
                });
            }
        });
    };
}]);