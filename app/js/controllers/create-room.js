angular.module('myApp.controllers').controller('CreateRoomController', ['$scope', '$timeout', 'Auth', 'Room', 'Log', 'RoomOpenQueue',
    function($scope, $timeout, Auth, Room, Log, RoomOpenQueue) {

        $scope.public = false;

        $scope.init = function () {
            $scope.clearForm();

            $scope.$on(bShowCreateChatBox, function () {
                Log.notification(bShowCreateChatBox, 'CreateRoomController');
                $scope.focusName = true;
            });

        };

        $scope.createRoom  = function () {

            var promise;

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
                    bRoomType1to1
                );
            }

            promise.then(function (rid) {
                RoomOpenQueue.addRoomWithID(rid);

//                var room = RoomStore.getOrCreateRoomWithID(rid);
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