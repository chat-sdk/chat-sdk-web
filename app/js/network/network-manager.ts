import * as angular from 'angular'
import {IUploadHandler} from "./upload-handler";
import {IFirebaseUploadHandler} from "./firebase-upload-handler";

export interface INetworkManager {
    upload: IUploadHandler
}

class NetworkManager implements INetworkManager {

    static $inject = ['FirebaseUploadHandler'];

    upload: IUploadHandler;

    constructor (FirebaseUploadHandler: IFirebaseUploadHandler) {
        this.upload = FirebaseUploadHandler
    }

}

angular.module('myApp.services').service('NetworkManager', NetworkManager);