import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IUser } from '../entities/user';
import { IOnlineConnector } from '../connectors/online-connector';

export interface OnlineUsersListScope extends ng.IScope {
  activeTab: string;
  allUsers: IUser[];
  users: IUser[];
  search: { [key: string]: string };
  updateList(): void;
}

export interface IOnlineUsersListController {

}

class OnlineUsersListController implements IOnlineUsersListController {

  static $inject = ['$scope', '$timeout', 'OnlineConnector'];

  constructor(
    private $scope: OnlineUsersListScope,
    private $timeout: ng.ITimeoutService,
    private OnlineConnector: IOnlineConnector,
  ) {
    // $scope propeties
    $scope.allUsers = [];
    $scope.users = [];

    //$scope methods
    $scope.updateList = this.updateList.bind(this);

    $scope.$on(N.OnlineUserAdded, () => {
      Log.notification(N.OnlineUserAdded, 'OnlineUsersListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.OnlineUserRemoved, () => {
      Log.notification(N.OnlineUserRemoved, 'OnlineUsersListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.UserBlocked, () => {
      Log.notification(N.UserBlocked, 'OnlineUsersListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.UserUnblocked, () => {
      Log.notification(N.UserUnblocked, 'OnlineUsersListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.FriendAdded, () => {
      Log.notification(N.FriendAdded, 'OnlineUsersListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.FriendRemoved, () => {
      Log.notification(N.FriendAdded, 'OnlineUsersListController');
      this.updateList.bind(this)();
    });

    $scope.$on(N.Logout, this.updateList.bind(this));

    $scope.$watchCollection('search', this.updateList.bind(this));
  }

  updateList() {
    // Filter online users to remove users that are blocking us
    this.$scope.allUsers = ArrayUtils.objectToArray(this.OnlineConnector.onlineUsers);
    this.$scope.users = ArrayUtils.filterByKey(this.$scope.allUsers, this.$scope.search[this.$scope.activeTab], (user) => {
        return user.getName();
    });

    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

}

angular.module('myApp.controllers').controller('OnlineUsersListController', OnlineUsersListController);
