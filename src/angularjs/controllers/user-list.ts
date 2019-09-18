import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { IUser } from '../entities/user';
import { IOnlineConnector } from '../connectors/online-connector';
import { IRoomScope } from './chat';

export interface IUserListScope extends ng.IScope {
    aUser: any;
}

export interface IUserListController extends ng.IController {
    updateList(): void;
}

class UserListController implements IUserListController {

    static $inject = ['$scope', '$timeout', 'OnlineConnector'];

    constructor(
        private $scope: IRoomScope,
        private $timeout: ng.ITimeoutService,
        private OnlineConnector: IOnlineConnector,
    ) {
        $scope.$on(N.FriendAdded,() => {
            Log.notification(N.FriendAdded, 'UserListController');
            this.updateList.bind(this)();
        });

        $scope.$on(N.FriendRemoved,() =>{
            Log.notification(N.FriendAdded, 'UserListController');
            this.updateList.bind(this)();
        });

        $scope.$on(N.UserBlocked, () => {
            Log.notification(N.UserBlocked, 'UserListController');
            this.updateList.bind(this)();
        });

        $scope.$on(N.UserUnblocked , () =>{
            Log.notification(N.UserUnblocked, 'UserListController');
            this.updateList.bind(this)();
        });

        // TODO: A bit hacky
        $scope.$on(N.RoomUpdated, (event, room) => {
            Log.notification(N.RoomUpdated, 'UserListController');
            if (room === $scope.room) {
                this.updateList.bind(this)();
            }
        });

        $scope.$on(N.Logout, this.updateList.bind(this));

        $scope.$watchCollection('search', this.updateList.bind(this));
    }

    updateList() {
        // Filter online users to remove users that are blocking us
        this.$scope.allUsers = this.$scope.getAllUsers();

        if (this.$scope.searchKeyword()) {
            this.$scope.users = ArrayUtils.filterByKey(this.$scope.allUsers, this.$scope.searchKeyword(), (user) => {
                return (user as IUser).getName();
            });
        }
        else {
            this.$scope.users = this.$scope.allUsers;
        }

        // Sort the array first by who's online
        // then alphabetically
        this.$scope.users.sort((user1, user2) => {
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

angular.module('myApp.controllers').controller('UserListController', UserListController);
