import * as angular from 'angular'
import * as Dimensions from "../keys/dimensions";
import * as NotificationKeys from "../keys/notification-keys";
import * as RoomType from "../keys/room-type";
import * as MessageType from "../keys/message-type";
import * as Defines from "../keys/defines";

angular.module('myApp.controllers').controller('AppController', [
    '$rootScope', '$scope','$timeout', '$window', '$sce', 'PathAnalyser', 'OnlineConnector', 'FriendsConnector', 'Cache', 'UserStore', 'RoomStore','$document', 'Presence', 'LocalStorage', 'Room', 'Config', 'Log', 'Partials', 'RoomPositionManager', 'Utils', 'Paths', 'Auth', 'StateManager', 'RoomOpenQueue', 'NetworkManager', 'Environment',
    function($rootScope, $scope, $timeout, $window, $sce, PathAnalyser, OnlineConnector, FriendsConnector, Cache, UserStore, RoomStore, $document, Presence, LocalStorage, Room, Config, Log, Partials, RoomPositionManager, Utils, Paths, Auth, StateManager, RoomOpenQueue, NetworkManager, Environment) {

        $scope.totalUserCount = 0;
        $scope.friendsEnabled = true;

        // Used to hide chat box
        $scope.hidden = Environment.options().hideMainBox;

        $rootScope.messageTypeText = MessageType.MessageTypeText;
        $rootScope.messageTypeImage = MessageType.MessageTypeImage;
        $rootScope.messageTypeFile = MessageType.MessageTypeFile;

        $scope.init = function () {

            // Check to see if the user wants the chat to
            // load on this page. We look at the showOnPaths variable
            // in the options
            //CC_OPTIONS.showOnPaths = "*ccwp, *p*";
            if(Environment.showOnPaths()) {
                let paths = Environment.showOnPaths();
                if(!PathAnalyser.shouldShowChatOnPath(paths)) {
                    return;
                }
            }

            Paths.setCID(Environment.rootPath());

            // Start the config listener to get the current
            // settings from Firebase
            Config.startConfigListener().then(function () {

            });

            Partials.load();

            //API.getOnlineUserCount().then(function (count) {
            //    $scope.totalUserCount = count;
            //});

            // Show the waiting overlay
            $scope.notification = {
                show: false
            };

            if(LocalStorage.isOffline()) {
                $scope.on = false;
                Presence.goOffline();
            }
            else {
                $scope.on = true;
            }

            $rootScope.websiteName = $window.location.host;

            /**
             * Single Sign on
             */

            let loginURL = Config.loginURL;
            if(loginURL && loginURL.length > 0) {
                $rootScope.loginURL = loginURL;
            }

            let registerURL = Config.registerURL;
            if(registerURL && registerURL.length > 0) {
                $rootScope.registerURL = registerURL;
            }

            /**
             * Anonymous login and social login
             */

            $scope.setupImages();
            $scope.setupFileIcons();

            $scope.setMainBoxMinimized(LocalStorage.getProperty(LocalStorage.mainMinimizedKey));

            $scope.$on(NotificationKeys.UserOnlineStateChangedNotification, function () {
                Log.notification(NotificationKeys.UserOnlineStateChangedNotification, "AppController");
                $scope.updateTotalUserCount();
                $timeout(function () {
                    $scope.$digest();
                });
            });

        };

        /**
         * The images in the partials should be pointed at the correct
         * server
         */
        $scope.setupImages = function () {
            $rootScope.img_30_minimize = Environment.imagesURL() + 'cc-30-minimize.png';
            $rootScope.img_30_resize = Environment.imagesURL() + 'cc-30-resize.png';
            $rootScope.img_20_cross = Environment.imagesURL() + 'cc-20-cross.png';
            $rootScope.img_30_cross = Environment.imagesURL() + 'cc-30-cross.png';
            $rootScope.img_40_cross = Environment.imagesURL() + 'cc-40-cross.png';
            $rootScope.img_40_tick = Environment.imagesURL() + 'cc-40-tick.png';
            $rootScope.img_30_shutdown = Environment.imagesURL() + 'cc-30-shutdown_on.png';
            $rootScope.img_30_shutdown_on = Environment.imagesURL() + 'cc-30-shutdown.png';
            $rootScope.img_30_plus = Environment.imagesURL() + 'cc-30-plus.png';
            $rootScope.img_30_profile_pic = Environment.imagesURL() + 'cc-30-profile-pic.png';
            $rootScope.img_30_gear = Environment.imagesURL() + 'cc-30-gear.png';
            $rootScope.img_loader = Environment.imagesURL() + 'loader.gif';
            $rootScope.img_20_user = Environment.imagesURL() + 'cc-20-user.png';
            $rootScope.img_20_friend = Environment.imagesURL() + 'cc-20-friend.png';
            $rootScope.img_30_logout = Environment.imagesURL() + 'cc-30-logout.png';
            $rootScope.img_30_emojis = Environment.imagesURL() + 'cc-30-emojis.png';
            $rootScope.img_30_maximize = Environment.imagesURL() + 'cc-30-maximize.png';
            $rootScope.img_30_sound_on = Environment.imagesURL() + 'cc-30-sound-on.png';
            $rootScope.img_30_sound_off = Environment.imagesURL() + 'cc-30-sound-off.png';
            $rootScope.img_30_clear_cache = Environment.imagesURL() + 'cc-30-clear-cache.png';
            $rootScope.img_30_cache_cleared = Environment.imagesURL() + 'cc-30-cache-cleared.png';
            $rootScope.img_24_save = Environment.imagesURL() + 'cc-24-save.png';
            $rootScope.img_30_save = Environment.imagesURL() + 'cc-30-save.png';
            $rootScope.img_24_copy = Environment.imagesURL() + 'cc-24-copy.png';
            $rootScope.img_24_cross = Environment.imagesURL() + 'cc-24-cross.png';
            $rootScope.img_30_image = Environment.imagesURL() + 'cc-30-image.png';
            $rootScope.img_20_flag = Environment.imagesURL() + 'cc-20-flag.png';
            $rootScope.img_20_flagged = Environment.imagesURL() + 'cc-20-flagged.png';
            $rootScope.img_30_powered_by = Environment.imagesURL() + 'cc-30-powered-by.png';
            $rootScope.img_30_start_chatting = Environment.imagesURL() + 'cc-30-start-chatting.png';
        };

        $scope.setupFileIcons = function () {
            $rootScope.img_file = Environment.imagesURL() + 'file.png';
            $rootScope.img_file_download = Environment.imagesURL() + 'file-download.png';
            $rootScope.img_file_aac = Environment.imagesURL() + 'file-type-aac.png';
            $rootScope.img_file_acc = Environment.imagesURL() + 'file-type-acc.png';
            $rootScope.img_file_ai = Environment.imagesURL() + 'file-type-ai.png';
            $rootScope.img_file_avi = Environment.imagesURL() + 'file-type-avi.png';
            $rootScope.img_file_bmp = Environment.imagesURL() + 'file-type-bmp.png';
            $rootScope.img_file_f4a = Environment.imagesURL() + 'file-type-f4a.png';
            $rootScope.img_file_gif = Environment.imagesURL() + 'file-type-gif.png';
            $rootScope.img_file_html = Environment.imagesURL() + 'file-type-html.png';
            $rootScope.img_file_jpeg = Environment.imagesURL() + 'file-type-jpeg.png';
            $rootScope.img_file_jpg = Environment.imagesURL() + 'file-type-jpg.png';
            $rootScope.img_file_jpp = Environment.imagesURL() + 'file-type-jpp.png';
            $rootScope.img_file_json = Environment.imagesURL() + 'file-type-json.png';
            $rootScope.img_file_m4a = Environment.imagesURL() + 'file-type-m4a.png';
            $rootScope.img_file_midi = Environment.imagesURL() + 'file-type-midi.png';
            $rootScope.img_file_mov = Environment.imagesURL() + 'file-type-mov.png';
            $rootScope.img_file_mp3 = Environment.imagesURL() + 'file-type-mp3.png';
            $rootScope.img_file_mp4 = Environment.imagesURL() + 'file-type-mp4.png';
            $rootScope.img_file_oga = Environment.imagesURL() + 'file-type-oga.png';
            $rootScope.img_file_ogg = Environment.imagesURL() + 'file-type-ogg.png';
            $rootScope.img_file_pdf = Environment.imagesURL() + 'file-type-pdf.png';
            $rootScope.img_file_psd = Environment.imagesURL() + 'file-type-psd.png';
            $rootScope.img_file_rtf = Environment.imagesURL() + 'file-type-rtf.png';
            $rootScope.img_file_svg = Environment.imagesURL() + 'file-type-svg.png';
            $rootScope.img_file_tif = Environment.imagesURL() + 'file-type-tif.png';
            $rootScope.img_file_tiff = Environment.imagesURL() + 'file-type-tiff.png';
            $rootScope.img_file_txt = Environment.imagesURL() + 'file-type-txt.png';
            $rootScope.img_file_wav = Environment.imagesURL() + 'file-type-wav.png';
            $rootScope.img_file_wma = Environment.imagesURL() + 'file-type-wma.png';
            $rootScope.img_file_xml = Environment.imagesURL() + 'file-type-xml.png';
            $rootScope.img_file_zip = Environment.imagesURL() + 'file-type-zip.png';
        };

        $rootScope.imgForFileType = function (type) {
            return $rootScope['img_file_' + type] || $rootScope['img_file'];
        };

        $scope.getUser = function () {
            return $rootScope.user;
        };

        /**
         * Show the login box
         */
        $scope.showLoginBox = function () {
            $scope.showLoginBox(null);
        };

        $scope.showLoginBox = function (mode) {
            $rootScope.loginMode = mode ? mode : Auth.mode;
            $scope.activeBox = Defines.LoginBox;
            $timeout(function() {
                $scope.$digest();
            });
        };

        /**
         * Show the profile settings
         */
        $scope.showProfileSettingsBox = function () {
            $scope.activeBox = Defines.ProfileSettingsBox;

            // This will allow us to setup validation after the user
            // has been loaded
            $scope.$broadcast(Defines.ShowProfileSettingsBox);
        };

        /**
         * Show the main box
         */
        $scope.showMainBox = function () {
            $scope.activeBox = Defines.MainBox;
        };

        $scope.showErrorBox = function (message) {
            $scope.activeBox = Defines.ErrorBox;
            $scope.errorBoxMessage = message;
            $timeout(function() {
                $scope.$digest();
            });
        };

        /**
         * Show the create public room box
         */
        $scope.showCreateRoomBox = function () {
            $scope.activeBox = Defines.CreateRoomBox;
            $scope.$broadcast(Defines.ShowCreateChatBox);
        };

        $scope.toggleMainBoxVisibility = function() {
            $scope.setMainBoxMinimized(!$scope.mainBoxMinimized);
        };

        $scope.minimizeMainBox = function () {
            $scope.setMainBoxMinimized(true);
        };

        $scope.setMainBoxMinimized = function (minimized) {
            $scope.mainBoxMinimized = minimized;
            LocalStorage.setProperty(LocalStorage.mainMinimizedKey, minimized);
        };

//    $scope.saveRoomSlotToUser = function (room) {
//        $scope.getUser().updateRoomSlot(room, room.slot);
//    };

        /**
         * Show the floating profile box
         * when the user's mouse leaves the box
         * we wait a small amount of time before
         * hiding the box - this gives the mouse
         * time to go from the list to inside the
         * box before the box disappears
         */
        $scope.showProfileBox = function (uid, duration) {

            if(Config.disableUserInfoPopup) {
                return;
            }

            $scope.friendsEnabled = Config.friendsEnabled;

            $scope.profileBoxStyle = {
                right: 250,
                width: Dimensions.ProfileBoxWidth,
                'border-top-left-radius': 4,
                'border-bottom-left-radius': 4,
                'border-top-right-radius': 0,
                'border-bottom-right-radius': 0
            };

            if(!uid) {
                if(duration === 0) {
                    $scope.currentUser = null;
                }
                else {
                    $scope.profileHideTimeoutPromise = $timeout(function () {
                        $scope.currentUser = null;
                    }, duration ? duration : 100);
                }
            }
            else {
                $scope.cancelTimer();
                $scope.currentUser = UserStore.getUserWithID(uid);
                let profileHTML = $scope.currentUser.getProfileHTML();
                $scope.currentUserHTML = !profileHTML ? null : $sce.trustAsHtml(profileHTML);
            }
        };


        $scope.cancelTimer = function () {
            $timeout.cancel($scope.profileHideTimeoutPromise);
        };

        $scope.addRemoveFriend = function(user) {
            if($scope.isFriend(user)) {
                $scope.getUser().removeFriend(user);
            }
            else {
                $scope.getUser().addFriend(user);
            }
        };

        $scope.isFriend = function (user) {
            return FriendsConnector.isFriend(user);
        };

        $scope.blockUnblockUser = function(user) {
            if($scope.isBlocked(user)) {
                $scope.getUser().unblockUser(user);
            }
            else {
                $scope.getUser().blockUser(user);
            }
        };

        $scope.isBlocked = function (user) {
            if(user) {
                return !Utils.unORNull(Cache.blockedUsers[user.uid()]);
            }
            return false;
        };

        $scope.buttonClassForUser = function (user) {
            if(user) {
                if($scope.isBlocked(user)) {
                    return 'uk-button-danger';
                }
                else if(!$scope.isOnline(user)) {
                    return null;
                }
                else {
                    return 'uk-button-success';
                }
            }
        };

        $scope.buttonTextForUser = function (user) {
            if(user) {
                if($scope.isBlocked(user)) {
                    return "Unblock";
                }
                else if(!$scope.isOnline(user)) {
                    return 'Offline';
                }
                else {
                    return 'Chat';
                }
            }
        };

        $scope.isOnline = function (user) {
            return user.online;
        };

        /**
         * @return number of online users
         */
        $scope.updateTotalUserCount = function () {
            $scope.totalUserCount = OnlineConnector.onlineUserCount();
        };

        $scope.userClicked = function (user) {

            // Is the user blocked?
            if (Cache.isBlockedUser(user.uid())) {
                $scope.getUser().unblockUser(user);
            }
            else {
                // Check to see if there's an open room with the two users
                let rooms = Cache.getPrivateRoomsWithUsers($rootScope.user, user);
                if (rooms.length) {
                    let r = rooms[0];
                    if(r.type() == RoomType.RoomType1to1) {
                        r.flashHeader();
                        // The room is already open! Do nothing
                        return;
                    }
                }
                else {
                    rooms = RoomStore.getPrivateRoomsWithUsers($rootScope.user, user);
                    if(rooms.length) {
                        let room = rooms[0];
                        room.open(0, 300);
                        return;
                    }
                }
                Room.createPrivateRoom([user]).then(function (rid) {
                    RoomOpenQueue.addRoomWithID(rid);
                    //let room = RoomStore.getOrCreateRoomWithID(rid);
                }, function (error) {
                    console.log(error);
                });
            }
        };

        /**
         *
         */
        $scope.logout = function () {

            // Now we need to
            Presence.goOffline();

            //
            Presence.stop();

            if($rootScope.user) {
                StateManager.userOff($rootScope.user.uid());
            }

            StateManager.off();

            // TODO: Should we set all rooms off?

            RoomPositionManager.closeAllRooms();

            // Nullify the user
            $rootScope.user = null;

            // Clear the cache down
            Cache.clear();


            // Allow the user to log back in
            // Handled by callback
            //$scope.showLoginBox();

            // Set all current rooms off

            $scope.hideNotification();

            $scope.email = "";
            $scope.password = "";

            $rootScope.$broadcast(NotificationKeys.LogoutNotification);

            LocalStorage.clearToken();

            Auth.logout();

            $timeout(function () {
                $rootScope.$digest();
            });
        };

        $scope.shutdown = function ($event) {

            if (typeof $event.stopPropagation != "undefined") {
                $event.stopPropagation();
            } else {
                $event.cancelBubble = true;
            }

            $scope.on = !$scope.on;
            if($scope.on) {
                LocalStorage.setOffline(false);
                Presence.goOnline();
            }
            else {
                Presence.goOffline();
                LocalStorage.setOffline(true);
            }
        };

        $scope.shutdownImage = function () {
            if($scope.on) {
                return $scope.img_30_shutdown_on;
            }
            else {
                return $scope.img_30_shutdown;
            }
        };

        // File uploads
        $scope.onFileSelect = function($files) {

            $scope.uploadingFile = false;
            $scope.uploadProgress = 0;

            let f = $files[0];
            if(!f) {
                return;
            }

            if(f.type == "image/png" || f.type == 'image/jpeg') {

            }
            else {
                $scope.showNotification(Defines.NotificationTypeAlert, 'File error', 'Only image files can be uploaded', 'ok');
                return;
            }

            if($files.length > 0) {
                NetworkManager.upload.uploadFile($files[0]).then((function (path) {
                    $scope.getUser().updateImageURL(path);
                }).bind(this));

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

            let reader = new FileReader();

            // Load the image into the canvas immediately - so the user
            // doesn't have to wait for it to upload
            reader.onload = (function() {
                return function(e) {

                    let image = new Image();

                    image.onload = function () {

                        // Resize the image
                        let canvas = document.createElement('canvas'),
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

                        let imageDataURL = canvas.toDataURL('image/jpeg');

                        // Set the user's image
                        $scope.$apply(function () {
                            $scope.getUser().setImage(imageDataURL, true);
                        });

                    };
                    image.src = e.target.result;
                };
            })();

            reader.readAsDataURL(f);

        };

        $scope.hideNotification = function () {
            $scope.notification.show = false;
        };

        $scope.showNotification = function (type, title, message, button) {
            $scope.notification.title = title;
            $scope.notification.message = message;
            $scope.notification.type = type;
            $scope.notification.button = button;
            $scope.notification.show = true;
            $timeout(function () {
                $scope.$digest();
            });
        };

        $scope.init();

    }]);
