import * as angular from 'angular';

import { IRoom } from '../entities/room';
import { ILocalStorage } from './local-storage';
import { IUserStore } from './user-store';
import { ArrayUtils } from '../services/array-utils';
import { IBeforeUnload } from '../services/before-unload';
import { IUser } from '../entities/user';
import { IRoomCreator } from '../services/room-creator';

export interface IRoomStore {
  getOrCreateRoomWithID(rid: string): IRoom;
  getPrivateRooms(): IRoom[];
  getPrivateRoomsWithUsers(user1: IUser, user2: IUser): IRoom[];
  getRoomWithID(rid: string): IRoom;
  inboxBadgeCount(): number;
  loadPrivateRoomsToMemory(): void;
  removeRoom(room: IRoom): void;
}

class RoomStore implements IRoomStore {

  rooms: { [key: string]: IRoom } = {};
  roomsLoadedFromMemory = false;

  static $inject = ['LocalStorage', 'RoomCreator', 'BeforeUnload', 'UserStore'];

  constructor(
    private LocalStorage: ILocalStorage,
    private RoomCreator: IRoomCreator,
    private BeforeUnload: IBeforeUnload,
    private UserStore: IUserStore
  ) {
    BeforeUnload.addListener(this);
  }

  /**
   * Load the private rooms so they're available
   * to the inbox list
   */
  loadPrivateRoomsToMemory() {

    if (this.roomsLoadedFromMemory || !this.UserStore.currentUser()) {
      return;
    }
    this.roomsLoadedFromMemory = true;

    // Load private rooms
    let rooms = this.LocalStorage.rooms;
    for (let key in rooms) {
      if (rooms.hasOwnProperty(key)) {
        this.getOrCreateRoomWithID(key);
      }
    }
  }

  beforeUnload() {
    this.sync();
  }

  sync() {
    this.LocalStorage.storeRooms(this.rooms);
    this.LocalStorage.sync();
  }

  getOrCreateRoomWithID(rid: string): IRoom {

    let room = this.getRoomWithID(rid);

    if (!room) {
      room = this.buildRoomWithID(rid);
      this.addRoom(room);
    }

    return room;
  }

  buildRoomWithID(rid: string): IRoom {

    const room = this.RoomCreator.createRoom(rid);
    room.associatedUserID = this.UserStore.currentUser().uid();

    //            room.height = ChatRoomHeight;
    //            room.width = ChatRoomWidth;

    // Update the room from the saved state
    this.LocalStorage.updateRoomFromStore(room);

    return room;
  }

  addRoom(room: IRoom) {
    if (room && room.rid()) {
      this.rooms[room.rid()] = room;
    }
  }

  removeRoom(room: IRoom) {
    if (room && room.rid()) {
      delete this.rooms[room.rid()];
    }
  }

  getRoomWithID(rid: string): IRoom {
    return this.rooms[rid];
  }

  clear() {
    this.rooms = {};
  }

  getPrivateRooms(): IRoom[] {

    if (!this.UserStore.currentUser()) {
      return [];
    }

    this.loadPrivateRoomsToMemory();

    let rooms = Array<IRoom>();
    for (let rid in this.rooms) {
      if (this.rooms.hasOwnProperty(rid)) {
        let room = this.rooms[rid];
        // Make sure that we only return private rooms for the current user
        if (!room.isPublic() && !room.deleted && room.associatedUserID && room.associatedUserID == this.UserStore.currentUser().uid() && room.usersMeta != {}) {
          rooms.push(this.rooms[rid]);
        }
      }
    }
    return rooms;
  }

  getPrivateRoomsWithUsers(user1: IUser, user2: IUser): IRoom[] {
    let rooms = Array<IRoom>();
    for (let key in this.rooms) {
      if (this.rooms.hasOwnProperty(key)) {
        if (!this.rooms[key].isPublic()) {
          rooms.push(this.rooms[key]);
        }
      }
    }
    rooms = ArrayUtils.getRoomsWithUsers(rooms, [user1, user2]);
    return ArrayUtils.roomsSortedByMostRecent(rooms);
  }

  inboxBadgeCount(): number {
    let count = 0;
    let rooms = this.getPrivateRooms();
    for (let i = 0; i < rooms.length; i++) {
      count += rooms[i].badge;
    }
    return count;
  }
}

angular.module('myApp.services').service('RoomStore', RoomStore);
