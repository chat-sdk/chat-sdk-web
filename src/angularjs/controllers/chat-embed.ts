import * as angular from 'angular'


import {RoomType} from "../keys/room-type";
import {UserStatus} from "../keys/user-status";
import {N} from "../keys/notification-keys";

angular.module('myApp.controllers').controller('ChatEmbedController', ['$scope', '$timeout', '$rootScope', 'RoomStore', function($scope, $timeout, $rootScope, RoomStore) {

    $scope.rooms = [];

    $scope.init = (rid, width, height) => {
        $scope.rid = rid;
        $scope.width = width;
        $scope.height = height;

        // When login is complete setup this room
        $scope.$on(N.LoginComplete, () => {

            let rid = $scope.rid;
            let room = RoomStore.getOrCreateRoomWithID(rid);
            room.on().then(() => {

                room.width = $scope.width;
                room.height = $scope.height;

                let open = () => {

                    // Start listening to message updates
                    room.messagesOn(room.deletedTimestamp);

                    // Start listening to typing indicator updates
                    room.typingOn();

                };

                switch (room.getType()) {
                    case RoomType.Public:
                        room.join(UserStatus.Member).then(() => {
                            open();
                        }, (error) => {
                            console.log(error);
                        });
                        break;
                    case RoomType.Group:
                    case RoomType.OneToOne:
                        open();
                }

                $scope.rooms = [
                    room
                ];

                $timeout(() => {
                    $rootScope.$digest();
                });

            });

        });
    };
}]);