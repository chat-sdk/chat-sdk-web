import * as angular from 'angular';

import { AbstractUsersListController } from '../abstract/abstract-users-list';
import { N } from '../keys/notification-keys';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IUser } from '../entities/user';
import { IOnlineConnector } from '../connectors/online-connector';
import { IRoom } from '../entities/room';
import { ISearch } from '../services/search';
import { FriendsTab } from '../keys/tab-keys';
import { IFriendsConnector } from '../connectors/friend-connector';
import { ICache } from '../persistence/cache';
import { IUserStore } from '../persistence/user-store';
import { IRoomStore } from '../persistence/room-store';
import { IRoomCreator } from '../services/room-creator';
import { IRoomOpenQueue } from '../services/room-open-queue';

export class FriendsListController extends AbstractUsersListController {

  static $inject = ['$scope', '$timeout', 'Cache', 'UserStore', 'RoomStore', 'RoomCreator', 'RoomOpenQueue', 'OnlineConnector', 'FriendsConnector', 'Search'];

  room: IRoom;
  allUsers = Array<IUser>();
  users = Array<IUser>();

  constructor(
    protected $scope: ng.IScope,
    protected $timeout: ng.ITimeoutService,
    protected Cache: ICache,
    protected UserStore: IUserStore,
    protected RoomStore: IRoomStore,
    protected RoomCreator: IRoomCreator,
    protected RoomOpenQueue: IRoomOpenQueue,
    protected OnlineConnector: IOnlineConnector,
    protected FriendsConnector: IFriendsConnector,
    protected Search: ISearch,
  ) {
    super($scope, Cache, UserStore, RoomStore, RoomCreator, RoomOpenQueue);

    $scope.$on(N.FriendAdded, () => {
      Log.notification(N.FriendAdded, 'FriendsListController');
      this.updateList();
    });

    $scope.$on(N.FriendRemoved, () => {
      Log.notification(N.FriendAdded, 'FriendsListController');
      this.updateList();
    });

    this.Search.queryForTabObservable(FriendsTab).subscribe(this.updateList.bind(this));
  }

  showProfileBox(uid: string) {
    // TODO
    console.warn('showProfileBox');
  }

  updateList() {
    // Filter online users to remove users that are blocking us
    this.allUsers = ArrayUtils.objectToArray(this.FriendsConnector.friends);

    if (this.Search.getQueryForActiveTab()) {
      this.users = ArrayUtils.filterByKey(this.allUsers, this.Search.getQueryForActiveTab(), (user) => {
        return user.getName();
      });
    }
    else {
      this.users = this.allUsers;
    }

    // Sort the array first by who's online
    // then alphabetically
    this.users.sort((user1, user2) => {
      // Sort by who's online first then alphabetcially
      let aOnline = this.OnlineConnector.onlineUsers[user1.uid()];
      let bOnline = this.OnlineConnector.onlineUsers[user2.uid()];

      if (aOnline !== bOnline) {
        return aOnline ? 1 : -1;
      }
      else {
        if (user1.getName() !== user2.getName()) {
          return user1.getName() > user2.getName() ? 1 : -1;
        }
        return 0;
      }
    });

    this.$timeout(() => {
      this.$scope.$digest();
    });
  };

}

angular.module('myApp.components').component('friendsList', {
  templateUrl: '/assets/partials/user-list.html',
  controller: FriendsListController,
  controllerAs: 'ctrl',
  bindings: {
    room: '<'
  },
});
