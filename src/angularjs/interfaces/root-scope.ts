import { IUser } from '../entities/user';
import { IConfig } from '../services/config';
import { UserDragAction } from '../directives/draggable-user';
import { NotificationType } from '../keys/notification-type';
import { LoginMode } from '../keys/login-mode-keys';

export interface IRootScope extends ng.IRootScopeService {
    auth: any;
    config: IConfig;
    disableDrag: boolean;
    loginMode: LoginMode;
    partialsURL: string;
    user: IUser;
    userDrag: UserDragAction;
    showNotification(type: NotificationType, title: string, message?: string, button?: string): void;
}
