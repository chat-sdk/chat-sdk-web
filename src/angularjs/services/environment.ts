import * as angular from 'angular'
import {ChatSDKConfig} from "../app/config";
import {Utils} from "./utils";

export interface IEnvironment {
    firebaseConfig(): any
    config(): any
    partialsURL(): string
    defaultProfilePictureURL(): string
}

class Environment implements IEnvironment {

    static $inject = ['$rootScope'];

    constructor (private $rootScope) {
        $rootScope.partialsURL = this.partialsURL();
    }

    firebaseConfig(): any {
        return this.config().firebaseConfig;
    }

    config(): any {
        return ChatSDKConfig;
    }

    showOnPaths() {
        return this.config().showOnPaths;
    }

    rootURL() {
        if(this.config().environment == 'test') {
            return document.location.origin + '/';
        }
        else {
            return 'https://' + this.firebaseConfig().authDomain + '/';
        }
    }

    partialsURL(): string {
        return this.resourceRootURL() + 'assets/partials/';
    }

    imagesURL() {
        return this.resourceRootURL() + 'assets/img/';
    }

    audioURL() {
        return this.resourceRootURL() + 'assets/audio/';
    }

    defaultProfilePictureURL() {
        return this.imagesURL() + 'cc-100-profile-pic.png';
    }

    defaultRoomPictureURL() {
        return this.imagesURL() + 'cc-100-room-pic.png';
    }

    facebookAppID() {
        return this.config().facebookAppID;
    }

    cloudImageToken() {
        return this.config().cloudImageToken;
    }

    resourceRootURL() {
        let url = this.config().resourceRootURL;
        if(!Utils.unORNull(url)) {
            if(!(url[url.length - 1] == '/')) {
                url += '/';
            }
            return url;
        }
        return this.rootURL();
    }

    rootPath() {
        return this.config().rootPath;
    }
}

angular.module('myApp.services').service('Environment', Environment);