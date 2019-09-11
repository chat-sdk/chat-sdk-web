import {IUser} from "../entities/user";
import {UserDragAction} from "../directives/draggable-user";
import { NotificationType } from '../keys/defines';

export interface IRootScope extends ng.IRootScopeService {
    user: IUser
    userDrag: UserDragAction
    disableDrag: boolean
    showNotification: (type: NotificationType, title: string, message: string, button: string) => void
}
