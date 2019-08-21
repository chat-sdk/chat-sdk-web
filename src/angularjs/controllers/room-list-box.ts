import * as angular from 'angular'


import {N} from "../keys/notification-keys";
import {IRoom} from "../entities/room";
import {Dimensions} from "../keys/dimensions";
import {Log} from "../services/log";

export interface IRoomListScope extends ng.IScope {
    rooms: IRoom [],
    updateList(): void,
}

angular.module('myApp.controllers').controller('RoomListBoxController', ['$scope', '$rootScope', '$timeout', 'Auth', 'Cache', 'LocalStorage', 'RoomPositionManager',
    function($scope, $rootScope, $timeout, Auth, Cache, LocalStorage, RoomPositionManager) {

        $scope.rooms = [];
        $scope.moreChatsMinimized = true;
        $scope.roomBackgroundColor = '#FFF';

        $scope.init = function () {
            $scope.boxWidth = Dimensions.RoomListBoxWidth;
            $scope.boxHeight = Dimensions.RoomListBoxHeight;
            $scope.canCloseRoom = true;

            // Is the more box minimized?
            $scope.setMoreBoxMinimized(LocalStorage.getProperty(LocalStorage.moreMinimizedKey));

            // Update the list when a room changes
            $scope.$on(N.UpdateRoomActiveStatus, $scope.updateList);
            $scope.$on(N.RoomUpdated, $scope.updateList);
            $scope.$on(N.Logout, $scope.updateList);


        };

        $scope.updateList = function () {

            Log.notification(N.UpdateRoomActiveStatus, 'RoomListBoxController');

            $scope.rooms = Cache.inactiveRooms();

            // Sort rooms by the number of unread messages
            $scope.rooms.sort((a, b) => {
                // First order by number of unread messages
                // Badge can be null
                let ab = a.badge ? a.badge : 0;
                let bb = b.badge ? b.badge : 0;

                if(ab != bb) {
                    return bb - ab;
                }
                // Otherwise sort them by number of users
                else {
                    return b.onlineUserCount - a.onlineUserCount;
                }
            });

            $scope.moreChatsMinimized = $scope.rooms.length == 0;

            $timeout(() =>{
                $scope.$digest();
            });
        };

        $scope.roomClicked = function(room) {

            // Get the left most room
            let rooms = RoomPositionManager.getRooms();

            // Get the last box that's active
            for(let i = rooms.length - 1; i >= 0; i--) {
                if(rooms[i].active) {

                    // Get the details of the final room
                    let offset = rooms[i].offset;
                    let width = rooms[i].width;
                    let height = rooms[i].height;
                    let slot = rooms[i].slot;

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
            $rootScope.$broadcast(N.UpdateRoomActiveStatus);

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