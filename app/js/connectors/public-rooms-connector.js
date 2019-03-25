angular.module('myApp.services').factory('PublicRoomsConnector', ['$rootScope', 'Room', 'RoomStore', 'Paths',
    function ($rootScope, Room, RoomStore, Paths) {
        return {
            on: function () {
                var publicRoomsRef = Paths.publicRoomsRef();

                // Start listening to Firebase
                publicRoomsRef.on('child_added', (function (snapshot) {

                    var rid = snapshot.key;
                    if(rid) {
                        var room = RoomStore.getOrCreateRoomWithID(rid);

                        // TODO: Remove this
                        //room.newPanel = snapshot.val().newPanel;

                        room.on().then(function () {

                            $rootScope.$broadcast(PublicRoomAddedNotification, room);

                            // Check to see if the room is marked as public
                            // TODO: Depricated code fix for old customers who didn't have
                            // public room flagged
//                        if(!room.meta.isPublic && !room.meta.type) {
//                            var ref = Paths.roomMetaRef(room.rid());
//                            ref.update({type: RoomTypePublic});
//                        }

                            //RoomStore.addRoom(room);

                        });

                    }

                }).bind(this));

                publicRoomsRef.on('child_removed', (function (snapshot) {

                    var room = RoomStore.getOrCreateRoomWithID(snapshot.key);
                    $rootScope.$broadcast(PublicRoomRemovedNotification, room);


                }).bind(this));
            },

            off: function () {
                var publicRoomsRef = Paths.publicRoomsRef();

                publicRoomsRef.off('child_added');
                publicRoomsRef.off('child_removed');
            }
        }
    }]);