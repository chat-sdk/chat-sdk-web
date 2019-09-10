import * as angular from 'angular'


import {ShowCreateChatBox} from "../keys/defines";
import {RoomType} from "../keys/room-type";
import {IRoomCreator} from "../entities/room";
import {IRoomOpenQueue} from "../services/room-open-queue";
import {Log} from "../services/log";

class CreateRoomController {
    static $inject = ['$scope', 'RoomCreator', 'RoomOpenQueue'];

    constructor (
        private $scope,
        private RoomCreator: IRoomCreator,
        private RoomOpenQueue: IRoomOpenQueue,
    ){
        this.clearForm();

        $scope.$on(ShowCreateChatBox , () =>{
            Log.notification(ShowCreateChatBox, 'CreateRoomController');
            $scope.focusName = true;
        });
    }

    createRoom() {

        let promise;

        // Is this a public room?
        if(this.$scope.public) {
            promise = this.RoomCreator.createPublicRoom(
                this.$scope.room.name,
                this.$scope.room.description
            );
        }
        else {
            promise = this.RoomCreator.createRoom(
                this.$scope.room.name,
                this.$scope.room.description,
                this.$scope.room.invitesEnabled,
                RoomType.OneToOne
            );
        }

        promise.then((room) => {
            this.RoomOpenQueue.addRoomWithID(room.getRID());
            room.open(0)
        });

        this.back();
    };

    back() {
        this.clearForm();
        this.$scope.showMainBox();
    };

    clearForm() {
        this.$scope.room = {
            invitesEnabled: false,
            name: null,
            description: null
        };
    };
}

angular.module('myApp.controllers').controller('CreateRoomController', CreateRoomController);
