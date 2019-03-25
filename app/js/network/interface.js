angular.module('myApp.services').factory('Interface', [function () {
    return {
        log: function (name, required) {
            if(required) {
                throw name + " must be implemented";
            }
            else {
                console.log(name + " was called - this is an optional method");
            }
        }

    };
}]);