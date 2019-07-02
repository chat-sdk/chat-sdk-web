import * as angular from 'angular'
import {RoomListBoxHeight, RoomListBoxWidth} from "../keys/dimensions";
import {
    LogoutNotification,
    RoomUpdatedNotification,
    UpdateRoomActiveStatusNotification
} from "../keys/notification-keys";
import {IRoom} from "../entities/room";

export interface IRoomListScope extends ng.IScope {
    rooms: IRoom [],
    updateList(): void,
}

angular.module('myApp.controllers').controller('RoomListBoxController', ['$scope', '$rootScope', '$timeout', 'Auth', 'Cache', 'LocalStorage', 'RoomPositionManager', 'Log',
    function($scope, $rootScope, $timeout, Auth, Cache, LocalStorage, RoomPositionManager, Log) {

        $scope.rooms = [];
        $scope.moreChatsMinimized = true;
        $scope.roomBackgroundColor = '#FFF';

        $scope.init = function () {
            $scope.boxWidth = RoomListBoxWidth;
            $scope.boxHeight = RoomListBoxHeight;
            $scope.canCloseRoom = true;

            // Is the more box minimized?
            $scope.setMoreBoxMinimized(LocalStorage.getProperty(LocalStorage.moreMinimizedKey));

            // Update the list when a room changes
            $scope.$on(UpdateRoomActiveStatusNotification, $scope.updateList);
            $scope.$on(RoomUpdatedNotification, $scope.updateList);
            $scope.$on(LogoutNotification, $scope.updateList);


        };

        $scope.updateList = function () {

            Log.notification(UpdateRoomActiveStatusNotification, 'RoomListBoxController');

            $scope.rooms = Cache.inactiveRooms();

            // Sort rooms by the number of unread messages
            $scope.rooms.sort(function (a, b) {
                // First order by number of unread messages
                // Badge can be null
                var ab = a.badge ? a.badge : 0;
                var bb = b.badge ? b.badge : 0;

                if(ab != bb) {
                    return bb - ab;
                }
                // Otherwise sort them by number of users
                else {
                    return b.onlineUserCount - a.onlineUserCount;
                }
            });

            $scope.moreChatsMinimized = $scope.rooms.length == 0;

            $timeout(function(){
                $scope.$digest();
            });
        };

        $scope.roomClicked = function(room) {

            // Get the left most room
            var rooms = RoomPositionManager.getRooms();

            // Get the last box that's active
            for(var i = rooms.length - 1; i >= 0; i--) {
                if(rooms[i].active) {

                    // Get the details of the final room
                    var offset = rooms[i].offset;
                    var width = rooms[i].width;
                    var height = rooms[i].height;
                    var slot = rooms[i].slot;

                    // Update the old room with the position of the new room
                    rooms[i].setOffset(room.offset);
                    rooms[i].width = room.width;
                    rooms[i].height = room.height;
                    //rooms[i].active = false;
                    rooms[i].setActive(false);
                    rooms[i].slot = room.slot;

                    // Update the new room
                    room.setOffset(offset);
                    room.width = width;
                    room.height = height;

                    //room.setSizeToDefault();
                    room.setActive(true);
                    room.badge = null;
                    room.minimized = false;
                    room.slot = slot;

//                RoomPositionManager.setDirty();
//                RoomPositionManager.updateRoomPositions(room, 0);
//                RoomPositionManager.updateAllRoomActiveStatus();

                    break;
                }
            }
            $rootScope.$broadcast(UpdateRoomActiveStatusNotification);

        };

        $scope.minimize = function () {
            $scope.setMoreBoxMinimized(true);
        };

        $scope.toggle = function () {
            $scope.setMoreBoxMinimized(!$scope.hideRoomList);
        };

        $scope.setMoreBoxMinimized = function (minimized) {
            $scope.hideRoomList = minimized;
            LocalStorage.setProperty(LocalStorage.moreMinimizedKey, minimized);
        };

        $scope.init();

    }]);