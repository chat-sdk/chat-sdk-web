angular.module('myApp.services').factory('Log', [function () {
    return {
        notification: function (notification, context) {
            if(DEBUG) {
                if(!context)
                    context = "";
                else
                    context = ", context: " + context;
                console.log("Notification: " + notification + context);
            }
        }
    };
}]);