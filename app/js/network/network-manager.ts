import * as angular from 'angular'
import {IUploadHandler} from "./upload-handler";
import {IFirebaseUploadHandler} from "./firebase-upload-handler";
import {AbstractAuthenticationHandler, IAuthenticationHandler} from "./abstract-authentication-handler";
import {IAuth} from "./auth";

export interface INetworkManager {
    upload: IUploadHandler
    auth: IAuthenticationHandler
}

class NetworkManager implements INetworkManager {

    static $inject = ['FirebaseUploadHandler', 'AbstractAuthenticationHandler'];

    upload: IUploadHandler;
    auth: IAuthenticationHandler;

    constructor (FirebaseUploadHandler: IFirebaseUploadHandler, AbstractAuthenticationHandler: IAuthenticationHandler) {
        this.upload = FirebaseUploadHandler;
        this.auth = AbstractAuthenticationHandler;
    }

}

angular.module('myApp.services').service('NetworkManager', NetworkManager);