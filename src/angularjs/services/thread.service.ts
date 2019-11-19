import * as angular from 'angular';

import { IUser } from '../entities/user';
import { ICache } from '../persistence/cache';
import { RoomType } from '../keys/room-type';
import { IRoomStore } from '../persistence/room-store';
import { IRoomCreator } from './room-creator';
import { IRoomOpenQueue } from './room-open-queue';


export interface IThread {
  openPrivateRoom(user1: IUser, user2: IUser): void;
}

class Thread implements IThread {

  static $inject = ['Cache', 'RoomStore', 'RoomCreator', 'RoomOpenQueue'];

  constructor(
    private Cache: ICache,
    private RoomStore: IRoomStore,
    private RoomCreator: IRoomCreator,
    private RoomOpenQueue: IRoomOpenQueue,
  ) { }

  openPrivateRoom(user1: IUser, user2: IUser) {
    // Check to see if there's an open room with the two users
    if (!this.flashPrivateRoomIfOpen(user1, user2)) {
      const rooms = this.RoomStore.getPrivateRoomsWithUsers(user1, user2);
      if (rooms.length > 0) {
        rooms[0].open(0);
        return;
      }
      // Create a new room if it doesn't exist yet
      this.createAndOpenPrivateRoom([user1, user2]);
    }
  }

  flashPrivateRoomIfOpen(user1: IUser, user2: IUser): boolean {
    const rooms = this.Cache.getPrivateRoomsWithUsers(user1, user2);
    if (rooms.length > 0) {
      const room = rooms.find(r => r.getType() === RoomType.OneToOne);
      return room && room.flashHeader();
    }
    return false;
  }

  createAndOpenPrivateRoom(users: IUser[]) {
    this.RoomCreator.createAndPushPrivateRoom(users).then(room => {
      this.RoomOpenQueue.addRoomWithID(room.rid());
      room.open(0);
    }, (error) => {
      console.log(error);
    });
  }

}

angular.module('myApp.services').service('Thread', Thread);
