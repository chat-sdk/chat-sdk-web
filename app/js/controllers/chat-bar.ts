import * as angular from 'angular'
import {
    LogoutNotification,
    RoomClosedNotification,
    RoomOpenedNotification,
    UpdateRoomActiveStatusNotification
} from "../keys/notification-keys";

import {IRoomListScope} from "./room-list-box";
import {ICache} from "../persistence/cache";
import {ILog} from "../services/log";
import {IRoom} from "../entities/room";

export interface IChatBarController {
    rooms: IRoom []
    updateList(): void
}

class ChatBarController implements IChatBarController{

    static $inject = ['$scope', '$timeout', 'Cache', 'Log'];

    public rooms: IRoom [] = [];

    private Log: ILog;
    private $scope: IRoomListScope;
    private $timeout: ng.ITimeoutService;
    private Cache: ICache;

    constructor ($scope: IRoomListScope, $timeout: ng.ITimeoutService, Cache: ICache, Log: ILog) {

        this.$scope = $scope;
        this.Log = Log;
        this.$timeout = $timeout;
        this.Cache = Cache;

        const updateList = () => {
            this.updateList();
        };

        $scope.$on(RoomOpenedNotification, updateList);
        $scope.$on(RoomClosedNotification, updateList);
        $scope.$on(LogoutNotification, updateList);

        $scope.$on(UpdateRoomActiveStatusNotification, () => {
            this.Log.notification(UpdateRoomActiveStatusNotification, 'ChatBarController');
            updateList();
        });
    }

    updateList(): void {
        this.Log.notification(RoomOpenedNotification + "/" + RoomClosedNotification, 'ChatBarController');

        // Only include rooms that are active
        this.rooms = this.Cache.activeRooms();

        this.$timeout(() => {
            this.$scope.$digest();
        })
    }

}

angular.module('myApp.controllers').controller('ChatBarController', ChatBarController);