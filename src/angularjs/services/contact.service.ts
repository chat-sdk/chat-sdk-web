import * as angular from 'angular';

import { IUser } from '../entities/user';
import { IUserStore } from '../persistence/user-store';
import { IFriendsConnector } from '../connectors/friend-connector';
import { IConfig } from './config';


export interface IContact {
  readonly friendsEnabled: boolean;
  addFriend(user: IUser): void;
  isFriend(user: IUser): boolean;
  removeFriend(user: IUser): void;
  toggleFriend(user: IUser): void;
}

class Contact implements IContact {

  static $inject = ['UserStore', 'FriendsConnector', 'Config'];

  constructor(
    private UserStore: IUserStore,
    private FriendsConnector: IFriendsConnector,
    private Config: IConfig,
  ) { }

  get me(): IUser {
    return this.UserStore.currentUser();
  }

  get friendsEnabled(): boolean {
    return this.Config.friendsEnabled;
  }

  addFriend(user: IUser) {
    this.me.addFriend(user);
  }

  removeFriend(user: IUser) {
    this.me.removeFriend(user);
  }

  toggleFriend(user: IUser) {
    if (this.isFriend(user)) {
      this.removeFriend(user);
    } else {
      this.addFriend(user);
    }
  }

  isFriend(user: IUser): boolean {
    return this.FriendsConnector.isFriend(user);
  }

}

angular.module('myApp.services').service('Contact', Contact);
