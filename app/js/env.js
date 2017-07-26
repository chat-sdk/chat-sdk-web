var myApp = angular.module('myApp.environment', []);

myApp.factory('Environment', ['$rootScope', function ($rootScope) {

    var env = {

        init: function () {
            $rootScope.partialsURL = this.partialsURL();
            return this;
        },

        firebaseConfig: function () {
            return this.options().firebaseConfig;
        },

        options: function () {
            return ChatSDKOptions;
        },

        showOnPaths: function () {
            return this.options().showOnPaths;
        },

        rootURL: function () {
            if(this.options().environment == 'test') {
                return document.location.origin + '/';
            }
            else {
                return 'https://' + this.firebaseConfig().authDomain + '/';
            }
        },

        partialsURL: function () {
            return this.rootURL() + 'partials/';
        },

        imagesURL: function () {
            return this.rootURL() + 'img/';
        },

        audioURL: function () {
            return this.rootURL() + 'audio/';
        },

        defaultProfilePictureURL: function () {
            return this.imagesURL() + 'cc-100-profile-pic.png';
        },

        defaultRoomPictureURL: function () {
            return this.imagesURL() + 'cc-100-room-pic.png';
        },

        facebookAppID: function () {
            return this.options().facebookAppID;
        },

        cloudImageToken: function () {
            return this.options().cloudImageToken;
        },

        rootPath: function () {
            return this.options().rootPath;
        }


    };

    return env.init();

}]);