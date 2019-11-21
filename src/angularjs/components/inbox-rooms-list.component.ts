import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IRoomStore } from '../persistence/room-store';
import { IRoom } from '../entities/room';
import { ISearch } from '../services/search.service';
import { InboxTab } from '../keys/tab-keys';

class InboxRoomsListController {

  static $inject = ['$scope', '$timeout', 'RoomStore', 'Search'];

  rooms = Array<IRoom>();

  constructor(
    private $scope: ng.IScope,
    private $timeout: ng.ITimeoutService,
    private RoomStore: IRoomStore,
    private Search: ISearch,
  ) {
    $scope.$on(N.RoomAdded, () => {
      Log.notification(N.RoomAdded, 'InboxRoomsListController');
      this.updateList();
    });

    $scope.$on(N.RoomRemoved, () => {
      Log.notification(N.RoomRemoved, 'InboxRoomsListController');
      this.updateList();
    });

    $scope.$on(N.LoginComplete, () => {
      Log.notification(N.LoginComplete, 'InboxRoomsListController');
      RoomStore.loadPrivateRoomsToMemory();
      this.updateList();
    });

    // Update the list if the user count on a room changes
    $scope.$on(N.RoomUpdated, this.updateList.bind(this));

    $scope.$on(N.Logout, this.updateList.bind(this));

    Search.queryForTabObservable(InboxTab).subscribe(query => {
      this.updateList();
    });
  }

  updateList() {
    const privateRooms = ArrayUtils.roomsSortedByMostRecent(this.RoomStore.getPrivateRooms());

    this.rooms = ArrayUtils.filterByKey(privateRooms, this.Search.getQueryForActiveTab(), (room) => {
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

angular.module('myApp.components').component('inboxRoomsList', {
  templateUrl: '/assets/partials/room-list.html',
  controller: InboxRoomsListController,
  controllerAs: 'ctrl',
});
