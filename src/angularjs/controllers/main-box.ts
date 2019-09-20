import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { FriendsTab, InboxTab, RoomsTab, UsersTab } from '../keys/tab-keys';
import { Dimensions } from '../keys/dimensions';
import { ArrayUtils } from '../services/array-utils';
import { Log } from '../services/log';
import { NotificationType } from '../keys/notification-type';
import { IAuth } from '../network/auth';
import { IFriendsConnector } from '../connectors/friend-connector';
import { IConfig } from '../services/config';
import { IScreen } from '../services/screen';
import { IRoomPositionManager } from '../services/room-position-manager';
import { IRoomStore } from '../persistence/room-store';
import { IRoom } from '../entities/room';
import { IUser } from '../entities/user';
import { IMessage } from '../entities/message';

export interface MainBoxScope extends ng.IScope {
  activeTab: string;
  boxWidth: number;
  canCloseRoom: boolean;
  config: IConfig;
  friendsTabEnabled: boolean;
  inboxCount: number;
  mainBoxHeight: number;
  mainBoxWidth: number;
  notification: any;
  roomsTabEnabled: boolean;
  search: { [key: string]: string };
  tabCount: number;
  title: string;
  type: string;
  usersTabEnabled: boolean;
  getAllUsers(): IUser[];
  numberOfTabs(): number;
  profileBoxDisabled(): boolean;
  roomClicked(room: IRoom): boolean;
  searchKeyword(): string;
  showOverlay(message: IMessage): void;
  tabClicked(tab: string): void;
  updateConfig(): void;
  updateInboxCount(): void;
  updateMainBoxSize(): void;
}

export interface IMainBoxController {

}

class MainBoxController implements IMainBoxController {

  static $inject = ['$scope', '$timeout', 'Auth', 'FriendsConnector', 'Config', 'Screen', 'RoomPositionManager', 'RoomStore'];

  constructor(
    private $scope: MainBoxScope,
    private $timeout: ng.ITimeoutService,
    private Auth: IAuth,
    private FriendsConnector: IFriendsConnector,
    private Config: IConfig,
    private Screen: IScreen,
    private RoomPositionManager: IRoomPositionManager,
    private RoomStore: IRoomStore,
  ) {
    // $scope propeties
    $scope.friendsTabEnabled = true;
    $scope.inboxCount = 0;
    $scope.roomsTabEnabled = true;
    $scope.tabCount = 0;
    $scope.usersTabEnabled = true;
    $scope.config = Config;

    // $scope methods
    $scope.getAllUsers = this.getAllUsers.bind(this);
    $scope.numberOfTabs = this.numberOfTabs.bind(this);
    $scope.profileBoxDisabled = this.profileBoxDisabled.bind(this);
    $scope.roomClicked = this.roomClicked.bind(this);
    $scope.searchKeyword = this.searchKeyword.bind(this);
    $scope.showOverlay = this.showOverlay.bind(this);
    $scope.tabClicked = this.tabClicked.bind(this);
    $scope.updateConfig = this.updateConfig.bind(this);
    $scope.updateInboxCount = this.updateInboxCount.bind(this);
    $scope.updateMainBoxSize = this.updateMainBoxSize.bind(this);

    // Work out how many tabs there are
    $scope.$on(N.ConfigUpdated , () => {
      this.updateConfig.bind(this)();
    });
    $scope.updateConfig();

    // Setup the search variable - if we don't do this
    // Angular can't set search.text
    $scope.search = {};
    $scope.search[UsersTab] = '';
    $scope.search[RoomsTab] = '';
    $scope.search[FriendsTab] = '';

    // This is used by sub views for their layouts
    $scope.boxWidth = Dimensions.MainBoxWidth;

    // We don't want people deleting rooms from this view
    $scope.canCloseRoom = false;

    // When the user value changes update the user interface
    $scope.$on(N.UserValueChanged , () =>{
      Log.notification(N.UserValueChanged, 'MainBoxController');
      $timeout(() => {
        $scope.$digest();
      });
    });

    this.updateMainBoxSize();
    $scope.$on(N.ScreenSizeChanged, () =>{
      Log.notification(N.ScreenSizeChanged, 'MainBoxController');
      this.updateMainBoxSize.bind(this)();
    });

    $scope.$on(N.RoomBadgeChanged, () =>{
      Log.notification(N.RoomBadgeChanged, 'MainBoxController');
      this.updateInboxCount.bind(this)();
    });

    $scope.$on(N.LoginComplete, () => {
      Log.notification(N.RoomRemoved, 'InboxRoomsListController');
      this.updateInboxCount.bind(this)();
    });
  }

  updateConfig() {
    this.$scope.usersTabEnabled = this.Config.onlineUsersEnabled;
    this.$scope.roomsTabEnabled = this.Config.publicRoomsEnabled;
    this.$scope.friendsTabEnabled = this.Config.friendsEnabled;

    this.$scope.tabCount = this.$scope.numberOfTabs();

    // Make the users tab start clicked
    if (this.Config.onlineUsersEnabled) {
      this.$scope.tabClicked(UsersTab);
    }
    else if (this.Config.publicRoomsEnabled) {
      this.$scope.tabClicked(RoomsTab);
    }
    else {
      this.$scope.tabClicked(InboxTab);
    }

    this.$timeout(() => {
      this.$scope.$digest();
    })
  }

  numberOfTabs(): number {
    let tabs = 1;
    if (this.Config.onlineUsersEnabled) {
      tabs++;
    }
    if (this.Config.publicRoomsEnabled) {
      tabs++;
    }
    if (this.Config.friendsEnabled) {
      tabs++;
    }
    return tabs;
  }

  updateInboxCount() {
    this.$scope.inboxCount = this.RoomStore.inboxBadgeCount();
    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

  updateMainBoxSize() {
    this.$scope.mainBoxHeight = Math.max(this.Screen.screenHeight * 0.5, Dimensions.MainBoxHeight);
    this.$scope.mainBoxWidth = Dimensions.MainBoxWidth;
    // console.log('MainBoxHeight:  ' + this.$scope.mainBoxHeight);
    this.$timeout(() => {
      this.$scope.$digest();
    });
  }

  profileBoxDisabled(): boolean {
    return this.Config.disableProfileBox;
  }

  showOverlay(message: IMessage) {
    this.$scope.notification.show = true;
    this.$scope.type = NotificationType.Waiting;
    this.$scope.notification.message = message;
  }

  tabClicked(tab: string) {
    this.$scope.activeTab = tab;

    // Save current search text
    // this.$scope.search

    if (tab == UsersTab) {
      this.$scope.title = 'Who\'s online';
    }
    if (tab == RoomsTab) {
      this.$scope.title = 'Chat rooms';
    }
    if (tab == FriendsTab) {
      this.$scope.title = 'My friends';
    }
    if (tab == InboxTab) {
      this.$scope.title = 'Inbox';
    }
  }

  /**
   * Return a list of friends filtered by the search box
   * @return A list of users who's names meet the search text
   */
  getAllUsers(): IUser[] {
    return ArrayUtils.objectToArray(this.FriendsConnector.friends);
  }

  searchKeyword(): string {
    return this.$scope.search[this.$scope.activeTab];
  }

  roomClicked(room: IRoom) {

    // Trim the messages array in case it gets too long
    // we only need to store the last 200 messages!
    room.trimMessageList();

    // Messages on is called by when we add the room to the user
    // If the room is already open do nothing!
    if (room.flashHeader()) {
      return;
    }

    room.open(0);
  }

}

angular.module('myApp.controllers').controller('MainBoxController', MainBoxController);
