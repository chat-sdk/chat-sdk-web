import * as angular from 'angular'
import {IRoom} from "../entities/room";
import {ILocalStorage} from "./local-storage";
import {IUserStore} from "./user-store";
import {ArrayUtils} from "../services/array-utils";

export interface IRoomStore {
    getOrCreateRoomWithID(rid): IRoom
    getRoomWithID(rid: string): IRoom
    removeRoom(room: IRoom): void
}

class RoomStore implements IRoomStore {

    rooms = {};
    roomsLoadedFromMemory = false;

    static $inject = ['LocalStorage', 'Room', 'BeforeUnload', 'UserStore'];

    constructor(
        private LocalStorage: ILocalStorage,
        private Room,
        BeforeUnload,
        private UserStore: IUserStore) {
        BeforeUnload.addListener(this);
    }

    /**
     * Load the private rooms so they're available
     * to the inbox list
     */
    loadPrivateRoomsToMemory(): void {

        if (this.roomsLoadedFromMemory || !this.UserStore.currentUser()) {
            return;
        }
        this.roomsLoadedFromMemory = true;

        // Load private rooms
        let rooms = this.LocalStorage.rooms;
        for (let key in rooms) {
            if (rooms.hasOwnProperty(key)) {
                this.getOrCreateRoomWithID(key);
            }
        }
    }

    beforeUnload(): void {
        this.sync();
    }

    sync() {
        this.LocalStorage.storeRooms(this.rooms);
        this.LocalStorage.sync();
    }

    getOrCreateRoomWithID(rid: string): IRoom {

        let room = this.getRoomWithID(rid);

        if (!room) {
            room = this.buildRoomWithID(rid);
            this.addRoom(room);
        }

        return room;
    }

    buildRoomWithID(rid: string): IRoom {

        let room = this.Room(rid);
        room.associatedUserID = this.UserStore.currentUser().uid();

//            room.height = ChatRoomHeight;
//            room.width = ChatRoomWidth;

        // Update the room from the saved state
        this.LocalStorage.updateRoomFromStore(room);

        return room;
    }

    addRoom(room) {
        if (room && room.rid()) {
            this.rooms[room.rid()] = room;
        }
    }

    removeRoom(room: IRoom): void {
        if (room && room.rid()) {
            delete this.rooms[room.rid()];
        }
    }

    getRoomWithID(rid: string): IRoom {
        return this.rooms[rid];
    }

    clear() {
        this.rooms = {};
    }

    getPrivateRooms() {

        if (!this.UserStore.currentUser()) {
            return [];
        }

        this.loadPrivateRoomsToMemory();

        let rooms = [];
        for (let rid in this.rooms) {
            if (this.rooms.hasOwnProperty(rid)) {
                let room = this.rooms[rid];
                // Make sure that we only return private rooms for the current user
                if (!room.isPublic() && !room.deleted && room.associatedUserID && room.associatedUserID == this.UserStore.currentUser().uid() && room.usersMeta != {}) {
                    rooms.push(this.rooms[rid]);
                }
            }
        }
        return rooms;
    }

    getPrivateRoomsWithUsers(user1, user2) {
        let rooms = [];
        for (let key in this.rooms) {
            if (this.rooms.hasOwnProperty(key)) {
                if (!this.rooms[key].isPublic()) {
                    rooms.push(this.rooms[key]);
                }
            }
        }
        rooms = ArrayUtils.getRoomsWithUsers(rooms, [user1, user2]);
        return ArrayUtils.roomsSortedByMostRecent(rooms);
    }

    inboxBadgeCount() {
        let count = 0;
        let rooms = this.getPrivateRooms();
        for (let i = 0; i < rooms.length; i++) {
            count += rooms[i].badge;
        }
        return count;
    }
}

angular.module('myApp.services').service('RoomStore', RoomStore);