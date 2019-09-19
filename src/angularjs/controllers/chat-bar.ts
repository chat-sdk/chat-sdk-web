import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IRoomListScope } from './room-list-box';
import { ICache } from '../persistence/cache';
import { IRoom } from '../entities/room';
import { Log } from '../services/log';

export interface IChatBarController {
    rooms: IRoom [];
    updateList(): void;
}

class ChatBarController implements IChatBarController{

    static $inject = ['$scope', '$timeout', 'Cache'];

    public rooms: IRoom [] = [];

    constructor(
        private $scope: IRoomListScope,
        private $timeout: ng.ITimeoutService,
        private Cache: ICache
    ) {
        const updateList = () => {
            this.updateList();
        };

        $scope.$on(N.RoomOpened, updateList);
        $scope.$on(N.RoomClosed, updateList);
        $scope.$on(N.Logout, updateList);

        $scope.$on(N.UpdateRoomActiveStatus, () => {
            Log.notification(N.UpdateRoomActiveStatus, 'ChatBarController');
            updateList.bind(this)();
        });
    }

    updateList() {
        Log.notification(N.RoomOpened + '/' + N.RoomClosed, 'ChatBarController');

        // Only include rooms that are active
        this.rooms = this.Cache.activeRooms();

        this.$timeout(() => {
            this.$scope.$digest();
        })
    }

}

angular.module('myApp.controllers').controller('ChatBarController', ChatBarController);
