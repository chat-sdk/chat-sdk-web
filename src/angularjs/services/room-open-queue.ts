import * as angular from 'angular'
/**
 * This service allows us to flag a room to be opened. This
 * is useful because when we create a new room it's turned
 * on in the impl_roomAdded function. We want to be able
 * to flag it to be opened from anywhere and then let
 * that function open it
 */

export interface IRoomOpenQueue {
    roomExistsAndPop(rid: string): boolean
    addRoomWithID(rid: string): void
}

class RoomOpenQueue implements IRoomOpenQueue {

    rids = new Array<string>();

    addRoomWithID(rid: string): void {
        if(this.rids.indexOf(rid) < 0) {
            this.rids.push(rid);
        }
    }

    roomExistsAndPop (rid: string): boolean {
        let index = this.rids.indexOf(rid);
        if(index >= 0) {
            this.rids.splice(index, 1);
            return true;
        }
        return false;
    }

}

angular.module('myApp.services').service('RoomOpenQueue', RoomOpenQueue);