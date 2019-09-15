import * as angular from 'angular'
import {N} from "../keys/notification-keys";
import {IRoom} from "../entities/room";
import {ArrayUtils} from "../services/array-utils";
import {Utils} from "../services/utils";

/**
 * Temporary cache i.e. current rooms etc...
 */

export interface ICache {
    rooms: IRoom []
    addRoom(room: IRoom): void
    removeRoom(room: IRoom): void
    activeRooms(): IRoom []
    inactiveRooms(): IRoom[]
    isBlockedUser(uid): boolean
    addBlockedUser(user): void
    removeBlockedUserWithID(uid: string): void
}

class Cache implements ICache {

    // The user's active rooms
    //
    rooms = [];

    // These are user specific stores
    //onlineUsers: {},
    //friends: {},
    blockedUsers = {};

    static $inject = ['$rootScope', '$timeout'];

    constructor (private $rootScope, private $timeout) {
    }

    /**
     * Rooms
     */

    addRoom(room: IRoom) {
        if(!ArrayUtils.contains(this.rooms, room)) {
            room.isOpen = true;
            this.rooms.push(room);
        }
    }

//        roomExists(room) {
//            return ArrayUtils.contains(this.rooms, room);
//        }

    removeRoom(room) {
        room.isOpen = false;
        ArrayUtils.remove(this.rooms, room);
    }

    activeRooms() {
        let ar = [];
        for(let i =0; i < this.rooms.length; i++) {
            if(this.rooms[i].active) {
                ar.push(this.rooms[i]);
            }
        }
        return ar;
    }

    inactiveRooms(): IRoom[] {
        let ar = [];
        for(let i =0; i < this.rooms.length; i++) {
            if(!this.rooms[i].active) {
                ar.push(this.rooms[i]);
            }
        }
        return ar;
    }

    /**
     * Blocked users
     */

    addBlockedUser(user): void {
        if(user && user.meta && user.uid()) {
            this.blockedUsers[user.uid()] = user;
            user.blocked = true;
            this.$rootScope.$broadcast(N.UserBlocked);
        }
    }

    isBlockedUser(uid): boolean {
        return !Utils.unORNull(this.blockedUsers[uid]);
    }

    removeBlockedUserWithID(uid: string): void {
        if(uid) {
            const user = this.blockedUsers[uid];
            if(user) {
                user.blocked = false;
                delete this.blockedUsers[uid];
                this.$rootScope.$broadcast(N.UserUnblocked);
            }
        }
    }


    /**
     * Utility functions
     */

    clear() {

        this.blockedUsers = {};
        this.rooms = [];

        this.$timeout(() => {
            this.$rootScope.$digest();
        });
    }


    getPrivateRoomsWithUsers(user1, user2) {
        const rooms = ArrayUtils.getRoomsWithUsers(this.getPrivateRooms(), [user1, user2]);
        return ArrayUtils.roomsSortedByMostRecent(rooms);
    }

    getPrivateRooms() {
        const rooms = [];
        for(let i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            if(!room.isPublic()) {
                rooms.push(room);
            }
        }
        return rooms;
    }
}

angular.module('myApp.services').service('Cache', Cache);