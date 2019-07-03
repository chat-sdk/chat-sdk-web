import * as angular from 'angular'
import {ShowCreateChatBox} from "../keys/defines";
import {RoomType1to1} from "../keys/room-type";

angular.module('myApp.controllers').controller('CreateRoomController', ['$scope', '$timeout', 'Auth', 'Room', 'Log', 'RoomOpenQueue',
    function($scope, $timeout, Auth, Room, Log, RoomOpenQueue) {

        $scope.public = false;

        $scope.init = function () {
            $scope.clearForm();

            $scope.$on(ShowCreateChatBox, function () {
                Log.notification(ShowCreateChatBox, 'CreateRoomController');
                $scope.focusName = true;
            });

        };

        $scope.createRoom  = function () {

            let promise;

            // Is this a public room?
            if($scope.public) {
                promise = Room.createPublicRoom(
                    $scope.room.name,
                    $scope.room.description
                );
            }
            else {
                promise = Room.createRoom(
                    $scope.room.name,
                    $scope.room.description,
                    $scope.room.invitesEnabled,
                    RoomType1to1
                );
            }

            promise.then(function (rid) {
                RoomOpenQueue.addRoomWithID(rid);

//                let room = RoomStore.getOrCreateRoomWithID(rid);
//                room.on().then(function () {
//                    room.open(0, 300);
//                });
            });

            $scope.back();
        };

        $scope.back  = function () {
            $scope.clearForm();
            $scope.showMainBox();
        };

        $scope.clearForm = function () {
            $scope.room = {
                invitesEnabled: false,
                name: null,
                description: null
            };
        };

        $scope.init();

    }]);