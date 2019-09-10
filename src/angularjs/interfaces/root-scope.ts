import {IUser} from "../entities/user";
import {UserDragAction} from "../directives/draggable-user";

export interface IRootScope extends ng.IRootScopeService {
    user: IUser
    userDrag: UserDragAction
    disableDrag: boolean
}
