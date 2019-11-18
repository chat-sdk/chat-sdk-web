import * as angular from 'angular';
import * as FileSaver from 'file-saver';

import { DEBUG } from '../keys/defines';
import { IRoom } from '../entities/room';
import { IEnvironment } from '../services/environment';

class ChatSettingsController {

  static $inject = ['Environment'];

  room: IRoom;
  img_24_save: string;
  img_24_copy: string;
  img_24_cross: string;

  constructor(private Environment: IEnvironment) {
    this.img_24_save = this.Environment.imagesURL() + 'cc-24-save.png';
    this.img_24_copy = this.Environment.imagesURL() + 'cc-24-copy.png';
    this.img_24_cross = this.Environment.imagesURL() + 'cc-24-cross.png';
  }

  copyTranscript() {
    window.prompt('Copy to clipboard: Ctrl+C, Enter', this.room.transcript());
  }

  saveTranscript() {
    const t = this.room.transcript();

    if (DEBUG) { console.log(t); }

    FileSaver.saveAs(new Blob([t], { type: 'text/plain;charset=utf-8' }), this.room.name + '-transcript.txt');
  }

  leaveRoom() {
    this.room.close();
    this.room.leave();
  }

}

angular.module('myApp.components').component('chatSettings', {
  templateUrl: '/assets/partials/chat-settings.html',
  controller: ChatSettingsController,
  controllerAs: 'ctrl',
  bindings: {
    room: '<'
  },
});
