import * as angular from 'angular';

import { IUploadHandler } from './upload-handler';
import { IFirebaseUploadHandler } from './firebase-upload-handler';
import { IAuthenticationHandler } from './abstract-authentication-handler';

export interface INetworkManager {
    upload: IUploadHandler;
    auth: IAuthenticationHandler;
}

class NetworkManager implements INetworkManager {

    static $inject = ['FirebaseUploadHandler', 'AbstractAuthenticationHandler'];

    upload: IUploadHandler;
    auth: IAuthenticationHandler;

    constructor(
        private FirebaseUploadHandler: IFirebaseUploadHandler,
        private AbstractAuthenticationHandler: IAuthenticationHandler
    ) {
        this.upload = FirebaseUploadHandler;
        this.auth = AbstractAuthenticationHandler;
    }

}

angular.module('myApp.services').service('NetworkManager', NetworkManager);
