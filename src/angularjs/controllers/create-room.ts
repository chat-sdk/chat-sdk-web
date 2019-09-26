import * as angular from 'angular';

import { ShowCreateChatBox } from '../keys/defines';
import { RoomType } from '../keys/room-type';
import { IRoomCreator } from '../services/room-creator';
import { IRoomOpenQueue } from '../services/room-open-queue';
import { Log } from '../services/log';
import { IStringAnyObject } from '../interfaces/string-any-object';

export interface ICreateRoomScope extends ng.IScope {
  focusName: boolean;
  public: boolean;
  room: IStringAnyObject;
  showMainBox(): void;
}

class CreateRoomController {

  static $inject = ['$scope', 'RoomCreator', 'RoomOpenQueue'];

  constructor(
    private $scope: ICreateRoomScope,
    private RoomCreator: IRoomCreator,
    private RoomOpenQueue: IRoomOpenQueue,
  ) {
    this.clearForm();

    $scope.$on(ShowCreateChatBox, () => {
      Log.notification(ShowCreateChatBox, 'CreateRoomController');
      $scope.focusName = true;
    });
  }

  async createRoom() {

    const room = await (() => {
      // Is this a public room?
      if (this.$scope.public) {
        return this.RoomCreator.createAndPushPublicRoom(
          this.$scope.room.name,
          this.$scope.room.description
        );
      }
      else {
        return this.RoomCreator.createAndPushRoom(
          null,
          this.$scope.room.name,
          this.$scope.room.description,
          this.$scope.room.invitesEnabled,
          RoomType.OneToOne,
          true,
        );
      }
    })();

    this.RoomOpenQueue.addRoomWithID(room.getRID());
    room.open(0)

    this.back();
  }

  back() {
    this.clearForm();
    this.$scope.showMainBox();
  }

  clearForm() {
    this.$scope.room = {
      invitesEnabled: false,
      name: null,
      description: null
    };
  }

}

angular.module('myApp.controllers').controller('CreateRoomController', CreateRoomController);
