import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { Utils } from '../services/utils';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IRoom } from '../entities/room';
import { ISearch } from '../services/search';
import { RoomsTab } from '../keys/tab-keys';

class PublicRoomsListController {

  static $inject = ['$scope', '$timeout', 'Search'];

  allRooms = Array<IRoom>();
  rooms = Array<IRoom>();

  constructor(
    private $scope: ng.IScope,
    private $timeout: ng.ITimeoutService,
    private Search: ISearch,
  ) {
    $scope.$on(N.PublicRoomAdded, (event, room) => {
      Log.notification(N.PublicRoomAdded, 'PublicRoomsListController');
      // Add the room and sort the list
      if (!ArrayUtils.contains(this.allRooms, room)) {
        this.allRooms.push(room);
      }
      this.updateList();

    });

    $scope.$on(N.PublicRoomRemoved, (event, room) => {
      Log.notification(N.PublicRoomRemoved, 'PublicRoomsListController');

      ArrayUtils.remove(this.allRooms, room);
      this.updateList();
    });

    // Update the list if the user count on a room changes
    $scope.$on(N.RoomUpdated, this.updateList.bind(this));

    $scope.$on(N.Logout, this.updateList.bind(this));

    Search.queryForTabObservable(RoomsTab).subscribe(query => {
      this.updateList();
    });
  }

  updateList() {
    Log.notification(N.Logout, 'PublicRoomsListController');

    this.allRooms.sort((a, b) => {

      const au = Utils.unORNull(a.getMetaObject().userCreated) ? false : a.getMetaObject().userCreated;
      const bu = Utils.unORNull(b.getMetaObject().userCreated) ? false : b.getMetaObject().userCreated;

      if (au !== bu) {
        return au ? 1 : -1;
      }

      // Weight
      const aw = Utils.unORNull(a.getMetaObject().weight) ? 100 : a.getMetaObject().weight;
      const bw = Utils.unORNull(b.getMetaObject().weight) ? 100 : b.getMetaObject().weight;

      if (aw !== bw) {
        return aw - bw;
      }
      else {
        const ac = a.getOnlineUserCount();
        const bc = b.getOnlineUserCount();

        // console.log('1: ' + ac + ', 2: ' + bc);

        if (ac !== bc) {
          return bc - ac;
        }
        else {
          return a.name < b.name ? -1 : 1;
        }
      }

    });

    this.rooms = ArrayUtils.filterByKey(this.allRooms, this.Search.getQueryForActiveTab(), (room) => {
      return room.name;
    });

    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

  roomClicked(room: IRoom) {

    // Trim the messages array in case it gets too long
    // we only need to store the last 200 messages!
    room.trimMessageList();

    // Messages on is called by when we add the room to the user
    // If the room is already open do nothing!
    if (room.flashHeader()) {
      return;
    }

    room.open(0);
  }

}

angular.module('myApp.components').component('publicRoomsList', {
  templateUrl: '/assets/partials/room-list.html',
  controller: PublicRoomsListController,
  controllerAs: 'ctrl',
});
