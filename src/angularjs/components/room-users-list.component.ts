import * as angular from 'angular';

import { AbstractUsersListController } from '../abstract/abstract-users-list';
import { ArrayUtils } from '../services/array-utils';

export class RoomUsersListController extends AbstractUsersListController {

  $onChanges({ room }: ng.IOnChangesObject) {
    if (angular.isDefined(room)) {
      this.updateList();
    }
  }

  updateList() {
    this.users = ArrayUtils.objectToArray(this.room.getUsers());

    // Sort the array alphabetically
    this.users.sort((user1, user2) => {
      if (user1.getName() !== user2.getName()) {
        return user1.getName() > user2.getName() ? 1 : -1;
      }
      return 0;
    });
  }

}

angular.module('myApp.components').component('roomUsersList', {
  templateUrl: '/assets/partials/user-list.html',
  controller: RoomUsersListController,
  controllerAs: 'ctrl',
  bindings: {
    room: '<'
  },
});
