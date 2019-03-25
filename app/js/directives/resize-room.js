angular.module('myApp.directives').directive('resizeRoom',['$rootScope', '$timeout', '$document', 'Screen', 'RoomPositionManager', function ($rootScope, $timeout, $document, Screen, RoomPositionManager) {
    return function (scope, elm, attrs) {

        var lastClientX = 0;
        var lastClientY = 0;

        elm.mousedown((function (e) {
            stopDefault(e);
            scope.resizing = true;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
        }).bind(this));

        $document.mousemove((function (e) {
            if(scope.resizing) {

                stopDefault(e);

                // Min width
                scope.room.width += lastClientX - e.clientX;
                scope.room.width = Math.max(scope.room.width, ChatRoomWidth);
                scope.room.width = Math.min(scope.room.width, RoomPositionManager.effectiveScreenWidth() - scope.room.offset - ChatRoomSpacing);

                lastClientX = e.clientX;

                // Min height
                scope.room.height += lastClientY - e.clientY;
                scope.room.height = Math.max(scope.room.height, ChatRoomHeight);
                scope.room.height = Math.min(scope.room.height, Screen.screenHeight - ChatRoomTopMargin);

                lastClientY = e.clientY;

                // Update the room's scope
                $timeout(function () {
                    scope.$digest();
                });

                // We've changed the room's size so we need to re-calculate
                RoomPositionManager.setDirty();

                // Update the rooms to the left
                var rooms = RoomPositionManager.getRooms();

                // Only loop from this room's position onwards
                var room;
                for(var i = rooms.indexOf(scope.room); i < rooms.length; i++) {
                    room = rooms[i];
                    if(room != scope.room) {
                        room.setOffset(RoomPositionManager.offsetForSlot(i));
                        $rootScope.$broadcast(RoomPositionUpdatedNotification, room);
                        RoomPositionManager.updateAllRoomActiveStatus();
                    }
                }

                return false;
            }
        }).bind(this));

        $document.mouseup((function (e) {
            if(scope.resizing) {
                scope.resizing = false;
            }
        }).bind(this));

    };
}]);