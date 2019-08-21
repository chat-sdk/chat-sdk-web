import * as $ from 'jquery'
import * as angular from 'angular'


import {N} from "../keys/notification-keys";

angular.module('myApp.directives').directive('socialIframe', ["$rootScope", "$document", "$window", "Paths", function ($rootScope, $document, $window, Paths) {
    return function (scope, element, attr) {

        $rootScope.$on(N.StartSocialLogin, (event, data, callback) => {

            //element.load(function () {

//                let data = {
//                    action: 'github',
//                    path: Paths.firebase().toString()
//                };

            // Add the event listener
            let eventMethod = $window.addEventListener ? "addEventListener" : "attachEvent";
            let eventer = $window[eventMethod];
            let messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

            eventer(messageEvent, (e) => {
                if (e.data) {
                    let data = JSON.parse(e.data);
                    if(data.provider == 'chatcat') {
                        callback(data);
                    }
                }
//                    else {
//                        callback(null);
//                    }
            });

            $(element).get(0).contentWindow.postMessage(JSON.stringify(data), "*");
            //});
        });
    };
}]);