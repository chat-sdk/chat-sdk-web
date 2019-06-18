import * as angular from 'angular'
import * as Defines from "../keys/defines";

angular.module('myApp.services').factory('Log', [function () {
    return {
        notification: function (notification, context) {
            if(Defines.DEBUG) {
                if(!context)
                    context = "";
                else
                    context = ", context: " + context;
                console.log("Notification: " + notification + context);
            }
        }
    };
}]);