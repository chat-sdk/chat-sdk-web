import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { Utils } from '../services/utils';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IRoom } from '../entities/room';

export interface IPublicRoomsListScope extends ng.IScope {
  activeTab: string;
  allRooms: IRoom[];
  rooms: IRoom[];
  search: { [key: string]: string };
  updateList(): void;
}

export interface IPublicRoomsListController {

}

class PublicRoomsListController implements IPublicRoomsListController {

  static $inject = ['$scope', '$timeout'];

  constructor(
    private $scope: IPublicRoomsListScope,
    private $timeout: ng.ITimeoutService,
  ) {
    // $scope propeties
    $scope.rooms = [];
    $scope.allRooms = [];

    // $scope methods
    $scope.updateList = this.updateList.bind(this);

    $scope.$on(N.PublicRoomAdded, (event, room) => {
      Log.notification(N.PublicRoomAdded, 'PublicRoomsListController');
      // Add the room and sort the list
      if (!ArrayUtils.contains($scope.allRooms, room)) {
        $scope.allRooms.push(room);
      }
      this.updateList();

    });

    $scope.$on(N.PublicRoomRemoved, (event, room) => {
      Log.notification(N.PublicRoomRemoved, 'PublicRoomsListController');

      ArrayUtils.remove($scope.allRooms, room);
      this.updateList.bind(this)();
    });

    // Update the list if the user count on a room changes
    $scope.$on(N.RoomUpdated, this.updateList.bind(this));

    $scope.$on(N.Logout, this.updateList.bind(this));

    $scope.$watchCollection('search', this.updateList.bind(this));
  }

  updateList() {
    Log.notification(N.Logout, 'PublicRoomsListController');

    this.$scope.allRooms.sort((a, b) => {

      const au = Utils.unORNull(a.getMetaObject().userCreated) ? false : a.getMetaObject().userCreated;
      const bu = Utils.unORNull(b.getMetaObject().userCreated) ? false : b.getMetaObject().userCreated;

      if (au != bu) {
        return au ? 1 : -1;
      }

      // Weight
      const aw = Utils.unORNull(a.getMetaObject().weight) ? 100 : a.getMetaObject().weight;
      const bw = Utils.unORNull(b.getMetaObject().weight) ? 100 : b.getMetaObject().weight;

      if (aw != bw) {
        return aw - bw;
      }
      else {

        const ac = a.getOnlineUserCount();
        const bc = b.getOnlineUserCount();

        //console.log('1: ' + ac + ', 2: ' + bc);

        if (ac != bc) {
          return bc - ac;
        }
        else {
          return a.name < b.name ? -1 : 1;
        }
      }

    });

    this.$scope.rooms = ArrayUtils.filterByKey(this.$scope.allRooms, this.$scope.search[this.$scope.activeTab], (room) => {
      return room.getMetaObject.name;
    });

    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

}

angular.module('myApp.controllers').controller('PublicRoomsListController', PublicRoomsListController);
