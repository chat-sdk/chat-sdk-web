angular.module('myApp.directives').directive('ccFlash', ['$timeout', 'Config', function ($timeout, Config) {
    return function (scope, element, attr) {

//        var originalColor = Config.headerColor;

        let originalColor = element.css('background-color');
        let originalTag = element.attr('cc-flash');
        let animating = false;

        scope.$on(bRoomFlashHeaderNotification, function (event, room, color, period, tag) {
            if(scope.room == room && color && period && !animating) {
                if(!tag || tag == originalTag) {
                    animating = true;

                    element.css('background-color', color);

                    $timeout(function () {
                        scope.$digest();
                    });

                    // Set another timeout
                    $timeout(function () {
                        if(tag == "room-header") {
                            originalColor = Config.headerColor;
                        }
                        element.css('background-color', originalColor);
                        scope.$digest();
                        animating = false;
                    }, period);
                }
            }
        });
    };
}]);