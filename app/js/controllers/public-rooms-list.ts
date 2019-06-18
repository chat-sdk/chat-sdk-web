import * as angular from 'angular'
import {
    LogoutNotification,
    PublicRoomAddedNotification,
    PublicRoomRemovedNotification,
    RoomUpdatedNotification
} from "../keys/notification-keys";

angular.module('myApp.controllers').controller('PublicRoomsListController', ['$scope', '$timeout', 'Log', 'ArrayUtils', 'Utils', function($scope, $timeout, Log, ArrayUtils, Utils) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(PublicRoomAddedNotification, (function (event, room) {
            Log.notification(PublicRoomAddedNotification, 'PublicRoomsListController');
            // Add the room and sort the list
            if(!ArrayUtils.contains($scope.allRooms, room)) {
                $scope.allRooms.push(room);
            }
            $scope.updateList();

        }).bind(this));

        $scope.$on(PublicRoomRemovedNotification, function (event, room) {
            Log.notification(PublicRoomRemovedNotification, 'PublicRoomsListController');

            ArrayUtils.remove($scope.allRooms, room);
            $scope.updateList();

        });

        // Update the list if the user count on a room changes
        $scope.$on(RoomUpdatedNotification, $scope.updateList);

        $scope.$on(LogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);
    };


    $scope.updateList = function () {

        Log.notification(LogoutNotification, 'PublicRoomsListController');

        $scope.allRooms.sort(function(a, b) {

            var au = Utils.unORNull(a.meta.userCreated) ? false : a.meta.userCreated;
            var bu = Utils.unORNull(b.meta.userCreated) ? false : b.meta.userCreated;

            if(au != bu) {
                return au ? 1 : -1;
            }

            // Weight
            var aw = Utils.unORNull(a.meta.weight) ? 100 : a.meta.weight;
            var bw = Utils.unORNull(b.meta.weight) ? 100 : b.meta.weight;

            if(aw != bw) {
                return aw - bw;
            }
            else {

                var ac = a.getOnlineUserCount();
                var bc = b.getOnlineUserCount();

                //console.log("1: " + ac + ", 2: " + bc);

                if(ac != bc) {
                    return bc - ac;
                }
                else {
                    return a.name < b.name ? -1 : 1;
                }
            }

        });

        $scope.rooms = ArrayUtils.filterByKey($scope.allRooms, $scope.search[$scope.activeTab], function (room) {
            return room.meta.name;
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

//    $scope.getRooms = function() {
//        // Filter rooms by search text
//        return Utilities.filterByName(Cache.getPublicRooms(), $scope.search[$scope.activeTab]);
//    };

    $scope.init();

}]);