import * as angular from 'angular'


import {N} from "../keys/notification-keys";
import {Utils} from "../services/utils";
import {ArrayUtils} from "../services/array-utils";
import {Log} from "../services/log";

angular.module('myApp.controllers').controller('PublicRoomsListController', ['$scope', '$timeout', function($scope, $timeout) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(N.PublicRoomAdded, (event, room) => {
            Log.notification(N.PublicRoomAdded, 'PublicRoomsListController');
            // Add the room and sort the list
            if(!ArrayUtils.contains($scope.allRooms, room)) {
                $scope.allRooms.push(room);
            }
            $scope.updateList();

        });

        $scope.$on(N.PublicRoomRemoved, (event, room) => {
            Log.notification(N.PublicRoomRemoved, 'PublicRoomsListController');

            ArrayUtils.remove($scope.allRooms, room);
            $scope.updateList();

        });

        // Update the list if the user count on a room changes
        $scope.$on(N.RoomUpdated, $scope.updateList);

        $scope.$on(N.Logout, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);
    };


    $scope.updateList = function () {

        Log.notification(N.Logout, 'PublicRoomsListController');

        $scope.allRooms.sort((a, b) => {

            let au = Utils.unORNull(a.meta.userCreated) ? false : a.meta.userCreated;
            let bu = Utils.unORNull(b.meta.userCreated) ? false : b.meta.userCreated;

            if(au != bu) {
                return au ? 1 : -1;
            }

            // Weight
            let aw = Utils.unORNull(a.meta.weight) ? 100 : a.meta.weight;
            let bw = Utils.unORNull(b.meta.weight) ? 100 : b.meta.weight;

            if(aw != bw) {
                return aw - bw;
            }
            else {

                let ac = a.getOnlineUserCount();
                let bc = b.getOnlineUserCount();

                //console.log("1: " + ac + ", 2: " + bc);

                if(ac != bc) {
                    return bc - ac;
                }
                else {
                    return a.name < b.name ? -1 : 1;
                }
            }

        });

        $scope.rooms = ArrayUtils.filterByKey($scope.allRooms, $scope.search[$scope.activeTab], (room) => {
            return room.meta.name;
        });

        $timeout(() =>{
            $scope.$digest();
        });
    };

//    $scope.getRooms = function() {
//        // Filter rooms by search text
//        return Utilities.filterByName(Cache.getPublicRooms(), $scope.search[$scope.activeTab]);
//    };

    $scope.init();

}]);