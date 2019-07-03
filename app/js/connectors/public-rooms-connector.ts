import * as angular from 'angular'
import {PublicRoomAddedNotification, PublicRoomRemovedNotification} from "../keys/notification-keys";
import {IPaths} from "../network/paths";
import {IRoomStore} from "../persistence/room-store";

interface IPublicRoomsConnector {

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

    on() {
        const publicRoomsRef = this.Paths.publicRoomsRef();

        // Start listening to Firebase
        publicRoomsRef.on('child_added', (snapshot) => {

            const rid = snapshot.key;
            if(rid) {
                const room = this.RoomStore.getOrCreateRoomWithID(rid);

                room.on().then(() => {
                    this.$rootScope.$broadcast(PublicRoomAddedNotification, room);
                });
            }

        });

        publicRoomsRef.on('child_removed', (snapshot) => {

            const room = this.RoomStore.getOrCreateRoomWithID(snapshot.key);
            this.$rootScope.$broadcast(PublicRoomRemovedNotification, room);
        });
    }

    off() {
        const publicRoomsRef = this.Paths.publicRoomsRef();

        publicRoomsRef.off('child_added');
        publicRoomsRef.off('child_removed');
    }
}

angular.module('myApp.services').service('PublicRoomsConnector', PublicRoomsConnector);