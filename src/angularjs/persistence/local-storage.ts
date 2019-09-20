import * as angular from 'angular';

import { Utils } from '../services/utils';
import { IUser } from '../entities/user';
import { IRoom } from '../entities/room';
import { IWebStorage } from './web-storage';
import { StringAnyObject } from '../interfaces/string-any-object';

export interface ILocalStorage {
    moreMinimizedKey: string;
    rooms: {};
    tokenExpiryKey: string;
    tokenKey: string;
    UIDKey: string;
    clearCache(): void;
    getProperty(key: string): any;
    isMuted(): boolean;
    removeProperty(key: string): void;
    setMuted(muted: boolean): void;
    setProperty(key: string, value: any): void;
    storeRooms(rooms: { [key: string]: IRoom }): void;
    storeUsers(users: { [key: string]: IUser }): void;
    sync(): void;
    updateRoomFromStore(room: IRoom): void;
    updateUserFromStore(user: IUser): boolean;
}

class LocalStorage implements ILocalStorage {

    static $inject = ['WebStorage'];

    constructor (
        private WebStorage: IWebStorage
    ) {
        const rooms = this.getProperty(this.roomsKey);

        if (rooms && rooms.length) {
            let room = null;
            for (let i = 0; i < rooms.length; i++) {
                room = rooms[i];
                if (room.meta) {
                    this.rooms[room.meta.rid] = room;
                }
            }
        }

        const sus = this.getProperty(this.usersKey);
        if (sus && sus.length) {
            let su = null;

            for (let i = 0; i < sus.length; i++) {
                su = sus[i];
                if (su.meta) {
                    this.users[su.meta.uid] = su;
                }
            }
        }
    }

    mainMinimizedKey = 'cc_main_minimized';
    moreMinimizedKey = 'cc_more_minimized';

    // Tokens
    tokenKey = 'cc_token';
    UIDKey = 'cc_uid';
    tokenExpiryKey = 'cc_token_expiry';

    // API Details
    apiDetailsKey = 'cc_api_details';

    roomsKey = 'cc_rooms';
    usersKey = 'cc_users';

    onlineCountKey = 'cc_online_count';
    timestampKey = 'cc_timestamp';

    lastVisited = 'cc_last_visited';

    rooms: { [key: string]: StringAnyObject } = {};
    users: { [key: string]: StringAnyObject } = {};

    cacheCleared = false;

    isOffline(): boolean {
        return this.getProperty('cc_offline');
    }

    setOffline(offline: boolean) {
        this.setProperty('cc_offline', offline);
    }

    isMuted(): boolean {
        return this.getProperty('cc_muted');
    }

    setMuted(muted: boolean) {
        this.setProperty('cc_muted', muted);
    }

    storeRooms(rooms: { [key: string]: IRoom }) {
        let room: IRoom;
        let sr = Array<StringAnyObject>();
        for (let key in rooms) {
            if (rooms.hasOwnProperty(key)) {
                room = rooms[key];
                sr.push(room.serialize());
            }
        }
        this.setProperty(this.roomsKey, sr);
    }

    storeUsers(users: { [key: string]: IUser }) {
        let user: IUser;
        let su = Array<StringAnyObject>();
        for (let key in users) {
            if (users.hasOwnProperty(key)) {
                user = users[key];
                su.push(user.serialize());
            }
        }
        this.setProperty(this.usersKey, su);
    }

    sync() {
        this.WebStorage.sync();
    }

    updateRoomFromStore(room: IRoom) {
        let sr = this.rooms[room.rid()];
        if (sr) {
            room.deserialize(sr);
        }
    }

    updateUserFromStore(user: IUser): boolean {
        let su = this.users[user.uid()];
        if (su) {
            user.deserialize(su);
            return true;
        }
        return false;
    }

    getLastVisited(): number {
        return this.getProperty(this.lastVisited);
    }

    setLastVisited() {
        this.setProperty(this.lastVisited, new Date().getTime());
    }

    setProperty(key: string, value: any) {
        if (!this.cacheCleared) {
            this.WebStorage.setProperty(key, value);
        }
    }

    getProperty(key: string): any {
        let c = this.WebStorage.getProperty(key);

        if (!Utils.unORNull(c)) {
            let e;
            try {
                e = eval(c);
            }
            catch (error) {
                e = c;
            }
            return e;
        }
        else {
            return null;
        }
    }

    removeProperty(key: string) {
        this.setProperty(key, null);
    }

    clearCache() {
        this.removeProperty(this.roomsKey);
        this.removeProperty(this.usersKey);
        this.removeProperty(this.lastVisited);
        this.clearToken();
        this.cacheCleared = true;
    }

    clearCacheWithTimestamp(timestamp: number) {
        if (!timestamp) return;

        let currentTimestamp = this.getProperty(this.timestampKey);
        if (!currentTimestamp || timestamp > currentTimestamp) {
            this.removeProperty(this.roomsKey);
            this.removeProperty(this.usersKey);
            this.clearToken();
            this.setProperty(this.timestampKey, timestamp);
            this.cacheCleared = true;
        }
    }

    clearToken() {
        this.removeProperty(this.tokenKey);
        this.removeProperty(this.UIDKey);
        this.removeProperty(this.tokenExpiryKey);
        this.removeProperty(this.apiDetailsKey);
    }

}

angular.module('myApp.services').service('LocalStorage', LocalStorage);
