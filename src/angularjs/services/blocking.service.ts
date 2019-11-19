import * as angular from 'angular';

import { IUserStore } from '../persistence/user-store';
import { ICache } from '../persistence/cache';
import { IUser } from '../entities/user';
import { Utils } from './utils';


export interface IBlocking {
  block(user: IUser): void;
  isBlocked(user: IUser): boolean;
  toggle(user: IUser): void;
  unblock(user: IUser): void;
}

class Blocking implements IBlocking {

  static $inject = ['UserStore', 'Cache'];

  constructor(
    private UserStore: IUserStore,
    private Cache: ICache,
  ) { }

  get me(): IUser {
    return this.UserStore.currentUser();
  }

  block(user: IUser) {
    this.me.blockUser(user);
  }

  unblock(user: IUser) {
    this.me.unblockUser(user);
  }

  toggle(user: IUser) {
    if (this.isBlocked(user)) {
      this.unblock(user);
    }
    else {
      this.block(user);
    }
  }

  isBlocked(user: IUser): boolean {
    if (!user) { return false; }
    return !Utils.unORNull(this.Cache.blockedUsers[user.uid()]);
  }

}

angular.module('myApp.services').service('Blocking', Blocking);
