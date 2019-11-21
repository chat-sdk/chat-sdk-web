import * as angular from 'angular';

import { AbstractUsersListController } from '../abstract/abstract-users-list';
import { N } from '../keys/notification-keys';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IUser } from '../entities/user';
import { IOnlineConnector } from '../connectors/online-connector';
import { ISearch } from '../services/search.service';
import { UsersTab } from '../keys/tab-keys';
import { ICache } from '../persistence/cache';
import { IUserStore } from '../persistence/user-store';
import { IRoomStore } from '../persistence/room-store';
import { IRoomCreator } from '../services/room-creator';
import { IRoomOpenQueue } from '../services/room-open-queue';
import { IProfileBox } from '../services/profile-box.service';

class OnlineUsersListController extends AbstractUsersListController {

  static $inject = ['$scope', '$timeout', 'OnlineConnector', 'Search', 'Cache', 'UserStore', 'RoomStore', 'RoomCreator', 'RoomOpenQueue', 'ProfileBox'];

  allUsers = Array<IUser>();

  constructor(
    protected $scope: ng.IScope,
    protected $timeout: ng.ITimeoutService,
    protected OnlineConnector: IOnlineConnector,
    protected Search: ISearch,
    protected Cache: ICache,
    protected UserStore: IUserStore,
    protected RoomStore: IRoomStore,
    protected RoomCreator: IRoomCreator,
    protected RoomOpenQueue: IRoomOpenQueue,
    protected ProfileBox: IProfileBox,
  ) {
    super($scope, Cache, UserStore, RoomStore, RoomCreator, RoomOpenQueue, ProfileBox);

    $scope.$on(N.OnlineUserAdded, () => {
      Log.notification(N.OnlineUserAdded, 'OnlineUsersListController');
      this.updateList();
    });

    $scope.$on(N.OnlineUserRemoved, () => {
      Log.notification(N.OnlineUserRemoved, 'OnlineUsersListController');
      this.updateList();
    });

    this.Search.queryForTabObservable(UsersTab).subscribe(this.updateList.bind(this));
  }

  updateList() {
    // Filter online users to remove users that are blocking us
    this.allUsers = ArrayUtils.objectToArray(this.OnlineConnector.onlineUsers);
    this.users = ArrayUtils.filterByKey(this.allUsers, this.Search.getQueryForActiveTab(), (user) => {
      return user.getName();
    });

    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

}

angular.module('myApp.components').component('onlineUsersList', {
  templateUrl: '/assets/partials/user-list.html',
  controller: OnlineUsersListController,
  controllerAs: 'ctrl',
  bindings: {
    room: '<'
  },
});
