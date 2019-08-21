import * as angular from 'angular'
import {N} from "../keys/notification-keys";
import {IPaths} from "../network/paths";
import {IRoomStore} from "../persistence/room-store";

export interface IPublicRoomsConnector {
    off(): void
    on(): void
}

class PublicRoomsConnector implements IPublicRoomsConnector{

    static $inject = ['$rootScope', 'RoomStore', 'Paths'];

    $rootScope;
    Paths: IPaths;
    RoomStore: IRoomStore;

    constructor ($rootScope, RoomStore, Paths) {
        this.$rootScope = $rootScope;
        this.Paths = Paths;
        this.RoomStore = RoomStore;
    }

    on(): void {
        const publicRoomsRef = this.Paths.publicRoomsRef();

        // Start listening to Firebase
        publicRoomsRef.on('child_added', (snapshot) => {

            const rid = snapshot.key;
            if(rid) {
                const room = this.RoomStore.getOrCreateRoomWithID(rid);

                room.on().then(() => {
                    this.$rootScope.$broadcast(N.PublicRoomAdded, room);
                });
            }

        });

        publicRoomsRef.on('child_removed', (snapshot) => {

            const room = this.RoomStore.getOrCreateRoomWithID(snapshot.key);
            this.$rootScope.$broadcast(N.PublicRoomRemoved, room);
        });
    }

    off(): void {
        const publicRoomsRef = this.Paths.publicRoomsRef();

        publicRoomsRef.off('child_added');
        publicRoomsRef.off('child_removed');
    }
}

angular.module('myApp.services').service('PublicRoomsConnector', PublicRoomsConnector);