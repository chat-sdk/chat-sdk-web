import * as angular from 'angular'
import {IRoom} from "../entities/room";

export interface IRoomStore {
    getOrCreateRoomWithID(rid): IRoom
}

angular.module('myApp.services').factory('RoomStore', ['$rootScope', '$timeout', '$window', 'LocalStorage', 'Room', 'BeforeUnload', 'ArrayUtils',
    function ($rootScope, $timeout, $window, LocalStorage, Room, BeforeUnload, ArrayUtils) {
        let RoomStore = {

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
                let rooms = LocalStorage.rooms;
                for(let key in rooms) {
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

            getOrCreateRoomWithID: function (rid): IRoom {

                let room = this.getRoomWithID(rid);

                if(!room) {
                    room = this.buildRoomWithID(rid);
                    this.addRoom(room);
                }

                return room;
            },

            buildRoomWithID: function (rid) {

                let room = new Room(rid);
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

                let rooms = [];
                for(let rid in this.rooms) {
                    if(this.rooms.hasOwnProperty(rid)) {
                        let room = this.rooms[rid];
                        // Make sure that we only return private rooms for the current user
                        if(!room.isPublic() && !room.deleted && room.associatedUserID && room.associatedUserID == $rootScope.user.uid() && room.usersMeta != {}) {
                            rooms.push(this.rooms[rid]);
                        }
                    }
                }
                return rooms;
            },

            getPrivateRoomsWithUsers: function (user1, user2) {
                let rooms = [];
                for(let key in this.rooms) {
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
                let count = 0;
                let rooms = this.getPrivateRooms();
                for(let i = 0; i < rooms.length; i++) {
                    count += rooms[i].badge;
                }
                return count;
            }

        };
        return RoomStore.init();
    }]);