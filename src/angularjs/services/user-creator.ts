import * as angular from 'angular';

import { IUser, User } from '../entities/user';
import { IRootScope } from '../interfaces/root-scope';
import { IPaths } from '../network/paths';
import { ICloudImage } from './cloud-image';
import { IEnvironment } from './environment';
import { INetworkManager } from '../network/network-manager';

export interface IUserCreator {
  createUser(uid: string): IUser;
}

class UserCreator implements IUserCreator {

  static $inject = ['$rootScope', '$timeout', 'Paths', 'CloudImage', 'Environment', 'NetworkManager'];

  constructor(
    private $rootScope: IRootScope,
    private $timeout: ng.ITimeoutService,
    private Paths: IPaths,
    private CloudImage: ICloudImage,
    private Environment: IEnvironment,
    private NetworkManager: INetworkManager,
  ) { }

  createUser(uid: string): IUser {
    return new User(this.$rootScope, this.Paths, this.CloudImage, this.Environment, this.NetworkManager, uid);
  }

}

angular.module('myApp.services').service('UserCreator', UserCreator);
