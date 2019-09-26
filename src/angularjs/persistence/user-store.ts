import * as angular from 'angular';

import { IUser } from '../entities/user';
import { IRootScope } from '../interfaces/root-scope';
import { ILocalStorage } from './local-storage';
import { IUserCreator } from '../services/user-creator';
import { IBeforeUnload, IBeforeUnloadListener } from '../services/before-unload';
import { INetworkManager } from '../network/network-manager';

export interface IUserStore {
  users: { [uid: string]: IUser };
  currentUser(): IUser;
  getOrCreateUserWithID(uid: string, cancelOn?: boolean): IUser;
  getUserWithID(uid: string): IUser;
}

class UserStore implements IUserStore, IBeforeUnloadListener {

  users: { [uid: string]: IUser } = {};

  static $inject = ['$rootScope', 'LocalStorage', 'UserCreator', 'BeforeUnload', 'NetworkManager'];

  constructor(
    private $rootScope: IRootScope,
    private LocalStorage: ILocalStorage,
    private UserCreator: IUserCreator,
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
    const user = this.UserCreator.createUser(uid);
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
