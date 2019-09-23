import * as angular from 'angular';

import * as RoomType from '../keys/room-type';
import * as Defines from '../keys/defines';
import { N } from '../keys/notification-keys';
import { Dimensions } from '../keys/dimensions';
import { MessageType } from '../keys/message-type';
import { IUser } from '../entities/user';
import { Utils } from '../services/utils';
import { IRoom, IRoomCreator } from '../entities/room';
import { Log } from '../services/log';
import { NotificationType } from '../keys/notification-type';
import { IRootScope } from '../interfaces/root-scope';
import { IPathAnalyser } from '../services/path-analyser';
import { IOnlineConnector } from '../connectors/online-connector';
import { IFriendsConnector } from '../connectors/friend-connector';
import { ICache } from '../persistence/cache';
import { IUserStore } from '../persistence/user-store';
import { IRoomStore } from '../persistence/room-store';
import { IPresence } from '../network/presence';
import { ILocalStorage } from '../persistence/local-storage';
import { IConfig } from '../services/config';
import { IPartials } from '../services/partials';
import { IRoomPositionManager } from '../services/room-position-manager';
import { IPaths } from '../network/paths';
import { IAuth } from '../network/auth';
import { IStateManager } from '../services/state-manager';
import { IRoomOpenQueue } from '../services/room-open-queue';
import { INetworkManager } from '../network/network-manager';
import { IEnvironment } from '../services/environment';
import { LoginMode } from '../keys/login-mode-keys';
import { IStringAnyObject } from '../interfaces/string-any-object';

export interface IMainAppScope extends ng.IScope {
  activeBox: string;
  currentUser: IUser;
  currentUserHTML: string;
  email: string;
  errorBoxMessage: string;
  friendsEnabled: boolean;
  hidden: boolean;
  img_30_shutdown_on: string;
  img_30_shutdown: string;
  mainBoxMinimized: boolean;
  notification: any;
  on: boolean;
  password: string;
  profileBoxStyle: IStringAnyObject;
  profileHideTimeoutPromise: ng.IPromise<void>;
  totalUserCount: number;
  uploadingFile: boolean;
  uploadProgress: number;
  addRemoveFriend(): void;
  blockUnblockUser(): IUser;
  buttonClassForUser(): string;
  cancelTimer(): void;
  getUser(): IUser;
  hideNotification(): void;
  imgForFileType(): string;
  isBlocked(user: IUser): boolean;
  isFriend(user: IUser): boolean;
  isOnline(user: IUser): boolean;
  logout(): void;
  minimizeMainBox(): void;
  onFileSelect($files: any[]): void;
  setMainBoxMinimized(minimized: boolean): void;
  setupFileIcons(): void;
  setupImages(): void;
  showCreateRoomBox(): void;
  showErrorBox(message: string): void;
  showLoginBox(mode?: LoginMode): void;
  showMainBox(): void;
  showNotification(type: NotificationType, title: string, message?: string, button?: string): void;
  showProfileBox(uid: string, duration: number): void;
  showProfileSettingsBox(): void;
  shutdown($event: any): void;
  shutdownImage(): string;
  toggleMainBoxVisibility(): void;
  updateTotalUserCount(): number;
  userClicked(user: IUser): void;
}

export interface IMainAppController {

}

class MainAppController implements IMainAppController {

  static $inject = ['$rootScope', '$scope','$timeout', '$window', '$sce', 'PathAnalyser', 'OnlineConnector', 'FriendsConnector', 'Cache', 'UserStore', 'RoomStore','$document', 'Presence', 'LocalStorage', 'RoomCreator', 'Config', 'Partials', 'RoomPositionManager', 'Paths', 'Auth', 'StateManager', 'RoomOpenQueue', 'NetworkManager', 'Environment'];

  constructor(
    private $rootScope: IRootScope,
    private $scope: IMainAppScope,
    private $timeout: ng.ITimeoutService,
    private $window: ng.IWindowService,
    private $sce: ng.ISCEService,
    private PathAnalyser: IPathAnalyser,
    private OnlineConnector: IOnlineConnector,
    private FriendsConnector: IFriendsConnector,
    private Cache: ICache,
    private UserStore: IUserStore,
    private RoomStore: IRoomStore,
    private $document: ng.IDocumentService,
    private Presence: IPresence,
    private LocalStorage: ILocalStorage,
    private RoomCreator: IRoomCreator,
    private Config: IConfig,
    private Partials: IPartials,
    private RoomPositionManager: IRoomPositionManager,
    private Paths: IPaths,
    private Auth: IAuth,
    private StateManager: IStateManager,
    private RoomOpenQueue: IRoomOpenQueue,
    private NetworkManager: INetworkManager,
    private Environment: IEnvironment,
  ) {
    // $scope properties
    $scope.totalUserCount = 0;
    $scope.friendsEnabled = true;
    $scope.hidden = Environment.config().hideMainBox; // Used to hide chat box

    // $scope methods
    $scope.addRemoveFriend = this.addRemoveFriend.bind(this);
    $scope.blockUnblockUser = this.blockUnblockUser.bind(this);
    $scope.buttonClassForUser = this.buttonClassForUser.bind(this);
    $scope.cancelTimer = this.cancelTimer.bind(this);
    $scope.getUser = this.getUser.bind(this);
    $scope.hideNotification = this.hideNotification.bind(this);
    $scope.imgForFileType = this.imgForFileType.bind(this);
    $scope.isBlocked = this.isBlocked.bind(this);
    $scope.isFriend = this.isFriend.bind(this);
    $scope.isOnline = this.isOnline.bind(this);
    $scope.logout = this.logout.bind(this);
    $scope.minimizeMainBox = this.minimizeMainBox.bind(this);
    $scope.onFileSelect = this.onFileSelect.bind(this);
    $scope.setMainBoxMinimized = this.setMainBoxMinimized.bind(this);
    $scope.setupFileIcons = this.setupFileIcons.bind(this);
    $scope.setupImages = this.setupImages.bind(this);
    $scope.showCreateRoomBox = this.showCreateRoomBox.bind(this);
    $scope.showErrorBox = this.showErrorBox.bind(this);
    $scope.showLoginBox = this.showLoginBox.bind(this);
    $scope.showMainBox = this.showMainBox.bind(this);
    $scope.showNotification = this.showNotification.bind(this);
    $scope.showProfileBox = this.showProfileBox.bind(this);
    $scope.showProfileSettingsBox = this.showProfileSettingsBox.bind(this);
    $scope.shutdown = this.shutdown.bind(this);
    $scope.shutdownImage = this.shutdownImage.bind(this);
    $scope.toggleMainBoxVisibility = this.toggleMainBoxVisibility.bind(this);
    $scope.updateTotalUserCount = this.updateTotalUserCount.bind(this);
    $scope.userClicked = this.userClicked.bind(this);

    $rootScope.messageTypeText = MessageType.Text;
    $rootScope.messageTypeImage = MessageType.Image;
    $rootScope.messageTypeFile = MessageType.File;

    console.log('Start controller!');

    // Check to see if the user wants the chat to
    // load on this page. We look at the showOnPaths variable
    // in the options
    //CC_OPTIONS.showOnPaths = '*ccwp, *p*';
    if (Environment.showOnPaths()) {
      const paths = Environment.showOnPaths();
      if (!PathAnalyser.shouldShowChatOnPath(paths)) {
        return;
      }
    }

    Paths.setCID(Environment.rootPath());

    // Start the config listener to get the current
    // settings from Firebase
    Config.startConfigListener().then(() => {

    });

    Partials.load();

    //API.getOnlineUserCount().then(function (count) {
    //    $scope.totalUserCount = count;
    //});

    // Show the waiting overlay
    $scope.notification = {
      show: false
    };

    if (LocalStorage.isOffline()) {
      $scope.on = false;
      Presence.goOffline();
    }
    else {
      $scope.on = true;
    }

    $rootScope.websiteName = $window.location.host;

    // Single Sign on

    const loginURL = Config.loginURL;
    if (loginURL && loginURL.length > 0) {
      $rootScope.loginURL = loginURL;
    }

    const registerURL = Config.registerURL;
    if (registerURL && registerURL.length > 0) {
      $rootScope.registerURL = registerURL;
    }

    // Anonymous login and social login

    this.setupImages();
    this.setupFileIcons();

    this.setMainBoxMinimized(LocalStorage.getProperty(LocalStorage.mainMinimizedKey));

    $scope.$on(N.UserOnlineStateChanged, () => {
      Log.notification(N.UserOnlineStateChanged, 'MainAppController');
      this.updateTotalUserCount();
      $timeout(() => {
        $scope.$digest();
      });
    });
  }

  /**
   * The images in the partials should be pointed at the correct
   * server
   */
  setupImages() {
    this.$rootScope.img_30_minimize = this.Environment.imagesURL() + 'cc-30-minimize.png';
    this.$rootScope.img_30_resize = this.Environment.imagesURL() + 'cc-30-resize.png';
    this.$rootScope.img_20_cross = this.Environment.imagesURL() + 'cc-20-cross.png';
    this.$rootScope.img_30_cross = this.Environment.imagesURL() + 'cc-30-cross.png';
    this.$rootScope.img_40_cross = this.Environment.imagesURL() + 'cc-40-cross.png';
    this.$rootScope.img_40_tick = this.Environment.imagesURL() + 'cc-40-tick.png';
    this.$rootScope.img_30_shutdown = this.Environment.imagesURL() + 'cc-30-shutdown_on.png';
    this.$rootScope.img_30_shutdown_on = this.Environment.imagesURL() + 'cc-30-shutdown.png';
    this.$rootScope.img_30_plus = this.Environment.imagesURL() + 'cc-30-plus.png';
    this.$rootScope.img_30_profile_pic = this.Environment.imagesURL() + 'cc-30-profile-pic.png';
    this.$rootScope.img_30_gear = this.Environment.imagesURL() + 'cc-30-gear.png';
    this.$rootScope.img_loader = this.Environment.imagesURL() + 'loader.gif';
    this.$rootScope.img_20_user = this.Environment.imagesURL() + 'cc-20-user.png';
    this.$rootScope.img_20_friend = this.Environment.imagesURL() + 'cc-20-friend.png';
    this.$rootScope.img_30_logout = this.Environment.imagesURL() + 'cc-30-logout.png';
    this.$rootScope.img_30_emojis = this.Environment.imagesURL() + 'cc-30-emojis.png';
    this.$rootScope.img_30_maximize = this.Environment.imagesURL() + 'cc-30-maximize.png';
    this.$rootScope.img_30_sound_on = this.Environment.imagesURL() + 'cc-30-sound-on.png';
    this.$rootScope.img_30_sound_off = this.Environment.imagesURL() + 'cc-30-sound-off.png';
    this.$rootScope.img_30_clear_cache = this.Environment.imagesURL() + 'cc-30-clear-cache.png';
    this.$rootScope.img_30_cache_cleared = this.Environment.imagesURL() + 'cc-30-cache-cleared.png';
    this.$rootScope.img_24_save = this.Environment.imagesURL() + 'cc-24-save.png';
    this.$rootScope.img_30_save = this.Environment.imagesURL() + 'cc-30-save.png';
    this.$rootScope.img_24_copy = this.Environment.imagesURL() + 'cc-24-copy.png';
    this.$rootScope.img_24_cross = this.Environment.imagesURL() + 'cc-24-cross.png';
    this.$rootScope.img_30_image = this.Environment.imagesURL() + 'cc-30-image.png';
    this.$rootScope.img_20_flag = this.Environment.imagesURL() + 'cc-20-flag.png';
    this.$rootScope.img_20_flagged = this.Environment.imagesURL() + 'cc-20-flagged.png';
    this.$rootScope.img_30_powered_by = this.Environment.imagesURL() + 'cc-30-powered-by.png';
    this.$rootScope.img_30_start_chatting = this.Environment.imagesURL() + 'cc-30-start-chatting.png';
    this.$rootScope.img_25_drag = this.Environment.imagesURL() + 'cc-25-drag.png';
  }

  setupFileIcons() {
    this.$rootScope.img_file = this.Environment.imagesURL() + 'file.png';
    this.$rootScope.img_file_download = this.Environment.imagesURL() + 'file-download.png';
    this.$rootScope.img_file_aac = this.Environment.imagesURL() + 'file-type-aac.png';
    this.$rootScope.img_file_acc = this.Environment.imagesURL() + 'file-type-acc.png';
    this.$rootScope.img_file_ai = this.Environment.imagesURL() + 'file-type-ai.png';
    this.$rootScope.img_file_avi = this.Environment.imagesURL() + 'file-type-avi.png';
    this.$rootScope.img_file_bmp = this.Environment.imagesURL() + 'file-type-bmp.png';
    this.$rootScope.img_file_f4a = this.Environment.imagesURL() + 'file-type-f4a.png';
    this.$rootScope.img_file_gif = this.Environment.imagesURL() + 'file-type-gif.png';
    this.$rootScope.img_file_html = this.Environment.imagesURL() + 'file-type-html.png';
    this.$rootScope.img_file_jpeg = this.Environment.imagesURL() + 'file-type-jpeg.png';
    this.$rootScope.img_file_jpg = this.Environment.imagesURL() + 'file-type-jpg.png';
    this.$rootScope.img_file_jpp = this.Environment.imagesURL() + 'file-type-jpp.png';
    this.$rootScope.img_file_json = this.Environment.imagesURL() + 'file-type-json.png';
    this.$rootScope.img_file_m4a = this.Environment.imagesURL() + 'file-type-m4a.png';
    this.$rootScope.img_file_midi = this.Environment.imagesURL() + 'file-type-midi.png';
    this.$rootScope.img_file_mov = this.Environment.imagesURL() + 'file-type-mov.png';
    this.$rootScope.img_file_mp3 = this.Environment.imagesURL() + 'file-type-mp3.png';
    this.$rootScope.img_file_mp4 = this.Environment.imagesURL() + 'file-type-mp4.png';
    this.$rootScope.img_file_oga = this.Environment.imagesURL() + 'file-type-oga.png';
    this.$rootScope.img_file_ogg = this.Environment.imagesURL() + 'file-type-ogg.png';
    this.$rootScope.img_file_pdf = this.Environment.imagesURL() + 'file-type-pdf.png';
    this.$rootScope.img_file_psd = this.Environment.imagesURL() + 'file-type-psd.png';
    this.$rootScope.img_file_rtf = this.Environment.imagesURL() + 'file-type-rtf.png';
    this.$rootScope.img_file_svg = this.Environment.imagesURL() + 'file-type-svg.png';
    this.$rootScope.img_file_tif = this.Environment.imagesURL() + 'file-type-tif.png';
    this.$rootScope.img_file_tiff = this.Environment.imagesURL() + 'file-type-tiff.png';
    this.$rootScope.img_file_txt = this.Environment.imagesURL() + 'file-type-txt.png';
    this.$rootScope.img_file_wav = this.Environment.imagesURL() + 'file-type-wav.png';
    this.$rootScope.img_file_wma = this.Environment.imagesURL() + 'file-type-wma.png';
    this.$rootScope.img_file_xml = this.Environment.imagesURL() + 'file-type-xml.png';
    this.$rootScope.img_file_zip = this.Environment.imagesURL() + 'file-type-zip.png';
  }

  imgForFileType(type: MessageType): string {
    return this.$rootScope['img_file_' + type] || this.$rootScope['img_file'];
  }

  getUser(): IUser {
    return this.UserStore.currentUser();
  }

  /**
   * Show the login box
   */
  showLoginBox(mode?: LoginMode) {
    this.$rootScope.loginMode = mode ? mode : this.Auth.mode;
    this.$scope.activeBox = Defines.LoginBox;
    this.$timeout.bind(this)(() => {
      this.$scope.$digest();
    });
  }

  /**
   * Show the profile settings
   */
  showProfileSettingsBox() {
    this.$scope.activeBox = Defines.ProfileSettingsBox;

    // This will allow us to setup validation after the user
    // has been loaded
    this.$scope.$broadcast(Defines.ShowProfileSettingsBox);
  }

  /**
   * Show the main box
   */
  showMainBox() {
    this.$scope.activeBox = Defines.MainBox;
  }

  showErrorBox(message: string) {
    this.$scope.activeBox = Defines.ErrorBox;
    this.$scope.errorBoxMessage = message;
    this.$timeout.bind(this)(() => {
        this.$scope.$digest();
    });
  }

  /**
   * Show the create public room box
   */
  showCreateRoomBox() {
    this.$scope.activeBox = Defines.CreateRoomBox;
    this.$scope.$broadcast(Defines.ShowCreateChatBox);
  }

  toggleMainBoxVisibility() {
    this.setMainBoxMinimized(!this.$scope.mainBoxMinimized);
  }

  minimizeMainBox() {
    this.setMainBoxMinimized(true);
  }

  setMainBoxMinimized(minimized: boolean) {
    this.$scope.mainBoxMinimized = minimized;
    this.LocalStorage.setProperty(this.LocalStorage.mainMinimizedKey, minimized);
  }

  // saveRoomSlotToUser(room: IRoom) {
  //   this.getUser().updateRoomSlot(room, room.slot);
  // }

  /**
   * Show the floating profile box
   * when the user's mouse leaves the box
   * we wait a small amount of time before
   * hiding the box - this gives the mouse
   * time to go from the list to inside the
   * box before the box disappears
   */
  showProfileBox(uid: string, duration: number) {

    if (this.Config.disableUserInfoPopup) {
        return;
    }

    this.$scope.friendsEnabled = this.Config.friendsEnabled;

    this.$scope.profileBoxStyle = {
      right: 250 + 'px',
      width: Dimensions.ProfileBoxWidth + 'px',
      'border-top-left-radius': 4,
      'border-bottom-left-radius': 4,
      'border-top-right-radius': 0,
      'border-bottom-right-radius': 0
    };

    if (!uid) {
      if (duration === 0) {
        this.$scope.currentUser = null;
      }
      else {
        this.$scope.profileHideTimeoutPromise = this.$timeout(() => {
          this.$scope.currentUser = null;
        }, duration ? duration : 100);
      }
    }
    else {
      this.$scope.cancelTimer();
      this.$scope.currentUser = this.UserStore.getUserWithID(uid);
      const profileHTML = this.$scope.currentUser.getProfileHTML();
      this.$scope.currentUserHTML = !profileHTML ? null : this.$sce.trustAsHtml(profileHTML);
    }
  }

  cancelTimer() {
    this.$timeout.cancel(this.$scope.profileHideTimeoutPromise);
  }

  addRemoveFriend(user: IUser) {
    if (this.$scope.isFriend(user)) {
      this.getUser().removeFriend(user);
    }
    else {
      this.getUser().addFriend(user);
    }
  }

  isFriend(user: IUser): boolean {
    return this.FriendsConnector.isFriend(user);
  }

  blockUnblockUser(user: IUser) {
    if (this.isBlocked(user)) {
      this.getUser().unblockUser(user);
    }
    else {
      this.getUser().blockUser(user);
    }
  }

  isBlocked(user: IUser): boolean {
    if (user) {
        return !Utils.unORNull(this.Cache.blockedUsers[user.uid()]);
    }
    return false;
  }

  buttonClassForUser(user: IUser): string {
    if (user) {
      if (this.isBlocked(user)) {
        return 'uk-button-danger';
      }
      else if (!this.isOnline(user)) {
        return null;
      }
      else {
        return 'uk-button-success';
      }
    }
  }

  buttonTextForUser(user: IUser) {
    if (user) {
      if (this.isBlocked(user)) {
        return 'Unblock';
      }
      else if (!this.isOnline(user)) {
        return 'Offline';
      }
      else {
        return 'Chat';
      }
    }
  }

  isOnline(user: IUser): boolean {
    return user.online;
  }

  /**
    * @return number of online users
    */
  updateTotalUserCount() {
    this.$scope.totalUserCount = this.OnlineConnector.onlineUserCount();
  }

  userClicked(user: IUser) {

    // Is the user blocked?
    if (this.Cache.isBlockedUser(user.uid())) {
      this.getUser().unblockUser(user);
    }
    else {
      // Check to see if there's an open room with the two users
      let rooms = this.Cache.getPrivateRoomsWithUsers(this.UserStore.currentUser(), user);
      if (rooms.length) {
        const r = rooms[0];
        if (r.getType() == RoomType.RoomType.OneToOne) {
          r.flashHeader();
          // The room is already open! Do nothing
          return;
        }
      }
      else {
        rooms = this.RoomStore.getPrivateRoomsWithUsers(this.UserStore.currentUser(), user);
        if (rooms.length) {
          const room = rooms[0];
          room.open(0);
          return;
        }
      }
      this.RoomCreator.createPrivateRoom([user]).then((room: IRoom) => {
        this.RoomOpenQueue.addRoomWithID(room.rid());
        room.open(0);
        //let room = RoomStore.getOrCreateRoomWithID(rid);
      }, (error) => {
        console.log(error);
      });
    }
  }

  /**
    *
    */
  logout() {

    // Now we need to
    this.Presence.goOffline();

    //
    this.Presence.stop();

    if (this.UserStore.currentUser()) {
      this.StateManager.userOff(this.UserStore.currentUser().uid());
    }

    this.StateManager.off();

    // TODO: Should we set all rooms off?

    this.RoomPositionManager.closeAllRooms();

    this.NetworkManager.auth.setCurrentUserID(null);
    this.$rootScope.user = null;

    // Clear the cache down
    this.Cache.clear();


    // Allow the user to log back in
    // Handled by callback
    //$scope.showLoginBox();

    // Set all current rooms off

    this.hideNotification();

    this.$scope.email = '';
    this.$scope.password = '';

    this.$rootScope.$broadcast(N.Logout);

    this.LocalStorage.clearToken();

    this.Auth.logout();

    this.$timeout.bind(this)(() => {
      this.$rootScope.$digest();
    });
  }

  shutdown($event: any) {

    if (typeof $event.stopPropagation != 'undefined') {
      $event.stopPropagation();
    } else {
      $event.cancelBubble = true;
    }

    this.$scope.on = !this.$scope.on;
    if (this.$scope.on) {
      this.LocalStorage.setOffline(false);
      this.Presence.goOnline();
    }
    else {
      this.Presence.goOffline();
      this.LocalStorage.setOffline(true);
    }
  }

  shutdownImage(): string {
    if (this.$scope.on) {
      return this.$scope.img_30_shutdown_on;
    }
    else {
      return this.$scope.img_30_shutdown;
    }
  }

  // File uploads
  onFileSelect($files: any[]) {

    this.$scope.uploadingFile = false;
    this.$scope.uploadProgress = 0;

    const f = $files[0];
    if (!f) {
      return;
    }

    if (f.type == 'image/png' || f.type == 'image/jpeg') {

    }
    else {
      this.showNotification(NotificationType.Alert, 'File error', 'Only image files can be uploaded', 'ok');
      return;
    }

    if ($files.length > 0) {
      this.NetworkManager.upload.uploadFile($files[0]).then((path: string) => {
        this.getUser().updateImageURL(path);
      });

      //Parse.uploadFile($files[0]).then((function(r) {
      //
      //    if(r.data && r.data.url) {
      //
      //        $scope.getUser().updateImageURL(r.data.url);
      //    }
      //
      //}).bind(this), (function (error) {
      //
      //}).bind(this));
    }

    const reader = new FileReader();

    // Load the image into the canvas immediately - so the user
    // doesn't have to wait for it to upload
    reader.onload = (() => {
      return (e: any) => {

        const image = new Image();

        image.onload = (() => {

          // Resize the image
          const canvas = document.createElement('canvas'),
                max_size = 100,
                width = image.width,
                height = image.height;

          let x = 0;
          let y = 0;

          if (width > height) {
            x = (width - height)/2;
          } else {
            y = (height - width)/2;
          }

          //let size = width - 2 * x;

          // First rescale the image to be square
          canvas.width = max_size;
          canvas.height = max_size;
          canvas.getContext('2d').drawImage(image, x, y, width - 2 * x, height - 2 * y, 0, 0, max_size, max_size);

          const imageDataURL = canvas.toDataURL('image/jpeg');

          // Set the user's image
          this.$scope.$apply(() => {
            this.getUser().setImage(imageDataURL, true);
          });

        }).bind(this);
        image.src = e.target.result;
      };
    }).bind(this);

    reader.readAsDataURL(f);
  }

  hideNotification() {
    this.$scope.notification.show = false;
  }

  showNotification(type: NotificationType, title: string, message: string, button: string) {
    this.$scope.notification.title = title;
    this.$scope.notification.message = message;
    this.$scope.notification.type = type;
    this.$scope.notification.button = button;
    this.$scope.notification.show = true;
    this.$timeout.bind(this)(() => {
      this.$scope.$digest();
    })
  }

}

angular.module('myApp.controllers').controller('MainAppController', MainAppController);
