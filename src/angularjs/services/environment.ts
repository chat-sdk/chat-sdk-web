import * as angular from 'angular';

import { ChatSDKConfig } from '../app/config';
import { Utils } from './utils';
import { IRootScope } from '../interfaces/root-scope';
import { IFirebaseConfig } from '../interfaces/firebase-config';
import { IChatSDKConfig } from '../interfaces/chat-sdk-config';

export interface IEnvironment {
  audioURL(): string;
  cloudImageToken(): string;
  config(): any;
  defaultProfilePictureURL(): string;
  defaultRoomPictureURL(): string;
  firebaseConfig(): any;
  imagesURL(): string;
  partialsURL(): string;
  rootPath(): string
  showOnPaths(): string;
}

class Environment implements IEnvironment {

  static $inject = ['$rootScope'];

  constructor(private $rootScope: IRootScope) {
    $rootScope.partialsURL = this.partialsURL();
  }

  firebaseConfig(): IFirebaseConfig {
    return this.config().firebaseConfig;
  }

  config(): IChatSDKConfig {
    return ChatSDKConfig;
  }

  showOnPaths(): string {
    return this.config().showOnPaths;
  }

  rootURL(): string {
    if (this.config().environment == 'test') {
      return document.location.origin + '/';
    }
    else {
      return 'https://' + this.firebaseConfig().authDomain + '/';
    }
  }

  partialsURL(): string {
    return this.resourceRootURL() + 'assets/partials/';
  }

  imagesURL(): string {
    return this.resourceRootURL() + 'assets/img/';
  }

  audioURL(): string {
    return this.resourceRootURL() + 'assets/audio/';
  }

  defaultProfilePictureURL(): string {
    return this.imagesURL() + 'cc-100-profile-pic.png';
  }

  defaultRoomPictureURL(): string {
    return this.imagesURL() + 'cc-100-room-pic.png';
  }

  facebookAppID(): string {
    return this.config().facebookAppID;
  }

  cloudImageToken(): string {
    return this.config().cloudImageToken;
  }

  resourceRootURL(): string {
    let url = this.config().resourceRootURL;
    if (!Utils.unORNull(url)) {
      if (!(url[url.length - 1] == '/')) {
        url += '/';
      }
      return url;
    }
    return this.rootURL();
  }

  rootPath(): string {
    return this.config().rootPath;
  }

}

angular.module('myApp.services').service('Environment', Environment);
