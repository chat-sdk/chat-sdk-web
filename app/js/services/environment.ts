import * as angular from 'angular'
import {ChatSDKConfig} from "../app/config";

angular.module('myApp.services').factory('Environment', ['$rootScope', 'Utils', function ($rootScope, Utils) {

    var env = {

        init: function () {
            $rootScope.partialsURL = this.partialsURL();
            return this;
        },

        firebaseConfig: function () {
            return this.options().firebaseConfig;
        },

        options: function () {
            return ChatSDKConfig;
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
            return this.resourceRootURL() + 'partials/';
        },

        imagesURL: function () {
            return this.resourceRootURL() + 'img/';
        },

        audioURL: function () {
            return this.resourceRootURL() + 'audio/';
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

        resourceRootURL: function () {
            var url = this.options().resourceRootURL;
            if(!Utils.unORNull(url)) {
                if(!(url[url.length - 1] == '/')) {
                    url += '/';
                }
                return url;
            }
            return this.rootURL();
        },

        rootPath: function () {
            return this.options().rootPath;
        }


    };

    return env.init();

}]);