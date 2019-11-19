import * as angular from 'angular';

import * as TabKeys from '../keys/tab-keys';
import { N } from '../keys/notification-keys';
import { IRoom } from '../entities/room';
import { Dimensions } from '../keys/dimensions';
import { Utils } from '../services/utils';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { NotificationType } from '../keys/notification-type';
import { IUser } from '../entities/user';
import { IConfig } from '../services/config';
import { IScreen } from '../services/screen';
import { IRoomPositionManager } from '../services/room-position-manager';
import { INetworkManager } from '../network/network-manager';
import { ITab } from '../services/tab';
import { IProfileBox } from '../services/profile-box.service';

export interface IRoomScope extends ng.IScope {
  activeTab: string;
  allUsers: IUser[];
  autoScroll: boolean;
  boxWasDragged: boolean;
  disableDrag: any;
  dragging: any;
  dragStarted: boolean;
  emojis: string[];
  hideChat: boolean;
  input: any;
  inputHeight: any;
  loginIframeURL: string;
  mainBoxWidth: number;
  resizing: any;
  room: IRoom;
  sendingFile: boolean;
  sendingImage: boolean;
  showEmojis: boolean;
  showMessageOptions: boolean;
  uploadingFile: boolean;
  users: IUser[];
  acceptInvitation(): void;
  chatBoxStyle(): string;
  enabledMessageOptions(): string[];
  enabledMessageOptionsCount(): number;
  fileUploadFinished(): void;
  getAllUsers(): IUser[];
  getUser(): IUser;
  getZIndex(): number;
  imageUploadFinished(): void;
  init(): void;
  leaveRoom(): void;
  loadMoreMessages(): void;
  minimize(): void;
  onSelectFile(): void;
  onSelectImage(): void;
  searchKeyword(): string;
  sendFileMessage(): void;
  sendImageMessage(): void;
  sendMessage(): void;
  setMinimized(minimized: boolean): void;
  setTyping(): void;
  showNotification(type: NotificationType, title: string, message?: string, button?: string): void;
  startDrag(): void;
  tabClicked(tab: string): void;
  toggleEmoticons(): void;
  toggleMessageOptions(): void;
  toggleVisibility(): void;
  wasDragged(): void;
}

export interface IMessageScope extends ng.IScope {
  message: any;
}

export interface IChatController {

}

class ChatController implements IChatController {

  static $inject = ['$scope', '$timeout', '$window', '$sce', 'Config', 'Screen', 'RoomPositionManager', 'NetworkManager', 'Tab', 'ProfileBox'];

  constructor(
    private $scope: IRoomScope,
    private $timeout: ng.ITimeoutService,
    private $window: ng.IWindowService,
    private $sce: ng.ISCEService,
    private Config: IConfig,
    private Screen: IScreen,
    private RoomPositionManager: IRoomPositionManager,
    private NetworkManager: INetworkManager,
    private Tab: ITab,
    private ProfileBox: IProfileBox,
  ) {
    // $scope properties
    $scope.showEmojis = false;
    $scope.showMessageOptions = false;
    // $scope.headerColor = $scope.config.headerColor;
    $scope.loginIframeURL = this.$sce.trustAsResourceUrl('http://ccwp/social.html');

    // $scope methods
    $scope.acceptInvitation = this.acceptInvitation.bind(this);
    $scope.chatBoxStyle = this.chatBoxStyle.bind(this);
    $scope.enabledMessageOptions = this.enabledMessageOptions.bind(this);
    $scope.enabledMessageOptionsCount = this.enabledMessageOptionsCount.bind(this);
    $scope.fileUploadFinished = this.fileUploadFinished.bind(this);
    $scope.getAllUsers = this.getAllUsers.bind(this);
    $scope.getZIndex = this.getZIndex.bind(this);
    $scope.imageUploadFinished = this.imageUploadFinished.bind(this);
    $scope.init = this.init.bind(this);
    $scope.leaveRoom = this.leaveRoom.bind(this);
    $scope.loadMoreMessages = this.loadMoreMessages.bind(this);
    $scope.minimize = this.minimize.bind(this);
    $scope.onSelectFile = this.onSelectFile.bind(this);
    $scope.onSelectImage = this.onSelectImage.bind(this);
    $scope.searchKeyword = this.searchKeyword.bind(this);
    $scope.sendFileMessage = this.sendFileMessage.bind(this);
    $scope.sendImageMessage = this.sendImageMessage.bind(this);
    $scope.sendMessage = this.sendMessage.bind(this);
    $scope.setMinimized = this.setMinimized.bind(this);
    $scope.setTyping = this.setTyping.bind(this);
    $scope.startDrag = this.startDrag.bind(this);
    $scope.tabClicked = this.tabClicked.bind(this);
    $scope.toggleEmoticons = this.toggleEmoticons.bind(this);
    $scope.toggleMessageOptions = this.toggleMessageOptions.bind(this);
    $scope.toggleVisibility = this.toggleVisibility.bind(this);
    $scope.wasDragged = this.wasDragged.bind(this);

    Tab.activeTabForRoomObservable($scope.room.getRID()).subscribe(tab => {
      $scope.activeTab = tab;
    });
  }

  init(room: IRoom) {
    // let room = thhis.RoomStore.getRoomWithID(rid);

    const scope = this.$scope;

    scope.input = {};
    scope.room = room;

    scope.hideChat = false;

    scope.tabClicked('messages');

    // The height of the bottom message input bar
    scope.inputHeight = 26;

    const digest = (callback: () => void) => {
      this.$timeout.bind(this)(() => {
        scope.$digest();
        if (callback) {
          callback();
        }
      });
    };

    // When the user value changes update the user interface
    scope.$on(N.UserValueChanged, (event, user: IUser) => {
      Log.notification(N.UserValueChanged, 'ChatController');
      if (scope.room.containsUser(user)) {
        digest(null);
      }
    });

    scope.$on(N.RoomPositionUpdated, (event, room: IRoom) => {
      Log.notification(N.RoomPositionUpdated, 'ChatController');
      if (scope.room === room) {
        // Update the room's active status
        digest(null);
      }
    });

    scope.$on(N.RoomSizeUpdated, (event, room: IRoom) => {
      Log.notification(N.RoomSizeUpdated, 'ChatController');
      if (scope.room === room) {
        digest(null);
      }
    });

    scope.$on(N.LazyLoadedMessages, (event, room: IRoom) => {
      Log.notification(N.LazyLoadedMessages, 'ChatController');
      if (scope.room === room) {
        digest(null);
      }
    });

    scope.$on(N.ChatUpdated, (event, room: IRoom) => {
      Log.notification(N.ChatUpdated, 'CreateRoomController');
      if (scope.room === room) {
        digest(null);
      }
    });
  }

  enabledMessageOptions(): string[] {
    const list = [];
    if (this.Config.fileMessagesEnabled) {
      list.push('fileMessagesEnabled');
    }
    if (this.Config.imageMessagesEnabled) {
      list.push('imageMessagesEnabled');
    }
    return list;
  }

  enabledMessageOptionsCount(): number {
    return this.$scope.enabledMessageOptions().length;
  }

  onSelectImage(room: IRoom) {
    this.$scope.showMessageOptions = false;
    this.$scope.uploadingFile = true;
    this.sendImageMessage((this.$window.event.target as any).files, room);
  }

  onSelectFile(room: IRoom) {
    this.$scope.showMessageOptions = false;
    this.$scope.uploadingFile = true;
    this.sendFileMessage((this.$window.event.target as any).files, room);
  }

  imageUploadFinished() {
    this.$scope.uploadingFile = false;
    this.$scope.sendingImage = false;
  }

  fileUploadFinished() {
    this.$scope.uploadingFile = false;
    this.$scope.sendingFile = false;
  }

  sendImageMessage($files, room: IRoom) {

    if (this.$scope.sendingImage || $files.length === 0) {
      this.imageUploadFinished();
      return;
    }

    const f = $files[0];

    if (f.type === 'image/png' || f.type === 'image/jpeg') {
      this.$scope.sendingImage = true;
    }
    else {
      this.$scope.showNotification(NotificationType.Alert, 'File error', 'Only image files can be uploaded', 'ok');
      this.imageUploadFinished();
      return;
    }

    this.NetworkManager.upload.uploadFile(f).then((r: any) => {
      const url = (typeof r === 'string' ? r : r.data && r.data.url);
      if (typeof url === 'string' && url.length > 0) {
        const reader = new FileReader();

        // Load the image into the canvas immediately to get the dimensions
        reader.onload = () => {
          return (e) => {
            const image = new Image();
            image.onload = () => {
              room.sendImageMessage(this.$scope.getUser(), url, image.width, image.height);
            };
            image.src = e.target.result;
          };
        };
        reader.readAsDataURL(f);
      }
      this.imageUploadFinished();

    }, (error) => {
      this.$scope.showNotification(NotificationType.Alert, 'Image error', 'The image could not be sent', 'ok');
      this.imageUploadFinished();
    });
  }

  sendFileMessage($files, room: IRoom) {

    if (this.$scope.sendingFile || $files.length === 0) {
      this.fileUploadFinished();
      return;
    }

    const f = $files[0];

    if (f.type === 'image/png' || f.type === 'image/jpeg') {
      this.sendImageMessage($files, room);
      return;
    }
    else {
      this.$scope.sendingFile = true;
    }

    this.NetworkManager.upload.uploadFile(f).then((r: any) => {
      const url = (typeof r === 'string' ? r : r.data && r.data.url);
      if (typeof url === 'string' && url.length > 0) {
        room.sendFileMessage(this.$scope.getUser(), f.name, f.type, url);
      }
      this.fileUploadFinished();
    }, (error) => {
      this.$scope.showNotification(NotificationType.Alert, 'File error', 'The file could not be sent', 'ok');
      this.fileUploadFinished();
    });
  }

  getZIndex() {
    // Make sure windows further to the right have a higher index
    const z = this.$scope.room.zIndex ? this.$scope.room.zIndex : 100 * (1 - this.$scope.room.offset / this.Screen.screenWidth);
    return Math.floor(z);
  }

  sendMessage() {
    console.log('sendMessage()');
    const user = this.$scope.getUser();

    this.$scope.showEmojis = false;
    this.$scope.showMessageOptions = false;

    this.$scope.room.sendTextMessage(user, this.$scope.input.text);
    this.$scope.input.text = '';
  }

  loadMoreMessages(): Promise<any> {
    return this.$scope.room.loadMoreMessages();
  }

  tabClicked(tab: string) {
    this.Tab.setActiveTabForRoom(this.$scope.room.getRID(), tab);
    if (tab === TabKeys.MessagesTab) {
      this.$scope.showEmojis = false;
      this.$scope.showMessageOptions = false;
    }
  }

  chatBoxStyle(): string {
    return this.$scope.hideChat ? 'style="0px"' : '';
  }

  toggleVisibility() {
    if (this.$scope.boxWasDragged) {
      return;
    }
    this.$scope.setMinimized(!this.$scope.room.minimized);
    this.$scope.room.badge = null;
  }

  toggleEmoticons() {
    this.$scope.showMessageOptions = false;
    this.$scope.showEmojis = !this.$scope.showEmojis;
  }

  toggleMessageOptions() {
    this.$scope.showEmojis = false;
    this.$scope.showMessageOptions = !this.$scope.showMessageOptions;
  }

  showProfileBox(uid: string) {

    this.ProfileBox.show(uid);

    // Work out the x position
    let x = this.$scope.room.offset + this.$scope.room.width;

    let facesLeft = true;
    if (this.$scope.room.offset + Dimensions.ProfileBoxWidth + this.$scope.room.width > this.Screen.screenWidth) {
      facesLeft = false;
      x = this.$scope.room.offset - Dimensions.ProfileBoxWidth;
    }

    this.ProfileBox.style.right = x + 'px';
    this.ProfileBox.style['border-top-left-radius'] = facesLeft ? 4 : 0;
    this.ProfileBox.style['border-bottom-left-radius'] = facesLeft ? 4 : 0;
    this.ProfileBox.style['border-top-right-radius'] = facesLeft ? 0 : 4;
    this.ProfileBox.style['border-bottom-right-radius'] = facesLeft ? 0 : 4;
  }

  acceptInvitation() {
    // this.$scope.room.acceptInvitation();
    console.error(new Error('IRoom.acceptInvitation() is not implemented yet'));
  }

  minimize() {
    this.$scope.setMinimized(true);
  }

  setMinimized(minimized: boolean) {
    this.$scope.room.minimized = minimized;
    this.$scope.chatBoxStyle = (minimized ? { height: 0 } : {}) as () => string; // FIX THIS
    this.RoomPositionManager.setDirty();
    this.RoomPositionManager.updateRoomPositions(this.$scope.room, 0);
    this.RoomPositionManager.updateAllRoomActiveStatus();
  }

  startDrag() {
    this.$scope.dragStarted = true;
    this.$scope.boxWasDragged = false;
  }

  wasDragged() {
    // We don't want the chat crossing the min point
    if (this.$scope.room.offset < this.$scope.mainBoxWidth + Dimensions.ChatRoomSpacing) {
      this.$scope.room.setOffset(this.$scope.mainBoxWidth + Dimensions.ChatRoomSpacing);
    }
    this.$scope.boxWasDragged = true;
  }

  getAllUsers(): IUser[] {
    if (!Utils.unORNull(this.$scope.room)) {
      return ArrayUtils.objectToArray(this.$scope.room.getUsers());
    }
    else {
      return [];
    }
  }

  searchKeyword(): string {
    return null;
  }

  // getUsers() {
  //   const users = this.$scope.room.getUsers();
  //   // Add the users to an array
  //   const array = [];
  //   for (let key in users) {
  //       if (users.hasOwnProperty(key)) {
  //           array.push(users[key]);
  //       }
  //   }
  //   // Sort the array
  //   array.sort((a, b) => {
  //     a = Utils.unORNull(a.online) ? false : a.online;
  //     b = Utils.unORNull(b.online) ? false : b.online;

  //     if (a == b) {
  //       return 0;
  //     }
  //     else {
  //       return a == true ? -1 : 1;
  //     }
  //   });

  //   return array;
  // }

  setTyping(typing: boolean) {
    if (typing) {
      this.$scope.room.startTyping(this.$scope.getUser());
    }
    else {
      this.$scope.room.finishTyping(this.$scope.getUser());
    }
  }

  leaveRoom() {
    this.$scope.room.close();
    this.$scope.room.leave();
  }

}

angular.module('myApp.controllers').controller('ChatController', ChatController);
