import * as angular from 'angular'


import {DEBUG} from "../keys/defines";
import * as FileSaver from 'file-saver'
import {IRoomScope} from "./chat";
import {IRoom} from "../entities/room";


export interface IChatSettingsController {
    $scope: IRoomScope
    saveTranscript()
    copyTranscript()
}

class ChatSettingsController implements IChatSettingsController {

    static $inject = ['$scope'];

    public room: IRoom;
    public $scope: IRoomScope;

    constructor ($scope: IRoomScope) {
        this.$scope = $scope;
    }

    copyTranscript() {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", this.$scope.room.transcript());
    };

    saveTranscript() {

        let t = this.$scope.room.transcript();

        if(DEBUG) console.log(t);

        FileSaver.saveAs(new Blob([t], {type: "text/plain;charset=utf-8"}), this.$scope.room.name + "-transcript.txt");

    };
}

angular.module('myApp.controllers').controller('ChatSettingsController', ChatSettingsController);