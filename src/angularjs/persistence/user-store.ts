import * as angular from 'angular';

import { IUser } from '../entities/user';
import { ILocalStorage } from './local-storage';
import { IBeforeUnload, IBeforeUnloadListener } from '../services/before-unload';
import { INetworkManager } from '../network/network-manager';
import { IRootScope } from '../interfaces/root-scope';

export interface IUserStore {
  users: { [uid: string]: IUser };
  currentUser(): IUser;
  getOrCreateUserWithID(uid: string, cancelOn?: boolean): IUser;
  getUserWithID(uid: string): IUser;
}

class UserStore implements IUserStore, IBeforeUnloadListener {

  users: { [uid: string]: IUser } = {};

  static $inject = ['$rootScope', 'LocalStorage', 'User', 'BeforeUnload', 'NetworkManager'];

  constructor(
    private $rootScope: IRootScope,
    private LocalStorage: ILocalStorage,
    private User/*: IUser*/,
    private BeforeUnload: IBeforeUnload,
    private NetworkManager: INetworkManager) {
    this.BeforeUnload.addListener(this);
  }

  beforeUnload() {
    this.sync();
  }

  sync() {
    this.LocalStorage.storeUsers(this.users);
    this.LocalStorage.sync();
  }

  getOrCreateUserWithID(uid: string, cancelOn?: boolean): IUser {
    let user = this.getUserWithID(uid);
    if (!user) {
      user = this.buildUserWithID(uid);
      this.addUser(user);
    }
    if (!cancelOn) {
      const _ = user.on();
    }

    return user;
  }

  buildUserWithID(uid: string): IUser {
    const user = this.User(uid);
    this.LocalStorage.updateUserFromStore(user);
    return user;
  }

  getUserWithID(uid: string): IUser {
    if (uid !== null) {
      return this.users[uid];
    } else {
      return null;
    }
  }

  // A cache of all users
  addUser(user: IUser) {
    if (user && user.meta && user.uid()) {
      this.users[user.uid()] = user;
    }
  }

  clear() {
    this.users = {};
  }

  currentUser(): IUser {
    return this.getOrCreateUserWithID(this.NetworkManager.auth.currentUserID(), true);
  }

}

angular.module('myApp.services').service('UserStore', UserStore);
