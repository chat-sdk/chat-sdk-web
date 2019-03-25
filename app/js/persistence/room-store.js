angular.module('myApp.services').factory('RoomStore', ['$rootScope', '$timeout', '$window', 'LocalStorage', 'Room', 'BeforeUnload', 'ArrayUtils',
    function ($rootScope, $timeout, $window, LocalStorage, Room, BeforeUnload, ArrayUtils) {
        var RoomStore = {

            rooms: {},

            roomsLoadedFromMemory: false,

            init: function () {

                BeforeUnload.addListener(this);

                return this;
            },

            /**
             * Load the private rooms so they're available
             * to the inbox list
             */
            loadPrivateRoomsToMemory: function () {

                if(this.roomsLoadedFromMemory || !$rootScope.user) {
                    return;
                }
                this.roomsLoadedFromMemory = true;

                // Load private rooms
                var rooms = LocalStorage.rooms;
                for(var key in rooms) {
                    if(rooms.hasOwnProperty(key)) {
                        this.getOrCreateRoomWithID(key);
                    }
                }
            },

            beforeUnload: function () {
                this.sync();
            },

            sync: function () {
                LocalStorage.storeRooms(this.rooms);
                LocalStorage.sync();
            },

            getOrCreateRoomWithID: function (rid) {

                var room = this.getRoomWithID(rid);

                if(!room) {
                    room = this.buildRoomWithID(rid);
                    this.addRoom(room);
                }

                return room;
            },

            buildRoomWithID: function (rid) {

                var room = new Room(rid);
                room.associatedUserID = $rootScope.user.uid();

//            room.height = ChatRoomHeight;
//            room.width = ChatRoomWidth;

                // Update the room from the saved state
                LocalStorage.updateRoomFromStore(room);

                return room;
            },

            addRoom: function (room) {
                if(room && room.rid()) {
                    this.rooms[room.rid()] = room;
                }
            },

            removeRoom: function (room) {
                if(room && room.rid()) {
                    delete this.rooms[room.rid()];
                }
            },

            getRoomWithID: function (rid) {
                return this.rooms[rid];
            },

            clear: function () {
                this.rooms = {};
            },

            getPrivateRooms: function () {

                if(!$rootScope.user) {
                    return [];
                }

                this.loadPrivateRoomsToMemory();

                var rooms = [];
                for(var rid in this.rooms) {
                    if(this.rooms.hasOwnProperty(rid)) {
                        var room = this.rooms[rid];
                        // Make sure that we only return private rooms for the current user
                        if(!room.isPublic() && !room.deleted && room.associatedUserID && room.associatedUserID == $rootScope.user.uid() && room.usersMeta != {}) {
                            rooms.push(this.rooms[rid]);
                        }
                    }
                }
                return rooms;
            },

            getPrivateRoomsWithUsers: function (user1, user2) {
                var rooms = [];
                for(var key in this.rooms) {
                    if(this.rooms.hasOwnProperty(key)) {
                        if(!this.rooms[key].isPublic()) {
                            rooms.push(this.rooms[key]);
                        }
                    }
                }
                rooms = ArrayUtils.getRoomsWithUsers(rooms, [user1, user2]);
                return ArrayUtils.roomsSortedByMostRecent(rooms);
            },

            inboxBadgeCount: function () {
                var count = 0;
                var rooms = this.getPrivateRooms();
                for(var i = 0; i < rooms.length; i++) {
                    count += rooms[i].badge;
                }
                return count;
            }

        };
        return RoomStore.init();
    }]);