import * as angular from 'angular';

import { RoomType } from '../keys/room-type';
import { UserStatus } from '../keys/user-status';
import { N } from '../keys/notification-keys';
import { IRootScope } from '../interfaces/root-scope';
import { IRoomStore } from '../persistence/room-store';
import { IRoom } from '../entities/room';

export interface IChatEmbedScope extends ng.IScope {
    rooms: IRoom[];
}

export interface IChatEmbedController {
    init(rid: string, width: number, height: number): void;
}

class ChatEmbedController implements IChatEmbedController {

    static $inject = ['$scope', '$timeout', '$rootScope', 'RoomStore'];

    rid: string;
    width: number;
    height: number;

    constructor(
        private $scope: IChatEmbedScope,
        private $timeout: ng.ITimeoutService,
        private $rootScope: IRootScope,
        private RoomStore: IRoomStore,
    ) { }

    init(rid: string, width: number, height: number) {
        this.rid = rid;
        this.width = width;
        this.height = height;

        // When login is complete setup this room
        this.$scope.$on(N.LoginComplete, () => {

            const room = this.RoomStore.getOrCreateRoomWithID(this.rid);
            room.on().then(() => {

                room.width = this.width;
                room.height = this.height;

                const open = () => {

                    // Start listening to message updates
                    room.messagesOn(room.deletedTimestamp);

                    // Start listening to typing indicator updates
                    room.typingOn();

                };

                switch (room.getType()) {
                    case RoomType.Public:
                        room.join(UserStatus.Member).then(() => {
                            open();
                        }, (error) => {
                            console.error(error);
                        });
                        break;
                    case RoomType.Group:
                    case RoomType.OneToOne:
                        open();
                }

                this.$scope.rooms = [ room ];

                this.$timeout(() => {
                    this.$rootScope.$digest();
                });

            });

        });
    }

}

angular.module('myApp.controllers').controller('ChatEmbedController', ChatEmbedController);
