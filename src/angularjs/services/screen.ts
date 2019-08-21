import * as angular from 'angular'
import {N} from "../keys/notification-keys";

export interface IScreen {

}

angular.module('myApp.services').factory('Screen', ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage', function ($rootScope, $timeout, $document, $window, LocalStorage) {

    let screen = {

        //rooms: [],
        screenWidth: 0,
        screenHeight: 0,

        init: function () {

            // Set the screen width and height
            this.updateScreenSize();

            // Monitor the window size
            angular.element($window).bind('resize', () => {
                this.updateScreenSize();
            });

            return this;
        },

        // TODO: Check this
        updateScreenSize: function () {
            this.screenWidth = $window.innerWidth;//$document.width();
            this.screenHeight = $window.innerHeight;

            $rootScope.$broadcast(N.ScreenSizeChanged);
        }

    };
    return screen.init();
}]);