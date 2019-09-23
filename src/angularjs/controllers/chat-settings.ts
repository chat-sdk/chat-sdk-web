import * as angular from 'angular';
import * as FileSaver from 'file-saver';

import { DEBUG } from '../keys/defines';
import { IRoomScope } from './chat';
import { IRoom } from '../entities/room';

export interface IChatSettingsController {
  $scope: IRoomScope;
  copyTranscript(): void;
  saveTranscript(): void;
}

class ChatSettingsController implements IChatSettingsController {

  static $inject = ['$scope'];

  public room: IRoom;

  constructor(public $scope: IRoomScope) { }

  copyTranscript() {
    window.prompt('Copy to clipboard: Ctrl+C, Enter', this.$scope.room.transcript());
  }

  saveTranscript() {
    const t = this.$scope.room.transcript();

    if (DEBUG) console.log(t);

    FileSaver.saveAs(new Blob([t], { type: 'text/plain;charset=utf-8' }), this.$scope.room.name + '-transcript.txt');
  }

}

angular.module('myApp.controllers').controller('ChatSettingsController', ChatSettingsController);
