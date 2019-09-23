import * as angular from 'angular';

import { IUploadHandler } from './upload-handler';
import { IFirebaseUploadHandler } from './firebase-upload-handler';
import { IAuthenticationHandler } from './abstract-authentication-handler';

export interface INetworkManager {
  auth: IAuthenticationHandler;
  upload: IUploadHandler;
}

class NetworkManager implements INetworkManager {

  static $inject = ['FirebaseUploadHandler', 'AbstractAuthenticationHandler'];

  auth: IAuthenticationHandler;
  upload: IUploadHandler;

  constructor(
    private FirebaseUploadHandler: IFirebaseUploadHandler,
    private AbstractAuthenticationHandler: IAuthenticationHandler
  ) {
    this.upload = FirebaseUploadHandler;
    this.auth = AbstractAuthenticationHandler;
  }

}

angular.module('myApp.services').service('NetworkManager', NetworkManager);
