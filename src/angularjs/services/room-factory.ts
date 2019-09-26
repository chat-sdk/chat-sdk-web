import * as angular from 'angular';
import { database } from 'firebase';

import { IUser } from '../entities/user';
import { IRoom } from '../entities/room';
import { UserStatus } from '../keys/user-status';
import { RoomType } from '../keys/room-type';
import { TypeKey } from '../keys/keys';
import { RoomsPath, UsersPath } from '../keys/path-keys';
import { RoomKeys } from '../keys/room-keys';
import { Utils } from './utils';
import { ITime } from './time';
import { IUserStore } from '../persistence/user-store';
import { IPaths } from '../network/paths';
import { IEntityFactory } from '../entities/entity';
import { IRoomMeta } from '../interfaces/room-meta';

export interface IRoomFactory {
  updateRoomType(rid: string, type: RoomType): Promise<any>;
  removeUserFromRoom(user: IUser, room: IRoom): Promise<any>;
  addUserToRoom(user: IUser, room: IRoom, status: UserStatus): Promise<any>;
  roomMeta(rid: string, name: string, description: string, userCreated: boolean, invitesEnabled: boolean, type: RoomType, weight: number): IRoomMeta;
}

class RoomFactory implements IRoomFactory {

  static $inject = ['$rootScope', 'Time', 'UserStore', 'EntityFactory', 'Paths'];

  constructor(
    private $rootScope: ng.IRootScopeService,
    private Time: ITime,
    private UserStore: IUserStore,
    private EntityFactory: IEntityFactory,
    private Paths: IPaths,
  ) { }

  // Group chats should be handled separately to
  // private chats
  updateRoomType(rid: string, type: RoomType): Promise<any> {
    const ref = this.Paths.roomMetaRef(rid);
    return ref.update({ [TypeKey]: type });
  }

  removeUserFromRoom(user: IUser, room: IRoom): Promise<any> {
    const updates = { ...room.removeUserUpdate(user), ...user.removeRoomUpdate(room) };
    return this.Paths.firebase().update(updates);
  }

  async addUserToRoom(user: IUser, room: IRoom, status: UserStatus): Promise<any> {

    const updates = { ...user.addRoomUpdate(room), ...room.addUserUpdate(user, status) };

    try {
      await this.Paths.firebase().update(updates);
      if (room.getType() == RoomType.Public) {
        user.removeOnDisconnect(RoomsPath + '/' + room.rid());
        room.removeOnDisconnect(UsersPath + '/' + user.uid());
      }
      return Promise.all([
        room.updateState(UsersPath),
        user.updateState(RoomsPath)
      ]);
    }
    catch (error) {
      console.log(error);
    }
  }

  roomMeta(rid: string, name: string, description: string, userCreated: boolean, invitesEnabled: boolean, type: RoomType, weight: number): IRoomMeta {
    return {
    // TODO: Is this used?
    // [RoomKeys.RID]: rid ? rid : null,
      [RoomKeys.Name]: name ? name : null,
      [RoomKeys.InvitesEnabled]: !Utils.unORNull(invitesEnabled) ? invitesEnabled : true,
      [RoomKeys.Description]: description ? description : null,
      [RoomKeys.UserCreated]: !Utils.unORNull(userCreated) ? userCreated : true,
      [RoomKeys.Created]: database.ServerValue.TIMESTAMP,
      [RoomKeys.Weight]: weight ? weight : 0,

      [RoomKeys.Type]: type,
      [RoomKeys.Type_v4]: type, // Deprecated
    }
  }

  // userIsActiveWithInfo(info) {
  //     // TODO: For the time being assume that users that
  //     // don't have this information are active
  //     if (info && info.status && info.time) {
  //         if (info.status != UserStatus.Closed) {
  //             return this.Time.secondsSince(info.time) < 60 * 60 * 24;
  //         }
  //     }
  //     return true;
  // };

}

angular.module('myApp.services').service('RoomFactory', RoomFactory);
