import * as angular from 'angular'
import {ChatSDKConfig} from "../app/config";
import {IUtils} from "./utils";
import {Emoji} from "./emoji";

export interface IEnvironment {
    firebaseConfig()
}

class Environment implements IEnvironment {

    static $inject = ['$rootScope', 'Utils'];

    $rootScope;
    Utils: IUtils;

    constructor ($rootScope, Utils: IUtils) {
        this.$rootScope = $rootScope;
        this.Utils = Utils;
        $rootScope.partialsURL = this.partialsURL();
    }

    firebaseConfig() {
        return this.options().firebaseConfig;
    }

    options() {
        return ChatSDKConfig;
    }

    showOnPaths() {
        return this.options().showOnPaths;
    }

    rootURL() {
        if(this.options().environment == 'test') {
            return document.location.origin + '/';
        }
        else {
            return 'https://' + this.firebaseConfig().authDomain + '/';
        }
    }

    partialsURL() {
        return this.resourceRootURL() + 'partials/';
    }

    imagesURL() {
        return this.resourceRootURL() + 'img/';
    }

    audioURL() {
        return this.resourceRootURL() + 'audio/';
    }

    defaultProfilePictureURL() {
        return this.imagesURL() + 'cc-100-profile-pic.png';
    }

    defaultRoomPictureURL() {
        return this.imagesURL() + 'cc-100-room-pic.png';
    }

    facebookAppID() {
        return this.options().facebookAppID;
    }

    cloudImageToken() {
        return this.options().cloudImageToken;
    }

    resourceRootURL() {
        let url = this.options().resourceRootURL;
        if(!this.Utils.unORNull(url)) {
            if(!(url[url.length - 1] == '/')) {
                url += '/';
            }
            return url;
        }
        return this.rootURL();
    }

    rootPath() {
        return this.options().rootPath;
    }
}

angular.module('myApp.services').service('Environment', Environment);