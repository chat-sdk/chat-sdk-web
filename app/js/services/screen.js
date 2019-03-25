angular.module('myApp.services').factory('Screen', ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage', function ($rootScope, $timeout, $document, $window, LocalStorage) {

    let screen = {

        //rooms: [],
        screenWidth: 0,
        screenHeight: 0,

        init: function () {

            // Set the screen width and height
            this.updateScreenSize();

            // Monitor the window size
            angular.element($window).bind('resize', (function () {
                this.updateScreenSize();
            }).bind(this));

            return this;
        },

        updateScreenSize: function () {
            this.screenWidth = $document.width();
            this.screenHeight = $window.innerHeight;

            $rootScope.$broadcast(ScreenSizeChangedNotification);
        }

    };
    return screen.init();
}]);