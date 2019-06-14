import * as PathKeys from "../keys/path-keys";
import * as Dimensions from "../keys/dimensions";
import * as NotificationKeys from "../keys/notification-keys";
import * as RoomNameKeys from "../keys/room-name-keys";
import * as RoomKeys from "../keys/room-keys";
import * as RoomType from "../keys/room-type";
import * as UserStatus from "../keys/user-status";
import * as Keys from "../keys/keys";
import * as MessageKeys from "../keys/message-keys";
import * as MessageType from "../keys/message-type";
import * as Defines from "../services/defines";
import * as TabKeys from "../keys/tab-keys";

angular.module('myApp.controllers').controller('ChatController', ['$scope', '$timeout', '$window', '$sce', 'Config', 'Auth', 'Screen', 'RoomPositionManager', 'Log', 'Utils', 'ArrayUtils', 'NetworkManager',
    function ($scope, $timeout, $window, $sce, Config, Auth, Screen, RoomPositionManager, Log, Utils, ArrayUtils, NetworkManager) {

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

            var digest = function (callback) {
                $timeout(function () {
                    $scope.$digest();
                    if(callback) {
                        callback();
                    }
                });
            };

            // When the user value changes update the user interface
            $scope.$on(NotificationKeys.UserValueChangedNotification, function (event, user) {
                Log.notification(NotificationKeys.UserValueChangedNotification, 'ChatController');
                if($scope.room.containsUser(user)) {
                    digest(null);
                }
            });

            $scope.$on(NotificationKeys.RoomPositionUpdatedNotification, function(event, room) {
                Log.notification(NotificationKeys.RoomPositionUpdatedNotification, 'ChatController');
                if($scope.room == room) {
                    // Update the room's active status
                    digest(null);
                }
            });
            $scope.$on(NotificationKeys.RoomSizeUpdatedNotification, function(event, room) {
                Log.notification(NotificationKeys.RoomSizeUpdatedNotification, 'ChatController');
                if($scope.room == room) {
                    digest(null);
                }
            });
            $scope.$on(NotificationKeys.LazyLoadedMessagesNotification, function(event, room, callback) {
                Log.notification(NotificationKeys.LazyLoadedMessagesNotification, 'ChatController');
                if($scope.room == room) {
                    digest(callback);
                }
            });
            $scope.$on(NotificationKeys.ChatUpdatedNotification, function (event, room) {
                Log.notification(NotificationKeys.ChatUpdatedNotification, 'CreateRoomController');
                if($scope.room == room) {
                    digest(null);
                }
            });
        };

        $scope.enabledMessageOptions = function () {
            var list = [];
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

            var f = $files[0];

            if (f.type == 'image/png' || f.type == 'image/jpeg') {
                $scope.sendingImage = true;
            }
            else {
                $scope.showNotification(Defines.NotificationTypeAlert, 'File error', 'Only image files can be uploaded', 'ok');
                this.imageUploadFinished();
                return;
            }

            NetworkManager.upload.uploadFile(f).then((function (r) {
                var url = (typeof r === 'string' ? r : r.data && r.data.url)
                if (typeof url === 'string' && url.length > 0) {
                    var reader = new FileReader();

                    // Load the image into the canvas immediately to get the dimensions
                    reader.onload = (function () {
                        return function (e) {
                            var image = new Image();
                            image.onload = function () {
                                room.sendImageMessage($scope.getUser(), url, image.width, image.height);
                            };
                            image.src = e.target.result;
                        };
                    })();
                    reader.readAsDataURL(f);
                }
                this.imageUploadFinished();

            }).bind(this), (function (error) {
                $scope.showNotification(Defines.NotificationTypeAlert, 'Image error', 'The image could not be sent', 'ok');
                this.imageUploadFinished();
            }).bind(this));
        };

        $scope.sendFileMessage = function ($files, room) {

            if ($scope.sendingFile || $files.length === 0) {
                this.fileUploadFinished();
                return;
            }

            var f = $files[0];

            if (f.type == 'image/png' || f.type == 'image/jpeg') {
                this.sendImageMessage($files, room);
                return;
            }
            else {
                $scope.sendingFile = true;
            }

            NetworkManager.upload.uploadFile(f).then((function (r) {
                var url = (typeof r === 'string' ? r : r.data && r.data.url)
                if (typeof url === 'string' && url.length > 0) {
                    room.sendFileMessage($scope.getUser(), f.name, f.type, url);
                }
                this.fileUploadFinished();

            }).bind(this), (function (error) {
                $scope.showNotification(Defines.NotificationTypeAlert, 'File error', 'The file could not be sent', 'ok');
                this.fileUploadFinished();
            }).bind(this));
        };

        $scope.getZIndex = function () {
            // Make sure windows further to the right have a higher index
            var z =  $scope.room.zIndex ? $scope.room.zIndex :  100 * (1 - $scope.room.offset/Screen.screenWidth);
            return parseInt(z);
        };

        $scope.sendMessage = function () {
            console.log('sendMessage()');
            var user = $scope.getUser();

            $scope.showEmojis = false;
            $scope.showMessageOptions = false;

            $scope.room.sendTextMessage($scope.input.text, user, MessageType.MessageTypeText);
            $scope.input.text = "";
        };

        $scope.loadMoreMessages = function (callback) {
            $scope.room.loadMoreMessages(callback);
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
        }

        // Save the super class
        $scope.superShowProfileBox = $scope.showProfileBox;
        $scope.showProfileBox = function (uid) {

            $scope.superShowProfileBox(uid);

            // Work out the x position
            var x = $scope.room.offset + $scope.room.width;

            var facesLeft = true;
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
//        var users = $scope.room.getUsers();
//        // Add the users to an array
//        var array = [];
//        for(var key in users) {
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
