import * as angular from 'angular'
import {StartSocialLoginNotification} from "../keys/notification-keys";

angular.module('myApp.directives').directive('socialIframe', ["$rootScope", "$document", "$window", "Paths", function ($rootScope, $document, $window, Paths) {
    return function (scope, element, attr) {

        $rootScope.$on(StartSocialLoginNotification, function (event, data, callback) {

            //element.load(function () {

//                var data = {
//                    action: 'github',
//                    path: Paths.firebase().toString()
//                };

            // Add the event listener
            var eventMethod = $window.addEventListener ? "addEventListener" : "attachEvent";
            var eventer = $window[eventMethod];
            var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

            eventer(messageEvent, function(e) {
                if (e.data) {
                    var data = JSON.parse(e.data);
                    if(data.provider == 'chatcat') {
                        callback(data);
                    }
                }
//                    else {
//                        callback(null);
//                    }
            });

            element.get(0).contentWindow.postMessage(JSON.stringify(data), "*");
            //});
        });
    };
}]);