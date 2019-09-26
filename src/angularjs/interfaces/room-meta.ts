import { RoomType } from '../keys/room-type';
import { RoomKeys } from '../keys/room-keys';

export interface IRoomMeta {
  [RoomKeys.RID]?: string,
  [RoomKeys.Name]?: string,
  [RoomKeys.InvitesEnabled]?: boolean,
  [RoomKeys.Description]?: string,
  [RoomKeys.UserCreated]?: boolean,
  [RoomKeys.Created]?: any,
  [RoomKeys.Weight]?: number,
  [RoomKeys.Type]?: RoomType,
  [RoomKeys.Type_v4]?: any, // Deprecated
  [key: string]: any
}
