import * as angular from 'angular'

angular.module('myApp.services').factory('NetworkManager', ['$q', 'FirebaseUploadHandler', 'Interface', function ($q, FirebaseUploadHandler, Interface) {
    let nm = {

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