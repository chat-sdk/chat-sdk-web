import * as angular from 'angular'

import {N} from "../keys/notification-keys";
import * as Defines from "../keys/defines";
import * as TabKeys from "../keys/tab-keys";
import {IRoom} from "../entities/room";
import {Dimensions} from "../keys/dimensions";
import {Utils} from "../services/utils";
import {ArrayUtils} from "../services/array-utils";
import {Log} from "../services/log";

export interface IRoomScope extends ng.IScope {
    room: IRoom
    resizing: any
    dragging: any
    startDrag: any
    wasDragged: any
    inputHeight: any
    input: any
    emojis: string[]
    autoScroll: boolean
    leaveRoom()
}

export interface MessageScope extends ng.IScope {
    message: any,
}

angular.module('myApp.controllers').controller('ChatController', ['$scope', '$timeout', '$window', '$sce', 'Config', 'Auth', 'Screen', 'RoomPositionManager', 'NetworkManager',
    function ($scope, $timeout, $window, $sce, Config, Auth, Screen, RoomPositionManager, NetworkManager) {

        $scope.showEmojis = false;
        $scope.showMessageOptions = false;

        //$scope.headerColor = $scope.config.headerColor;
        $scope.loginIframeURL = $sce.trustAsResourceUrl('http://ccwp/social.html');

        $scope.init = function (room) {

            // let room = RoomStore.getRoomWithID(rid);

            $scope.input = {};
            $scope.room = room;

            $scope.hideChat = false;

            $scope.tabClicked('messages');

            // The height of the bottom message input bar
            $scope.inputHeight = 26;

            let digest = function (callback) {
                $timeout(() => {
                    $scope.$digest();
                    if(callback) {
                        callback();
                    }
                });
            };

            // When the user value changes update the user interface
            $scope.$on(N.UserValueChanged, (event, user) => {
                Log.notification(N.UserValueChanged, 'ChatController');
                if($scope.room.containsUser(user)) {
                    digest(null);
                }
            });

            $scope.$on(N.RoomPositionUpdated, (event, room) => {
                Log.notification(N.RoomPositionUpdated, 'ChatController');
                if($scope.room == room) {
                    // Update the room's active status
                    digest(null);
                }
            });
            $scope.$on(N.RoomSizeUpdated, (event, room) => {
                Log.notification(N.RoomSizeUpdated, 'ChatController');
                if($scope.room == room) {
                    digest(null);
                }
            });
            $scope.$on(N.LazyLoadedMessages, (event, room) => {
                Log.notification(N.LazyLoadedMessages, 'ChatController');
                if($scope.room == room) {
                    digest(null);
                }
            });
            $scope.$on(N.ChatUpdated, (event, room) => {
                Log.notification(N.ChatUpdated, 'CreateRoomController');
                if($scope.room == room) {
                    digest(null);
                }
            });
        };

        $scope.enabledMessageOptions = function () {
            let list = [];
            if (Config.fileMessagesEnabled) {
                list.push('fileMessagesEnabled');
            }
            if (Config.imageMessagesEnabled) {
                list.push('imageMessagesEnabled');
            }
            return list;
        };

        $scope.enabledMessageOptionsCount = function () {
            return $scope.enabledMessageOptions().length;
        };

        $scope.onSelectImage = function (room) {
            $scope.showMessageOptions = false;
            $scope.uploadingFile = true;
            this.sendImageMessage($window.event.target.files, room)
        };

        $scope.onSelectFile = function (room) {
            $scope.showMessageOptions = false;
            $scope.uploadingFile = true;
            this.sendFileMessage($window.event.target.files, room)
        };

        $scope.imageUploadFinished = function () {
            $scope.uploadingFile = false;
            $scope.sendingImage = false;
        };

        $scope.fileUploadFinished = function () {
            $scope.uploadingFile = false;
            $scope.sendingFile = false;
        };

        $scope.sendImageMessage = function ($files, room) {

            if ($scope.sendingImage || $files.length === 0) {
                this.imageUploadFinished();
                return;
            }

            let f = $files[0];

            if (f.type == 'image/png' || f.type == 'image/jpeg') {
                $scope.sendingImage = true;
            }
            else {
                $scope.showNotification(Defines.NotificationTypeAlert, 'File error', 'Only image files can be uploaded', 'ok');
                this.imageUploadFinished();
                return;
            }

            NetworkManager.upload.uploadFile(f).then((r) => {
                let url = (typeof r === 'string' ? r : r.data && r.data.url);
                if (typeof url === 'string' && url.length > 0) {
                    let reader = new FileReader();

                    // Load the image into the canvas immediately to get the dimensions
                    reader.onload = () => {
                        return (e) => {
                            let image = new Image();
                            image.onload = () => {
                                room.sendImageMessage($scope.getUser(), url, image.width, image.height);
                            };
                            image.src = e.target.result;
                        };
                    };
                    reader.readAsDataURL(f);
                }
                this.imageUploadFinished();

            }, (error) => {
                $scope.showNotification(Defines.NotificationTypeAlert, 'Image error', 'The image could not be sent', 'ok');
                this.imageUploadFinished();
            });
        };

        $scope.sendFileMessage = function ($files, room) {

            if ($scope.sendingFile || $files.length === 0) {
                this.fileUploadFinished();
                return;
            }

            let f = $files[0];

            if (f.type == 'image/png' || f.type == 'image/jpeg') {
                this.sendImageMessage($files, room);
                return;
            }
            else {
                $scope.sendingFile = true;
            }

            NetworkManager.upload.uploadFile(f).then((r) => {
                let url = (typeof r === 'string' ? r : r.data && r.data.url)
                if (typeof url === 'string' && url.length > 0) {
                    room.sendFileMessage($scope.getUser(), f.name, f.type, url);
                }
                this.fileUploadFinished();

            }, (error) => {
                $scope.showNotification(Defines.NotificationTypeAlert, 'File error', 'The file could not be sent', 'ok');
                this.fileUploadFinished();
            });
        };

        $scope.getZIndex = function () {
            // Make sure windows further to the right have a higher index
            let z =  $scope.room.zIndex ? $scope.room.zIndex :  100 * (1 - $scope.room.offset/Screen.screenWidth);
            return parseInt(z);
        };

        $scope.sendMessage = function () {
            console.log('sendMessage()');
            let user = $scope.getUser();

            $scope.showEmojis = false;
            $scope.showMessageOptions = false;

            $scope.room.sendTextMessage(user, $scope.input.text);
            $scope.input.text = "";
        };

        $scope.loadMoreMessages = function(): Promise<any> {
            return $scope.room.loadMoreMessages();
        };

        $scope.tabClicked = function (tab) {
            $scope.activeTab = tab;
            if (tab == TabKeys.MessagesTab) {
                $scope.showEmojis = false;
                $scope.showMessageOptions = false;
            }
        };

        $scope.chatBoxStyle = function () {
            return $scope.hideChat ? 'style="0px"' : "";
        };

        $scope.toggleVisibility = function () {
            if($scope.boxWasDragged) {
                return;
            }
            $scope.setMinimized(!$scope.room.minimized);
            $scope.room.badge = null;
        };

        $scope.toggleEmoticons = function () {
            $scope.showMessageOptions = false;
            $scope.showEmojis = !$scope.showEmojis;
        };

        $scope.toggleMessageOptions = function () {
            $scope.showEmojis = false;
            $scope.showMessageOptions = !$scope.showMessageOptions;
        };

        // Save the super class
        $scope.superShowProfileBox = $scope.showProfileBox;
        $scope.showProfileBox = function (uid) {

            $scope.superShowProfileBox(uid);

            // Work out the x position
            let x = $scope.room.offset + $scope.room.width;

            let facesLeft = true;
            if ($scope.room.offset + Dimensions.ProfileBoxWidth + $scope.room.width > Screen.screenWidth) {
                facesLeft = false;
                x = $scope.room.offset - Dimensions.ProfileBoxWidth;
            }

            $scope.profileBoxStyle.right = x;
            $scope.profileBoxStyle['border-top-left-radius'] = facesLeft ? 4 : 0;
            $scope.profileBoxStyle['border-bottom-left-radius'] = facesLeft ? 4 : 0;
            $scope.profileBoxStyle['border-top-right-radius'] = facesLeft ? 0 : 4;
            $scope.profileBoxStyle['border-bottom-right-radius'] = facesLeft ? 0 : 4;
        };

        $scope.acceptInvitation = function () {
            $scope.room.acceptInvitation();
        };

        $scope.minimize = function () {
            $scope.setMinimized(true);
        };

        $scope.setMinimized = function (minimized) {
            $scope.room.minimized = minimized;
            $scope.chatBoxStyle = minimized ? {height: 0} : {};
            RoomPositionManager.setDirty();
            RoomPositionManager.updateRoomPositions($scope.room, 0);
            RoomPositionManager.updateAllRoomActiveStatus();
        };

        $scope.startDrag = function () {
            $scope.dragStarted = true;
            $scope.boxWasDragged = false;
        };

        $scope.wasDragged = function () {
            // We don't want the chat crossing the min point
            if($scope.room.offset < $scope.mainBoxWidth + Dimensions.ChatRoomSpacing) {
                $scope.room.setOffset($scope.mainBoxWidth + Dimensions.ChatRoomSpacing);
            }
            $scope.boxWasDragged = true;
        };

        $scope.getAllUsers = function () {
            if (!Utils.unORNull($scope.room)) {
                return ArrayUtils.objectToArray($scope.room.getUsers());
            } else {
                return [];
            }
        };

        $scope.searchKeyword = function () {
            return null;
        };

//    $scope.getUsers = function () {
//
//        let users = $scope.room.getUsers();
//        // Add the users to an array
//        let array = [];
//        for(let key in users) {
//            if(users.hasOwnProperty(key)) {
//                array.push(users[key]);
//            }
//        }
//        // Sort the array
//        array.sort(function (a, b) {
//            a = Utils.unORNull(a.online) ? false : a.online;
//            b = Utils.unORNull(b.online) ? false : b.online;
//
//            if(a == b) {
//                return 0;
//            }
//            else {
//                return a == true ? -1 : 1;
//            }
//        });
//
//        return array;
//    };

        $scope.setTyping = function (typing) {
            if(typing) {
                $scope.room.startTyping($scope.getUser());
            }
            else {
                $scope.room.finishTyping($scope.getUser());
            }
        };

        $scope.leaveRoom = function () {
            $scope.room.close();
            $scope.room.leave();
        }

    }]);
