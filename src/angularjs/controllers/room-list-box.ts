import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IRoom } from '../entities/room';
import { Dimensions } from '../keys/dimensions';
import { Log } from '../services/log';
import { IRootScope } from '../interfaces/root-scope';
import { IAuth } from '../network/auth';
import { ICache } from '../persistence/cache';
import { ILocalStorage } from '../persistence/local-storage';
import { IRoomPositionManager } from '../services/room-position-manager';

export interface IRoomListScope extends ng.IScope {
  boxHeight: number;
  boxWidth: number;
  canCloseRoom: boolean;
  hideRoomList: boolean;
  moreChatsMinimized: boolean;
  roomBackgroundColor: string;
  rooms: IRoom[];
  minimize(): void;
  roomClicked(room: IRoom): void;
  setMoreBoxMinimized(minimized: boolean): void;
  toggle(): void;
  updateList(): void;
}

export interface IRoomListBoxController {

}

class RoomListBoxController implements IRoomListBoxController {

  static $inject = ['$scope', '$rootScope', '$timeout', 'Auth', 'Cache', 'LocalStorage', 'RoomPositionManager'];

  constructor(
    private $scope: IRoomListScope,
    private $rootScope: IRootScope,
    private $timeout: ng.ITimeoutService,
    private Auth: IAuth,
    private Cache: ICache,
    private LocalStorage: ILocalStorage,
    private RoomPositionManager: IRoomPositionManager,
  ) {
    // $scope properties
    $scope.boxHeight = Dimensions.RoomListBoxHeight;
    $scope.boxWidth = Dimensions.RoomListBoxWidth;
    $scope.canCloseRoom = true;
    $scope.moreChatsMinimized = true;
    $scope.roomBackgroundColor = '#FFF';
    $scope.rooms = [];

    // $scope methods
    $scope.updateList = this.updateList.bind(this);
    $scope.roomClicked = this.roomClicked.bind(this);
    $scope.minimize = this.minimize.bind(this);
    $scope.toggle = this.toggle.bind(this);
    $scope.setMoreBoxMinimized = this.setMoreBoxMinimized.bind(this);

    // Is the more box minimized?
    this.setMoreBoxMinimized(LocalStorage.getProperty(LocalStorage.moreMinimizedKey));

    // Update the list when a room changes
    $scope.$on(N.UpdateRoomActiveStatus, this.updateList.bind(this));
    $scope.$on(N.RoomUpdated, this.updateList.bind(this));
    $scope.$on(N.Logout, this.updateList.bind(this));
  }

  updateList() {
    Log.notification(N.UpdateRoomActiveStatus, 'RoomListBoxController');

    this.$scope.rooms = this.Cache.inactiveRooms();

    // Sort rooms by the number of unread messages
    this.$scope.rooms.sort((a, b) => {
      // First order by number of unread messages
      // Badge can be null
      let ab = a.badge ? a.badge : 0;
      let bb = b.badge ? b.badge : 0;

      if (ab != bb) {
        return bb - ab;
      }
      // Otherwise sort them by number of users
      else {
        return b.onlineUserCount - a.onlineUserCount;
      }
    });

    this.$scope.moreChatsMinimized = this.$scope.rooms.length == 0;

    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

  roomClicked(room: IRoom) {
    // Get the left most room
    let rooms = this.RoomPositionManager.getRooms();

    // Get the last box that's active
    for (let i = rooms.length - 1; i >= 0; i--) {
      if (rooms[i].active) {

        // Get the details of the final room
        let offset = rooms[i].offset;
        let width = rooms[i].width;
        let height = rooms[i].height;
        let slot = rooms[i].slot;

        // Update the old room with the position of the new room
        rooms[i].setOffset(room.offset);
        rooms[i].width = room.width;
        rooms[i].height = room.height;
        //rooms[i].active = false;
        rooms[i].setActive(false);
        rooms[i].slot = room.slot;

        // Update the new room
        room.setOffset(offset);
        room.width = width;
        room.height = height;

        //room.setSizeToDefault();
        room.setActive(true);
        room.badge = null;
        room.minimized = false;
        room.slot = slot;

        // this.RoomPositionManager.setDirty();
        // this.RoomPositionManager.updateRoomPositions(room, 0);
        // this.RoomPositionManager.updateAllRoomActiveStatus();

        break;
      }
    }
    this.$rootScope.$broadcast(N.UpdateRoomActiveStatus);
  }

  minimize() {
    this.setMoreBoxMinimized(true);
  }

  toggle() {
    this.setMoreBoxMinimized(!this.$scope.hideRoomList);
  }

  setMoreBoxMinimized(minimized: boolean) {
    this.$scope.hideRoomList = minimized;
    this.LocalStorage.setProperty(this.LocalStorage.moreMinimizedKey, minimized);
  }

}

angular.module('myApp.controllers').controller('RoomListBoxController', RoomListBoxController);
