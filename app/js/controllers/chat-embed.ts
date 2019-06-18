import * as angular from 'angular'
import {LoginCompleteNotification} from "../keys/notification-keys";
import {RoomType1to1, RoomTypeGroup, RoomTypePublic} from "../keys/room-type";
import {UserStatusMember} from "../keys/user-status";

angular.module('myApp.controllers').controller('ChatEmbedController', ['$scope', '$timeout', '$rootScope', 'RoomStore', 'Utils', function($scope, $timeout, $rootScope, RoomStore, Utils) {

    $scope.rooms = [];

    $scope.init = function (rid, width, height) {
        $scope.rid = rid;
        $scope.width = width;
        $scope.height = height;

        // When login is complete setup this room
        $scope.$on(LoginCompleteNotification, (function () {

            let rid = $scope.rid;
            let room = RoomStore.getOrCreateRoomWithID(rid);
            room.on().then((function () {

                room.width = $scope.width;
                room.height = $scope.height;

                let open = (function () {

                    // Start listening to message updates
                    room.messagesOn(room.deletedTimestamp);

                    // Start listening to typing indicator updates
                    room.typingOn();

                }).bind(this);

                switch (room.type()) {
                    case RoomTypePublic:
                        room.join(UserStatusMember).then((function () {
                            open();
                        }).bind(this), function (error) {
                            console.log(error);
                        });
                        break;
                    case RoomTypeGroup:
                    case RoomType1to1:
                        open();
                }

                $scope.rooms = [
                    room
                ];

                $timeout(function() {
                    $rootScope.$digest();
                });

            }).bind(this));

        }).bind($scope));

    };

}]);