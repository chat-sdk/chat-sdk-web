import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { ICache } from '../persistence/cache';
import { IRoom } from '../entities/room';
import { Log } from '../services/log';

export interface IChatBarController {
  rooms: IRoom[];
  updateList(): void;
}

class ChatBarController implements IChatBarController {

  static $inject = ['$scope', '$timeout', 'Cache'];

  rooms = Array<IRoom>();

  constructor(
    private $scope: ng.IScope,
    private $timeout: ng.ITimeoutService,
    private Cache: ICache
  ) {
    $scope.$on(N.RoomOpened, this.updateList.bind(this));
    $scope.$on(N.RoomClosed, this.updateList.bind(this));
    $scope.$on(N.Logout, this.updateList.bind(this));

    $scope.$on(N.UpdateRoomActiveStatus, () => {
      Log.notification(N.UpdateRoomActiveStatus, 'ChatBarController');
      this.updateList();
    });
  }

  updateList() {
    Log.notification(N.RoomOpened + '/' + N.RoomClosed, 'ChatBarController');

    // Only include rooms that are active
    this.rooms = this.Cache.activeRooms();

    this.$timeout(() => {
      this.$scope.$digest();
    })
  }

}

angular.module('myApp.controllers').controller('ChatBarController', ChatBarController);
