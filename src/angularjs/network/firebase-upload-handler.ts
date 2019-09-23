import * as angular from 'angular';
import * as firebase from 'firebase';

import { IUploadHandler } from './upload-handler';

export interface IFirebaseUploadHandler extends IUploadHandler {
  uuid(): string;
}

class FirebaseUploadHandler implements IFirebaseUploadHandler {

  $q: ng.IQService;

  $inject = ['$q'];

  constructor($q: ng.IQService) {
    this.$q = $q;
  }

  async uploadFile(file: File): Promise<any> {
    // Create a root reference
    const storageRef = firebase.storage().ref();

    // Create a reference to 'mountains.jpg'
    const ref = storageRef.child('web/' + this.uuid() + '.jpg');

    await ref.put(file);
    const downloadURL = await ref.getDownloadURL();
    console.log('File available at', downloadURL);
  }

  uuid(): string {
    const s4 = () => {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

}

angular.module('myApp.services').service('FirebaseUploadHandler', FirebaseUploadHandler);
