import * as angular from 'angular';

import { IUser } from '../entities/user';
import { IRoom, Room } from '../entities/room';
import { RoomType } from '../keys/room-type';
import { IUserStore } from '../persistence/user-store';
import { IPaths } from '../network/paths';
import { IRoomFactory } from './room-factory';
import { IEntityFactory } from '../entities/entity';
import { Utils } from './utils';
import { RoomKeys } from '../keys/room-keys';
import { database } from 'firebase';
import { RoomsPath } from '../keys/path-keys';
import { DetailsKey } from '../keys/keys';
import { UserStatus } from '../keys/user-status';
import { IRoomMeta } from '../interfaces/room-meta';
import { IPresence } from '../network/presence';
import { IConfig } from './config';
import { IMessageFactory } from '../entities/message';
import { ICache } from '../persistence/cache';
import { IRoomPositionManager } from './room-position-manager';
import { ISoundEffects } from './sound-effects';
import { IVisibility } from './visibility';
import { ITime } from './time';
import { ICloudImage } from './cloud-image';
import { IMarquee } from './marquee';
import { IEnvironment } from './environment';
import { IRootScope } from '../interfaces/root-scope';

export interface IRoomCreator {
  createAndPushPrivateRoom(users: [IUser]): Promise<IRoom>;
  createAndPushPublicRoom(name: string, description: string, weight?: number): Promise<IRoom>
  createAndPushRoom(rid: string, name: string, description: string, invitesEnabled: boolean, type: RoomType, userCreated?: boolean, weight?: number): Promise<IRoom>
  createRoom(rid: string, meta?: IRoomMeta): IRoom;
}

class RoomCreator implements IRoomCreator {

  static $inject = ['$rootScope', 'Presence', 'Paths', 'Config', 'MessageFactory', 'Cache', 'UserStore', 'RoomPositionManager', 'SoundEffects', 'Visibility', 'Time', 'CloudImage', 'Marquee', 'Environment', 'RoomFactory', 'EntityFactory'];

  constructor(
    private $rootScope: IRootScope,
    private Presence: IPresence,
    private Paths: IPaths,
    private Config: IConfig,
    private MessageFactory: IMessageFactory,
    private Cache: ICache,
    private UserStore: IUserStore,
    private RoomPositionManager: IRoomPositionManager,
    private SoundEffects: ISoundEffects,
    private Visibility: IVisibility,
    private Time: ITime,
    private CloudImage: ICloudImage,
    private Marquee: IMarquee,
    private Environment: IEnvironment,
    private RoomFactory: IRoomFactory,
    private EntityFactory: IEntityFactory,
  ) { }

  createRoom(rid: string, meta?: IRoomMeta): IRoom {
    return new Room(this.$rootScope, this.Presence, this.Paths, this.Config, this.MessageFactory, this.Cache, this.UserStore, this.RoomPositionManager, this.SoundEffects, this.Visibility, this.Time, this.CloudImage, this.Marquee, this.Environment, this.RoomFactory, rid, meta);
  }

  async createAndPushRoom(rid: string, name: string, description: string, invitesEnabled: boolean, type: RoomType, userCreated = true, weight = 0): Promise<IRoom> {

    if (Utils.unORNull(rid)) {
      rid = this.Paths.roomsRef().push().key;
    }
    const roomMeta = this.RoomFactory.roomMeta(rid, name, description, true, invitesEnabled, type, weight);

    const room = this.createRoom(rid, roomMeta);

    roomMeta[RoomKeys.Creator] = this.UserStore.currentUser().uid();
    roomMeta[RoomKeys.CreatorEntityID] = roomMeta[RoomKeys.Creator];

    const roomMetaRef = this.Paths.roomMetaRef(rid);

    // Add the room to Firebase
    await roomMetaRef.set(roomMeta);
    await this.RoomFactory.addUserToRoom(this.UserStore.currentUser(), room, UserStatus.Owner);
    if (type == RoomType.Public) {
      const ref = this.Paths.publicRoomRef(rid);
      const data = {};
      data[RoomKeys.Created] = database.ServerValue.TIMESTAMP;
      data[RoomKeys.RID] = rid;
      data[RoomKeys.UserCreated] = true;
      return ref.set(data);
    }
    const _ = this.EntityFactory.updateState(RoomsPath, rid, DetailsKey);
    return room;
  }

  createAndPushPublicRoom(name: string, description: string, weight = 0): Promise<IRoom> {
    return this.createAndPushRoom(null, name, description, true, RoomType.Public, true, weight);
  }

  async createAndPushPrivateRoom(users: [IUser]): Promise<IRoom> {
    // Since we're calling create room we will be added automatically
    const room = await this.createAndPushRoom(null, null, null, true, users.length == 1 ? RoomType.OneToOne : RoomType.Group);
    const promises = users.map(user => this.RoomFactory.addUserToRoom(user, room, UserStatus.Member));
    await Promise.all(promises);
    return room;
  }

}

angular.module('myApp.services').service('RoomCreator', RoomCreator);
