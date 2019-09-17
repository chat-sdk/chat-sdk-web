import { IUser } from '../entities/user';
import { IConfig } from '../services/config';
import { UserDragAction } from '../directives/draggable-user';
import { NotificationType } from '../keys/notification-type';

export interface IRootScope extends ng.IRootScopeService {
    user: IUser;
    config: IConfig;
    userDrag: UserDragAction;
    disableDrag: boolean;
    partialsURL: string;
    showNotification: (type: NotificationType, title: string, message: string, button: string) => void;
}
