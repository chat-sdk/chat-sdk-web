import * as angular from 'angular';

import { ShowCreateChatBox } from '../keys/defines';
import { RoomType } from '../keys/room-type';
import { IRoomCreator, IRoom } from '../entities/room';
import { IRoomOpenQueue } from '../services/room-open-queue';
import { Log } from '../services/log';
import { StringAnyObject } from '../interfaces/string-any-object';

export interface CreateRoomScope extends ng.IScope {
  focusName: boolean;
  public: boolean;
  room: StringAnyObject;
  showMainBox(): void;
}

class CreateRoomController {

  static $inject = ['$scope', 'RoomCreator', 'RoomOpenQueue'];

  constructor(
    private $scope: CreateRoomScope,
    private RoomCreator: IRoomCreator,
    private RoomOpenQueue: IRoomOpenQueue,
  ) {
    this.clearForm();

    $scope.$on(ShowCreateChatBox , () => {
      Log.notification(ShowCreateChatBox, 'CreateRoomController');
      $scope.focusName = true;
    });
  }

  async createRoom() {

    const room = await (() => {
      // Is this a public room?
      if (this.$scope.public) {
        return this.RoomCreator.createPublicRoom(
          this.$scope.room.name,
          this.$scope.room.description
        );
      }
      else {
        return this.RoomCreator.createRoom(
          this.$scope.room.name,
          this.$scope.room.description,
          this.$scope.room.invitesEnabled,
          RoomType.OneToOne
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
