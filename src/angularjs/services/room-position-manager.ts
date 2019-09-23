import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IRoom } from '../entities/room';
import { Dimensions } from '../keys/dimensions';
import { ArrayUtils } from './array-utils';
import { IRootScope } from '../interfaces/root-scope';
import { ILocalStorage } from '../persistence/local-storage';
import { ICache } from '../persistence/cache';
import { IScreen } from './screen';

/**
 * This service keeps track of the slot positions
 * while the rooms are moving around
 */

export interface IRoomPositionManager {
    closeRoom(room: IRoom): void;
    effectiveScreenWidth(): number;
    getRooms(): any[];
    insertRoom(room: IRoom, slot: number, duration: number): void;
    offsetForSlot(slot: number): number;
    roomDragged(room: IRoom): void;
    roomIsOpen(room: IRoom): boolean;
    setDirty(): void;
    updateAllRoomActiveStatus(): void;
    updateRoomPositions(room: IRoom, duration: number): void;
}

class RoomPositionManager implements IRoomPositionManager {

    static $inject = ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage', 'Cache', 'Screen'];

    private rooms = Array<IRoom>();
    private dirty: boolean;
    private slotPositions = Array<number>();

    constructor(
        private $rootScope: IRootScope,
        private $timeout: ng.ITimeoutService,
        private $document: ng.IDocumentService,
        private $window: ng.IWindowService,
        private LocalStorage: ILocalStorage,
        private Cache: ICache,
        private Screen: IScreen,
    ) {
        this.updateAllRoomActiveStatus();
        $rootScope.$on(N.ScreenSizeChanged, () => {
            this.updateAllRoomActiveStatus();
        });
    }

    roomDragged(room: IRoom) {

        this.calculateSlotPositions();

        // Right to left
        let nextSlot = room.slot;
        let nextRoom = null;

        if (room.dragDirection > 0) {
            nextSlot++;
            if (this.rooms.length > nextSlot) {

                nextRoom = this.rooms[nextSlot];

                // If the room is covering over half of the next room
                if (room.offset + room.width > this.slotPositions[nextSlot] + nextRoom.width/2) {
                    this.setDirty();
                    room.slot = nextSlot;
                    this.$rootScope.$broadcast(N.AnimateRoom, {
                        room: nextRoom,
                        slot: nextSlot - 1
                    });
                }
            }
        }
        // Left to right
        else {
            nextSlot--;
            if (nextSlot >= 0) {

                nextRoom = this.rooms[nextSlot];

                // If the room is covering over half of the next room
                if (room.offset < this.slotPositions[nextSlot] + nextRoom.width / 2) {
                    this.setDirty();
                    room.slot = nextSlot;
                    this.$rootScope.$broadcast(N.AnimateRoom, {
                        room: nextRoom,
                        slot: nextSlot + 1
                    });
                }
            }
        }
    }

    insertRoom(room: IRoom, slot: number, duration: number) {

        // If the room is already added then return
        if (this.roomIsOpen(room)) {
            room.isOpen = true;
            return;
        }

        // Update the rooms from the cache
        this.updateRoomsList();

        // We have no slot so add it to the max position
        if (slot == -1) {
            slot = this.rooms.length;
        }

        let i;

        // Move the rooms left
        for (i = slot; i < this.rooms.length; i++) {
            this.rooms[i].slot++;
        }

        // Add the room
        this.Cache.addRoom(room);

        room.slot = slot;

        // Flag as dirty since we've added a room
        this.setDirty();

        // Recalculate
        this.calculateSlotPositions();

        this.$rootScope.$broadcast(N.RoomPositionUpdated, room);

        for (i = slot; i < this.rooms.length; i++) {
            this.$rootScope.$broadcast(N.AnimateRoom, {
                room: this.rooms[i],
                duration: duration
            });
        }

        room.updateOffsetFromSlot();
        this.$rootScope.$broadcast(N.RoomOpened, room);

        this.updateAllRoomActiveStatus();

    }

    roomIsOpen(room: IRoom) {
        return ArrayUtils.contains(this.rooms, room);
    }

    closeRoom(room: IRoom) {

        if (!this.roomIsOpen(room)) {
            room.isOpen = false;
            return;
        }

        this.Cache.removeRoom(room);

        // Set the room width to default
        room.setSizeToDefault();

        this.autoPosition(300);
        this.updateAllRoomActiveStatus();

        this.$rootScope.$broadcast(N.RoomClosed, room);

    }

    closeAllRooms() {
        for (let i = 0; i < this.rooms.length; i++) {
            this.closeRoom(this.rooms[i]);
        }
    }

    autoSetSlots() {
        for (let i = 0; i < this.rooms.length; i++) {
            this.rooms[i].slot = i;
        }
    }

    autoPosition(duration: number) {

        this.calculateSlotPositions(true);
        this.autoSetSlots();

        // Are there any inactive rooms?
        // We do this because we can't animate rooms that
        // are inactive
        if (this.Cache.inactiveRooms().length) {
            duration = 0;
        }

        // Animate all rooms into position
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].active && duration > 0) {
                this.$rootScope.$broadcast(N.AnimateRoom, {
                    room: this.rooms[i],
                    duration: duration
                });
            }
            // We need this because if a room isn't active then it's
            // HTML and therefore controller won't exist
            else {
                this.rooms[i].updateOffsetFromSlot();
            }
        }
    }

    updateAllRoomActiveStatus() {

        if (this.rooms.length === 0) {
            return;
        }

        this.calculateSlotPositions(true);

        let effectiveScreenWidth = this.effectiveScreenWidth();

        // Get the index of the current room
        // If any room has gone changed their active status then digest
        let digest;

        for (let i = 0; i < this.rooms.length; i++) {
            if ((this.slotPositions[i] + this.rooms[i].width) < effectiveScreenWidth) {
                digest = digest || this.rooms[i].active == false;
                this.rooms[i].setActive(true);
            }
            else {
                digest = digest || this.rooms[i].active == true;
                this.rooms[i].setActive(false);
            }
        }
        if (digest) {
            this.$rootScope.$broadcast(N.UpdateRoomActiveStatus);
        }
    }

    updateRoomPositions(room: IRoom, duration: number) {

        this.calculateSlotPositions();

        if (this.rooms.length) {
            for (let i = Math.max(this.rooms.indexOf(room), 0); i < this.rooms.length; i++) {
                if (this.rooms[i].active && duration > 0) {
                    this.$rootScope.$broadcast(N.AnimateRoom, {
                        room: this.rooms[i],
                        duration: duration
                    });
                }
                else {
                    this.rooms[i].updateOffsetFromSlot();
                }
            }
        }
    }

    /**
     * Returns the width of the screen -
     * if the room list is showing then it subtracts it's width
     * @returns {Usable screen width}
     */
    effectiveScreenWidth(): number {

        this.calculateSlotPositions();

        let width = this.Screen.screenWidth;

        if (!this.rooms.length) {
            return width;
        }

        // Check the last box to see if it's off the end of the
        // screen
        let lastRoom = this.rooms[this.rooms.length - 1];

        // If we can fit the last room in then
        // the rooms list will be hidden which will
        // give us extra space
        if (lastRoom.width + this.slotPositions[lastRoom.slot] > this.Screen.screenWidth) {
            width -= Dimensions.RoomListBoxWidth;
        }

        return width;
    }

    getRooms(): IRoom[] {
        this.calculateSlotPositions();
        return this.rooms;
    }

    updateRoomsList() {
        this.rooms = this.Cache.rooms;

        // Sort the rooms by slot
        this.rooms.sort((a, b) => {
            return a.slot - b.slot;
        });
    }

    setDirty() {
        this.dirty = true;
    }

    calculateSlotPositions(force?: boolean) {
        if (force) {
            this.setDirty();
        }
        if (!this.dirty) {
            return;
        }

        this.dirty = false;

        this.updateRoomsList();

        this.slotPositions = [];

        // Work out the positions
        let p = Dimensions.MainBoxWidth + Dimensions.ChatRoomSpacing;
        for (let i = 0; i < this.rooms.length; i++) {

            this.slotPositions.push(p);

            p += this.rooms[i].minimized ? Dimensions.ChatRoomWidth : this.rooms[i].width;
            p += Dimensions.ChatRoomSpacing;
        }

//            for (let i in this.slotPositions) {
//                console.log("Slot: " + i + " - " + this.slotPositions[i]);
//            }
//            for (i = 0; i < this.rooms.length; i++) {
//                console.log("Room "+i+": " + this.rooms[i].slot);
//                if (i != this.rooms[i].slot) {
//                    console.log("ERRR");
//                }
//            }

    }

    offsetForSlot(slot: number) {
        this.calculateSlotPositions();
        return this.slotPositions[slot];
    }

}

angular.module('myApp.services').service('RoomPositionManager', RoomPositionManager);
