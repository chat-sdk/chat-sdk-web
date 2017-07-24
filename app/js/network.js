/**
 * Created by benjaminsmiley-andrews on 19/07/17.
 */

var myApp = angular.module('myApp.network', ['firebase', 'facebook']).
    value('version', '0.1');

myApp.factory('NetworkManager', ['$q', 'FirebaseUploadHandler', 'Interface', function ($q, FirebaseUploadHandler, Interface) {
    var nm = {

        init: function () {
            this.upload = FirebaseUploadHandler;
        },

        // This defines the file upload interface.
        upload: {
            uploadFile: function () {  Interface.log(arguments.callee.name, true) }
        }

    };
    nm.init();
    return nm;
}]);

myApp.factory('Interface', [function () {
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