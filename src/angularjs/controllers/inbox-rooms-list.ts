import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IRoomStore } from '../persistence/room-store';
import { IRoom } from '../entities/room';

export interface IInboxRoomsListScope extends ng.IScope {
  activeTab: string;
  allRooms: IRoom[];
  rooms: IRoom[];
  search: { [key: string]: string };
  updateList(): void;
}

export interface IInboxRoomsListController {

}

class InboxRoomsListController implements IInboxRoomsListController {

  static $inject = ['$scope', '$timeout', 'RoomStore'];

  constructor(
    private $scope: IInboxRoomsListScope,
    private $timeout: ng.ITimeoutService,
    private RoomStore: IRoomStore,
  ) {
    // $scope properties
    $scope.rooms = [];
    $scope.allRooms = [];

    // $scope methods
    $scope.updateList = this.updateList.bind(this);

    $scope.$on(N.RoomAdded, () => {
      Log.notification(N.RoomAdded, 'InboxRoomsListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.RoomRemoved, () => {
      Log.notification(N.RoomRemoved, 'InboxRoomsListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.LoginComplete, () => {
      Log.notification(N.LoginComplete, 'InboxRoomsListController');
      RoomStore.loadPrivateRoomsToMemory();
      this.updateList.bind(this)();
    });

    // Update the list if the user count on a room changes
    $scope.$on(N.RoomUpdated, this.updateList.bind(this));

    $scope.$on(N.Logout, this.updateList.bind(this));

    $scope.$watchCollection('search', this.updateList.bind(this));
  }

  updateList() {
    this.$scope.allRooms = this.RoomStore.getPrivateRooms();

    this.$scope.allRooms = ArrayUtils.roomsSortedByMostRecent(this.$scope.allRooms);

    this.$scope.rooms = ArrayUtils.filterByKey(this.$scope.allRooms, this.$scope.search[this.$scope.activeTab], (room) => {
      return room.getMetaObject().name;
    });

    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

}

angular.module('myApp.controllers').controller('InboxRoomsListController', InboxRoomsListController);
