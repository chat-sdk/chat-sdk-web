import {IRoom} from "../entities/room";
import {RoomType} from "../keys/room-type";
import {MessageKeys} from "../keys/message-keys";
import {Utils} from "./utils";

export class ArrayUtils {

    public static getRoomsWithUsers(rooms, users): Array<IRoom> {

        let roomsWithUsers = [];
        for(let i = 0; i < rooms.length; i++) {
            let room = rooms[i];
            if(room.containsOnlyUsers(users)) {
                if((users.length == 2 && room.getType() == RoomType.OneToOne) || (users.length != 2 && room.getType() == RoomType.Group)) {
                    roomsWithUsers.push(room);
                }
            }
        }
        return roomsWithUsers;
    }

    public static roomsSortedByMostRecent(rooms: Array<IRoom>): Array<IRoom> {
        rooms.sort((a: IRoom, b: IRoom) => {
            const almt = a.lastMessageTime();
            const blmt = b.lastMessageTime();
            const at = almt ? almt : a.created();
            const bt = blmt ? almt : b.created();
            return bt - at;
        });
        return rooms;
    }

    public static indexOf(array, id, getID) {
        for(let i = 0; i < array.length; i++) {
            if(id == getID(array[i])) {
                return i;
            }
        }
    }

    public static removeItem(array, id, getID): void {
        if(array.length == 0) {
            return;
        }
        let i = this.indexOf(array, id, getID);
        array.splice(i, 1);
    }

    public static getItem(array, id, getID) {
        if(array.length == 0) {
            return null;
        }
        let i = this.indexOf(array, id, getID);
        return array[i];
    }

    public static contains(array, obj): boolean {
        for(let i = 0; i < array.length; i++) {
            if(obj == array[i]) {
                return true;
            }
        }
        return false;
    }

    public static remove(array, obj): void {
        for(let i = 0; i < array.length; i++) {
            if(obj == array[i]) {
                array.splice(i, 1);
                break;
            }
        }
    }

    public static filterByKey(array, key, getKey) {
        if(!key || key.length == 0 || key === "") {
            return array;
        }
        else {
            // Loop over all elements
            let result = [];
            let elm, t1, t2;
            for(let i = 0; i < array.length; i++) {

                elm = array[i];
                // Switch to lower case and remove spaces
                // to improve search results
                let elmKey = getKey(elm);
                if (!Utils.unORNull(key) && !Utils.unORNull(elmKey)) {
                    t1 = key.toLowerCase().replace(/ /g,'');
                    t2 = elmKey.toLowerCase().replace(/ /g,'');
                    if(t2.length >= t1.length && t2.substring(0, t1.length) == t1) {
                        result.push(elm);
                    }
                }
            }
            return result;
        }
    }

    public static objectToArray(object) {
        let array = [];
        for(let key in object) {
            if(object.hasOwnProperty(key)) {
                array.push(object[key]);
            }
        }
        return array;
    }
}