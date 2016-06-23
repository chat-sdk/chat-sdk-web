'use strict';

/* Controllers */

var myApp = angular.module('myApp.controllers', ['firebase', 'angularFileUpload', 'ngSanitize', 'emoji']);

myApp.controller('AppController', [
    '$rootScope', '$scope','$timeout', '$window', '$sce', '$firebase', '$upload', 'PathAnalyser', 'OnlineConnector', 'FriendsConnector', 'Auth', 'Cache', 'UserStore', 'RoomStore','$document', 'Presence', 'LocalStorage', 'Room', 'Config', 'Parse', 'Log', 'Partials', 'RoomPositionManager', 'Utils', 'Paths', 'Authentication', 'StateManager', 'API', 'RoomOpenQueue',
    function($rootScope, $scope, $timeout, $window, $sce, $firebase, $upload, PathAnalyser, OnlineConnector, FriendsConnector, Auth, Cache, UserStore, RoomStore, $document, Presence, LocalStorage, Room, Config, Parse, Log, Partials, RoomPositionManager, Utils, Paths, Authentication, StateManager, API, RoomOpenQueue) {

    $scope.totalUserCount = 0;
    $scope.friendsEnabled = true;

    $rootScope.messageTypeText = bMessageTypeText;
    $rootScope.messageTypeImage = bMessageTypeImage;

    $scope.init = function () {

        // Check to see if the user wants the chat to
        // load on this page. We look at the showOnPaths variable
        // in the options
        //CC_OPTIONS.showOnPaths = "*ccwp, *p*";
        if(CC_OPTIONS && CC_OPTIONS.showOnPaths) {
            var paths = CC_OPTIONS.showOnPaths;
            if(!PathAnalyser.shouldShowChatOnPath(paths)) {
                return;
            }
        }

        Partials.load();

        API.getOnlineUserCount().then(function (count) {
            $scope.totalUserCount = count;
        });

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

        $rootScope.baseURL = bPartialURL;
        $rootScope.websiteName = $window.location.host;

        /**
         * Single Sign on
         */

        var loginURL = Config.loginURL;
        if(loginURL && loginURL.length > 0) {
            $rootScope.loginURL = loginURL;
        }

        var registerURL = Config.registerURL;
        if(registerURL && registerURL.length > 0) {
            $rootScope.registerURL = registerURL;
        }

        /**
         * Anonymous login and social login
         */

        $scope.setupImages();

        $scope.setMainBoxMinimized(LocalStorage.getProperty(LocalStorage.mainMinimizedKey));

        $scope.$on(bUserOnlineStateChangedNotification, function () {
            Log.notification(bUserOnlineStateChangedNotification, "AppController");
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
        $rootScope.img_30_minimize = bImagesURL + 'cc-30-minimize.png';
        $rootScope.img_30_resize = bImagesURL + 'cc-30-resize.png';
        $rootScope.img_20_cross = bImagesURL + 'cc-20-cross.png';
        $rootScope.img_30_cross = bImagesURL + 'cc-30-cross.png';
        $rootScope.img_40_cross = bImagesURL + 'cc-40-cross.png';
        $rootScope.img_40_tick = bImagesURL + 'cc-40-tick.png';
        $rootScope.img_30_shutdown = bImagesURL + 'cc-30-shutdown_on.png';
        $rootScope.img_30_shutdown_on = bImagesURL + 'cc-30-shutdown.png';
        $rootScope.img_30_plus = bImagesURL + 'cc-30-plus.png';
        $rootScope.img_30_gear = bImagesURL + 'cc-30-gear.png';
        $rootScope.img_loader = bImagesURL + 'loader.gif';
        $rootScope.img_20_user = bImagesURL + 'cc-20-user.png';
        $rootScope.img_20_friend = bImagesURL + 'cc-20-friend.png';
        $rootScope.img_30_logout = bImagesURL + 'cc-30-logout.png';
        $rootScope.img_30_emojis = bImagesURL + 'cc-30-emojis.png';
        $rootScope.img_30_maximize = bImagesURL + 'cc-30-maximize.png';
        $rootScope.img_30_sound_on = bImagesURL + 'cc-30-sound-on.png';
        $rootScope.img_30_sound_off = bImagesURL + 'cc-30-sound-off.png';
        $rootScope.img_30_clear_cache = bImagesURL + 'cc-30-clear-cache.png';
        $rootScope.img_30_cache_cleared = bImagesURL + 'cc-30-cache-cleared.png';
        $rootScope.img_24_save = bImagesURL + 'cc-24-save.png';
        $rootScope.img_24_copy = bImagesURL + 'cc-24-copy.png';
        $rootScope.img_24_cross = bImagesURL + 'cc-24-cross.png';
        $rootScope.img_30_image = bImagesURL + 'cc-30-image.png';
        $rootScope.img_20_flag = bImagesURL + 'cc-20-flag.png';
        $rootScope.img_20_flagged = bImagesURL + 'cc-20-flagged.png';
        $rootScope.img_30_powered_by = bImagesURL + 'cc-30-powered-by.png';
        $rootScope.img_30_start_chatting = bImagesURL + 'cc-30-start-chatting.png';
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
//        Paths.firebase().unauth();
        $rootScope.loginMode = mode ? mode : Authentication.mode;
        $scope.activeBox = bLoginBox;
        $timeout(function() {
            $scope.$digest();
        });
    };

    /**
     * Show the profile settings
     */
    $scope.showProfileSettingsBox = function () {
        $scope.activeBox = bProfileSettingsBox;

        // This will allow us to setup validation after the user
        // has been loaded
        $scope.$broadcast(bShowProfileSettingsBox);
    };

    /**
     * Show the main box
     */
    $scope.showMainBox = function () {
        $scope.activeBox = bMainBox;
    };

    $scope.showErrorBox = function (message) {
        $scope.activeBox = bErrorBox;
        $scope.errorBoxMessage = message;
        $timeout(function() {
            $scope.$digest();
        });
    };

    /**
     * Show the create public room box
     */
    $scope.showCreateRoomBox = function () {
        $scope.activeBox = bCreateRoomBox;
        $scope.$broadcast(bShowCreateChatBox);
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
            width: bProfileBoxWidth,
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
            var profileHTML = $scope.currentUser.meta.profileHTML;
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
            return !Utils.unORNull(Cache.blockedUsers[user.meta.uid]);
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
        if (Cache.isBlockedUser(user.meta.uid)) {
            $scope.getUser().unblockUser(user);
        }
        else {
            // Check to see if there's an open room with the two users
            var rooms = Cache.getPrivateRoomsWithUsers($rootScope.user, user);
            if (rooms.length) {
                var r = rooms[0];
                if(r.type() == bRoomType1to1) {
                    r.flashHeader();
                    // The room is already open! Do nothing
                    return;
                }
            }
            else {
                rooms = RoomStore.getPrivateRoomsWithUsers($rootScope.user, user);
                if(rooms.length) {
                    var room = rooms[0];
                    room.open(0, 300);
                    return;
                }
            }
            Room.createPrivateRoom([user]).then(function (rid) {
                RoomOpenQueue.addRoomWithID(rid);
                //var room = RoomStore.getOrCreateRoomWithID(rid);
            }, function (error) {
                console.log(error);
            });
        }
    };

    /**
     * Log the user out
     */
//    $scope. = function () {
//
//        // This will be handled by the logout listener anyway
//        Paths.firebase().unauth();
//
//        $scope.showLoginBox();
//    };

    /**
     *
     */
    $scope.logout = function () {


        // Now we need to
        Presence.goOffline();

        //
        Presence.stop();

        if($rootScope.user) {
            StateManager.userOff($rootScope.user.meta.uid);
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

        $rootScope.$broadcast(bLogoutNotification);

        LocalStorage.clearToken();

        Paths.firebase().unauth();

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

        var f = $files[0];
        if(!f) {
            return;
        }

        if(f.type == "image/png" || f.type == 'image/jpeg') {

        }
        else {
            $scope.showNotification(bNotificationTypeAlert, 'File error', 'Only image files can be uploaded', 'ok');
            return;
        }

        if($files.length > 0) {
            Parse.uploadFile($files[0]).then((function(r) {

                if(r.data && r.data.url) {

                    $scope.getUser().updateImageURL(r.data.url);
                }

            }).bind(this), (function (error) {

            }).bind(this));
        }

        var reader = new FileReader();

        // Load the image into the canvas immediately - so the user
        // doesn't have to wait for it to upload
        reader.onload = (function() {
            return function(e) {

                var image = new Image();

                image.onload = function () {

                    // Resize the image
                    var canvas = document.createElement('canvas'),
                        max_size = 100,
                        width = image.width,
                        height = image.height;

                    var x = 0;
                    var y = 0;

                    if (width > height) {
                        x = (width - height)/2;

                    } else {
                        y = (height - width)/2;
                    }

                    //var size = width - 2 * x;

                    // First rescale the image to be square
                    canvas.width = max_size;
                    canvas.height = max_size;
                    canvas.getContext('2d').drawImage(image, x, y, width - 2 * x, height - 2 * y, 0, 0, max_size, max_size);

                    var imageDataURL = canvas.toDataURL('image/jpeg');

                    // Set the user's image
                    $scope.$apply(function () {
                        $scope.getUser().setImage(imageDataURL, true);
                    });

                };
                image.src = e.target.result;
            };
        })(f);

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

myApp.controller('ChatBarController', ['$scope', '$timeout', 'Cache', 'Log', function($scope, $timeout, Cache, Log) {

    $scope.rooms = [];

    $scope.init = function () {

        $scope.$on(bRoomOpenedNotification, $scope.updateList);
        $scope.$on(bRoomClosedNotification, $scope.updateList);

        $scope.$on(bUpdateRoomActiveStatusNotification, function () {
            Log.notification(bUpdateRoomActiveStatusNotification, 'ChatBarController');
            $scope.updateList();
        });

        $scope.$on(bLogoutNotification, $scope.updateList);

    };

    $scope.updateList = function () {

        Log.notification(bRoomOpenedNotification + "/" + bRoomClosedNotification, 'ChatBarController');

        // Only include rooms that are active
        $scope.rooms = Cache.activeRooms();

        $timeout(function () {
            $scope.$digest();
        });
    };

    $scope.init();

}]);

myApp.controller('MainBoxController', ['$scope', '$timeout', 'Auth', 'FriendsConnector', 'ArrayUtils', 'Config', 'Screen', 'Log', 'RoomPositionManager', 'RoomStore',
    function($scope, $timeout, Auth, FriendsConnector, ArrayUtils, Config, Screen, Log, RoomPositionManager, RoomStore) {

    $scope.inboxCount = 0;

    $scope.usersTabEnabled = true
    $scope.roomsTabEnabled = true;
    $scope.friendsTabEnabled = true;
    $scope.tabCount = 0;

    $scope.init = function () {

        // Work out how many tabs there are
        $scope.$on(bConfigUpdatedNotification, function () {

            $scope.usersTabEnabled = Config.onlineUsersEnabled;
            $scope.roomsTabEnabled = Config.publicRoomsEnabled;
            $scope.friendsTabEnabled = Config.friendsEnabled;

            $scope.tabCount = $scope.numberOfTabs();

            // Make the users tab start clicked
            if(Config.onlineUsersEnabled) {
                $scope.tabClicked(bUsersTab);
            }
            else if(Config.publicRoomsEnabled) {
                $scope.tabClicked(bRoomsTab);
            }
            else {
                $scope.tabClicked(bInboxTab);
            }

            $timeout(function () {
                $scope.$digest();
            })
        });

        // Setup the search variable - if we don't do this
        // Angular can't set search.text
        $scope.search = {};
        $scope.search[bUsersTab] = "";
        $scope.search[bRoomsTab] = "";
        $scope.search[bFriendsTab] = "";

        // This is used by sub views for their layouts
        $scope.boxWidth = bMainBoxWidth;

        // We don't want people deleting rooms from this view
        $scope.canCloseRoom = false;

        // When the user value changes update the user interface
        $scope.$on(bUserValueChangedNotification, function () {
            Log.notification(bUserValueChangedNotification, "MainBoxController");
            $timeout(function () {
                $scope.$digest();
            });
        });

        $scope.updateMainBoxSize();
        $scope.$on(bScreenSizeChangedNotification, function () {
            Log.notification(bScreenSizeChangedNotification, "MainBoxController");
            $scope.updateMainBoxSize();
        });

        $scope.$on(bRoomBadgeChangedNotification, function () {
            Log.notification(bRoomBadgeChangedNotification, "MainBoxController");
            $scope.updateInboxCount();
        });

        $scope.$on(bLoginCompleteNotification, function () {
            Log.notification(bRoomRemovedNotification, 'InboxRoomsListController');
            $scope.updateInboxCount();
        });

    };

    $scope.numberOfTabs = function () {
        var tabs = 1;
        if(Config.onlineUsersEnabled) {
            tabs++;
        }
        if(Config.publicRoomsEnabled) {
            tabs++;
        }
        if(Config.friendsEnabled) {
            tabs++;
        }
        return tabs;
    };

    $scope.updateInboxCount = function () {
        $scope.inboxCount = RoomStore.inboxBadgeCount();
        $timeout(function () {
            $scope.$digest();
        });
    };

    $scope.updateMainBoxSize = function () {
        $scope.mainBoxHeight = Math.max(Screen.screenHeight * 0.5, bMainBoxHeight);
        $scope.mainBoxWidth = bMainBoxWidth;
        $timeout(function () {
            $scope.$digest();
        });
    };

    $scope.profileBoxDisabled = function () {
        return Config.disableProfileBox;
    };

    $scope.showOverlay = function (message) {
        $scope.notification.show = true;
        $scope.type = bNotificationTypeWaiting;
        $scope.notification.message = message;
    };

    $scope.tabClicked = function (tab) {
        $scope.activeTab = tab;

        // Save current search text
        //$scope.search

        if(tab == bUsersTab) {
            $scope.title = "Who's online";
        }
        if(tab == bRoomsTab) {
            $scope.title = "Chat rooms";
        }
        if(tab == bFriendsTab) {
            $scope.title = "My friends";
        }
        if(tab == bInboxTab) {
            $scope.title = "Inbox";
        }
    };

    /**
     * Return a list of friends filtered by the search box
     * @return A list of users who's names meet the search text
     */
    $scope.getAllUsers = function () {
        return ArrayUtils.objectToArray(FriendsConnector.friends);
    };

    $scope.searchKeyword = function () {
        return $scope.search[$scope.activeTab];
    };

    $scope.roomClicked = function (room) {

        // Trim the messages array in case it gets too long
        // we only need to store the last 200 messages!
        room.trimMessageList();

        // Messages on is called by when we add the room to the user
        // If the room is already open do nothing!
        if(room.flashHeader()) {
            return;
        }

        room.open(0, 300);
    };

    $scope.init();
}]);

myApp.controller('LoginController', ['$rootScope', '$scope', '$timeout','Auth', 'FriendsConnector', 'Cache', 'API', 'Presence', 'SingleSignOn','OnlineConnector', 'Utils', 'Paths', 'LocalStorage', 'StateManager', 'RoomPositionManager', 'Config', 'Authentication',
    function($rootScope, $scope, $timeout, Auth, FriendsConnector, Cache, API, Presence, SingleSignOn, OnlineConnector, Utils, Paths, LocalStorage, StateManager, RoomPositionManager, Config, Authentication) {

    /**
     * Initialize the login controller
     * Add listeners to AngularFire login, logout and error broadcasts
     * Setup the auth variable and try to authenticate
     */
    $scope.init = function () {

        $scope.rememberMe = true;

        var lastVisited = LocalStorage.getLastVisited();
        if(Utils.unORNull(lastVisited) || (new Date().getTime() - lastVisited)/1000 > Config.clickToChatTimeout && Config.clickToChatTimeout > 0) {
            $scope.showLoginBox(bLoginModeClickToChat);
        }
        else {
            $scope.startChatting();
        }

    };

    $scope.startChatting = function() {
        LocalStorage.setLastVisited();
        $scope.showLoginBox(bLoginModeAuthenticating);

        Authentication.startAuthListener().then(function(authData) {
            Authentication.setAuthListener($scope.handleAuthData);
            $scope.handleAuthData(authData);
        }, function (error) {
            Authentication.setAuthListener($scope.handleAuthData);
            //$scope.logout();
            //$scope.hideNotification();
            $scope.showLoginBox();
            console.log(error);
        });
    };

    $scope.handleAuthData = function (authData) {
        $rootScope.loginMode = Authentication.mode;

        console.log(authData);

        $rootScope.auth = authData;
        if(authData) {
            $scope.handleUserLogin(authData, false);
        }
        else {
            $scope.showLoginBox();
        }
    };

    $scope.setError = function (message) {
        $scope.showError = !Utils.unORNull(message);
        $scope.errorMessage = message;
    };

    $scope.loginWithPassword = function () {
        $scope.login('password', {
                email:$scope.email,
                password:$scope.password,
                rememberMe: $scope.rememberMe ? "default" : "sessionOnly"
            }
        );
    };

    /**
     * Log the user in using the appropriate login method
     * @param method - the login method: facebook, twitter etc...
     * @param options - hash of options: remember me etc...
     */
    $scope.login = function (method, options) {

        // Re-establish a connection with Firebase
        Presence.goOnline();

        // Reset any error messages
        $scope.showError = false;

        // Hide the overlay
        $scope.showNotification(bNotificationTypeWaiting, "Logging in", "For social login make sure to enable popups!");

        var handleResult = function (error) {
            if(error) {
                $scope.hideNotification();
                $scope.handleLoginError(error);

                $timeout(function(){
                    $scope.$digest();
                });
            }
        };

        var ref = Paths.firebase();

        if(method == 'password') {
            ref.authWithPassword({
                email    : options.email,
                password : options.password
            }, handleResult, {
                remember: $scope.rememberMe ? "default" : "sessionOnly"
            });
        }
        else if (method == 'anonymous') {
            ref.authAnonymously(handleResult);
        }
        else {

            var scope = null;

            if(method == "facebook") {
                scope = "email,user_likes";
            }
            if(method == "github") {
                scope = "user,gist";
            }
            if(method == "google") {
                scope = "email";
            }

            // Remove the listener
            Authentication.setAuthListener(null);

            $rootScope.$broadcast(bStartSocialLoginNotification, {
                action: method,
                path: Paths.firebase().toString(),
                scope: scope,
                remember: "sessionOnly"
            }, function (data) {
                if(data.authData) {
                    var ref = Paths.firebase();
                    ref.authWithCustomToken(data.authData.token, function (error, authData) {
                        $rootScope.auth = data.authData;

                        // Reinstate the handler
                        Authentication.setAuthListener($scope.handleAuthData);

                        // Handle the result manually
                        // We do this because if we handle auth using the callback the provider data
                        // is null
                        $scope.handleAuthData(data.authData);

                    });
                }
                else {
                    $scope.showNotification(bNotificationTypeAlert, "Social login failed", "Please try again", "Ok");
                }
            });
        }
    };

    $scope.forgotPassword  = function (email) {

        var ref = Paths.firebase();
        ref.resetPassword({
            email : email
        }, function(error) {
            if (!error) {
                $scope.showNotification(bNotificationTypeAlert, "Email sent",
                    "Instructions have been sent. Please check your Junk folder!", "ok");
                $scope.setError(null);
            } else {
                $scope.handleLoginError(error);
            }
        });

    };

    /**
     * Create a new account
     * @param email - user's email
     * @param password - user's password
     */
    $scope.signUp = function (email, password) {

        // Re-establish connection with Firebase
        Presence.goOnline();

        $scope.showError = false;

        $scope.showNotification(bNotificationTypeWaiting, "Registering...");

        // First create the super

        var ref = Paths.firebase();
        ref.createUser({
            email: email,
            password: password
        }, (function (error) {
            if(error) {
                $scope.handleLoginError(error);
            }
            else {
                $scope.email = email;
                $scope.password = password;
                $scope.loginWithPassword();
            }
        }).bind(this));
    };

    /**
     * Bind the user to Firebase
     * Using the user's authentcation information create
     * a three way binding to the user property
     * @param userData - User object from Firebase authentication
     * @param firstLogin - Has the user just signed up?
     */

    $scope.handleUserLogin = function (userData, firstLogin) {

        // Write a record to the firebase to record this API key
        $scope.showNotification(bNotificationTypeWaiting, "Opening Chat...");

        API.getAPIDetails().then((function(api) {

            // Load friends from config
            if(Config.friends) {
                FriendsConnector.addFriendsFromSSO(Config.friends);
            }

            console.log("API Key: " + API.meta.cid);

            // Get the number of chatters that are currently online
            API.getOnlineUserCount().then((function (number) {

//            });
//            Auth.numberOfChatters().then((function(number) {

                if(number >= api.max) {
                    $scope.hideNotification();
                    alert("Sorry the chat server is full! Try again later");
                    this.logout();
                }
                else {

                    // Start the config listner to get the current
                    // settings from Firebase
                    Config.startConfigListener().then((function () {

                        // This allows us to clear the cache remotely
                        LocalStorage.clearCacheWithTimestamp(Config.clearCacheTimestamp);

                        Auth.bindUser(userData).then(function() {
                            // We have the user's ID so we can get the user's object
                            if(firstLogin) {
                                $scope.showProfileSettingsBox();
                            }
                            else {
                                $scope.showMainBox();
                            }

                            $rootScope.$broadcast(bLoginCompleteNotification);
                            $scope.hideNotification();

                        }, function(error) {
                            $scope.showNotification(bNotificationTypeAlert, 'Login Error', error, 'Ok');
                        });
                    }).bind());
                }

            }).bind(this), (function (message) {

                // We couldn't connect to Chatcat.io API
                // Next check to see if they specified an API key
                console.log(message);

//                this.setError(message);
                $scope.hideNotification();

                $scope.showErrorBox(message);

            }).bind(this));

        }).bind(this), (function (message) {
            console.log(message);
            //this.setError(message);
            $scope.hideNotification();
            $scope.showErrorBox(message)
        }).bind(this));
    };

    /**
     * Handle a login error
     * Show a red warning box in the UI with the
     * error message
     * @param error - error returned from Firebase
     */
    $scope.handleLoginError = function (error) {

        // The login failed - display a message to the user
        $scope.hideNotification();

        var message = "An unknown error occurred";

        if (error.code == 'AUTHENTICATION_DISABLED') {
            message = "This authentication method is currently disabled.";
        }
        if (error.code == 'EMAIL_TAKEN') {
            message = "Email address unavailable.";
        }
        if (error.code == 'INVALID_EMAIL') {
            message = "Please enter a valid email.";
        }
        if (error.code == 'INVALID_ORIGIN') {
            message = "Login is not available from this domain.";
        }
        if (error.code == 'INVALID_PASSWORD') {
            message = "Please enter a valid password.";
        }
        if (error.code == 'INVALID_USER') {
            message = "Invalid email or password.";
        }
        if (error.code == 'INVALID_USER') {
            message = "Invalid email or password.";
        }

        $scope.setError(message);

    };

    $scope.init();

}]);

myApp.controller('ChatController', ['$scope','$timeout', '$sce', 'Auth', 'Screen', 'RoomPositionManager', 'Log', 'Utils', 'ArrayUtils', 'Parse',
    function($scope, $timeout, $sce, Auth, Screen, RoomPositionManager, Log, Utils, ArrayUtils, Parse) {

    $scope.showEmojis = false;
    //$scope.headerColor = $scope.config.headerColor;
    $scope.loginIframeURL = $sce.trustAsResourceUrl('http://ccwp/social.html');

    $scope.init = function (room) {

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
        $scope.$on(bUserValueChangedNotification, function (event, user) {
            Log.notification(bUserValueChangedNotification, 'ChatController');
            if($scope.room.containsUser(user)) {
                digest();
            }
        });

        $scope.$on(bRoomPositionUpdatedNotification, function(event, room) {
            Log.notification(bRoomPositionUpdatedNotification, 'ChatController');
            if($scope.room == room) {
                // Update the room's active status
                digest();
            }
        });
        $scope.$on(bRoomSizeUpdatedNotification, function(event, room) {
            Log.notification(bRoomSizeUpdatedNotification, 'ChatController');
            if($scope.room == room) {
                digest();
            }
        });
        $scope.$on(bLazyLoadedMessagesNotification, function(event, room, callback) {
            Log.notification(bLazyLoadedMessagesNotification, 'ChatController');
            if($scope.room == room) {
                digest(callback);
            }
        });
        $scope.$on(bChatUpdatedNotification, function (event, room) {
            Log.notification(bChatUpdatedNotification, 'CreateRoomController');
            if($scope.room == room) {
                digest();
            }
        });
    };

    $scope.startImageUpload = function () {
        $scope.uploadingImage = true;
    };

    $scope.imageUploadFinished = function () {
        $scope.uploadingImage = false;
        $scope.sendingImage = false;
    };

    $scope.sendImageMessage = function($files, room) {

        var f = $files[0];
        if(!f || $scope.sendingImage) {
            this.imageUploadFinished();
            return;
        }

        $scope.sendingImage = true;

        if(f.type == "image/png" || f.type == 'image/jpeg') {

        }
        else {
            $scope.showNotification(bNotificationTypeAlert, 'File error', 'Only image files can be uploaded', 'ok');
            this.imageUploadFinished();
            return;
        }

        if($files.length > 0) {
            Parse.uploadFile(f).then((function(r) {
                if(r.data && r.data.url) {

                    var reader = new FileReader();

                    // Load the image into the canvas immediately to get the dimensions
                    reader.onload = (function() {
                        return function(e) {
                            var image = new Image();
                            image.onload = function () {
                                room.sendImageMessage($scope.getUser(), r.data.url, image.width, image.height);
                            };
                            image.src = e.target.result;
                        };
                    })(f);
                    reader.readAsDataURL(f);
                }
                this.imageUploadFinished();

            }).bind(this), (function (error) {
                $scope.showNotification(bNotificationTypeAlert, 'Image error', 'The image could not be sent', 'ok');
                this.imageUploadFinished();
            }).bind(this));
        }
    };

    $scope.getZIndex = function () {
       // Make sure windows further to the right have a higher index
       var z =  $scope.room.zIndex ? $scope.room.zIndex :  100 * (1 - $scope.room.offset/Screen.screenWidth);
       return parseInt(z);
    };

    $scope.sendMessage = function () {
        var user = $scope.getUser();

        $scope.showEmojis = false;

        $scope.room.sendMessage($scope.input.text, user, bMessageTypeText);
        $scope.input.text = "";
    };

    $scope.loadMoreMessages = function (callback) {
        $scope.room.loadMoreMessages(callback);
    };

    $scope.tabClicked = function (tab) {
        $scope.activeTab = tab;
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
        $scope.showEmojis = !$scope.showEmojis;
    };

    // Save the super class
    $scope.superShowProfileBox = $scope.showProfileBox;
    $scope.showProfileBox = function (uid) {

        $scope.superShowProfileBox(uid);

        // Work out the x position
        var x = $scope.room.offset + $scope.room.width;

        var facesLeft = true;
        if ($scope.room.offset + bProfileBoxWidth + $scope.room.width > Screen.screenWidth) {
            facesLeft = false;
            x = $scope.room.offset - bProfileBoxWidth;
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
        if($scope.room.offset < $scope.mainBoxWidth + bChatRoomSpacing) {
            $scope.room.setOffset($scope.mainBoxWidth + bChatRoomSpacing);
        }
        $scope.boxWasDragged = true;
    };

    $scope.getAllUsers = function () {
        return ArrayUtils.objectToArray($scope.room.getUsers());
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

myApp.controller('RoomListBoxController', ['$scope', '$rootScope', '$timeout', 'Auth', 'Cache', 'LocalStorage', 'RoomPositionManager', 'Log',
    function($scope, $rootScope, $timeout, Auth, Cache, LocalStorage, RoomPositionManager, Log) {

    $scope.rooms = [];
    $scope.moreChatsMinimized = true;
    $scope.roomBackgroundColor = '#FFF';

    $scope.init = function () {
        $scope.boxWidth = bRoomListBoxWidth;
        $scope.boxHeight = bRoomListBoxHeight;
        $scope.canCloseRoom = true;

        // Is the more box minimized?
        $scope.setMoreBoxMinimized(LocalStorage.getProperty(LocalStorage.moreMinimizedKey));

        // Update the list when a room changes
        $scope.$on(bUpdateRoomActiveStatusNotification, $scope.updateList);
        $scope.$on(bRoomUpdatedNotification, $scope.updateList);
        $scope.$on(bLogoutNotification, $scope.updateList);


    };

    $scope.updateList = function () {

        Log.notification(bUpdateRoomActiveStatusNotification, 'RoomListBoxController');

        $scope.rooms = Cache.inactiveRooms();

        // Sort rooms by the number of unread messages
        $scope.rooms.sort(function (a, b) {
            // First order by number of unread messages
            // Badge can be null
            var ab = a.badge ? a.badge : 0;
            var bb = b.badge ? b.badge : 0;

            if(ab != bb) {
                return bb - ab;
            }
            // Otherwise sort them by number of users
            else {
                return b.onlineUserCount - a.onlineUserCount;
            }
        });

        $scope.moreChatsMinimized = $scope.rooms.length == 0;

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.roomClicked = function(room) {

        // Get the left most room
        var rooms = RoomPositionManager.getRooms();

        // Get the last box that's active
        for(var i = rooms.length - 1; i >= 0; i--) {
            if(rooms[i].active) {

                // Get the details of the final room
                var offset = rooms[i].offset;
                var width = rooms[i].width;
                var height = rooms[i].height;
                var slot = rooms[i].slot;

                // Update the old room with the position of the new room
                rooms[i].setOffset(room.offset);
                rooms[i].width = room.width;
                rooms[i].height = room.height;
                //rooms[i].active = false;
                rooms[i].setActive(false);
                rooms[i].slot = room.slot;

                // Update the new room
                room.setOffset(offset);
                room.width = width;
                room.height = height;
                //room.setSizeToDefault();
                room.setActive(true);
                room.badge = null;
                room.minimized = false;
                room.slot = slot;

//                RoomPositionManager.setDirty();
//                RoomPositionManager.updateRoomPositions(room, 0);
//                RoomPositionManager.updateAllRoomActiveStatus();

                break;
            }
        }
        $rootScope.$broadcast(bUpdateRoomActiveStatusNotification);

    };

    $scope.minimize = function () {
        $scope.setMoreBoxMinimized(true);
    };

    $scope.toggle = function () {
        $scope.setMoreBoxMinimized(!$scope.hideRoomList);
    };

    $scope.setMoreBoxMinimized = function (minimized) {
        $scope.hideRoomList = minimized;
        LocalStorage.setProperty(LocalStorage.moreMinimizedKey, minimized);
    };

    $scope.init();

}]);

myApp.controller('CreateRoomController', ['$scope', '$timeout', 'Auth', 'Room', 'Log', 'RoomOpenQueue',
    function($scope, $timeout, Auth, Room, Log, RoomOpenQueue) {

        $scope.public = false;

        $scope.init = function () {
            $scope.clearForm();

            $scope.$on(bShowCreateChatBox, function () {
                Log.notification(bShowCreateChatBox, 'CreateRoomController');
                $scope.focusName = true;
            });

        };

        $scope.createRoom  = function () {

            var promise;

            // Is this a public room?
            if($scope.public) {
                promise = Room.createPublicRoom(
                    $scope.room.name,
                    $scope.room.description
                );
            }
            else {
                promise = Room.createRoom(
                    $scope.room.name,
                    $scope.room.description,
                    $scope.room.invitesEnabled,
                    bRoomType1to1
                );
            }

            promise.then(function (rid) {
                RoomOpenQueue.addRoomWithID(rid);

//                var room = RoomStore.getOrCreateRoomWithID(rid);
//                room.on().then(function () {
//                    room.open(0, 300);
//                });
            });

            $scope.back();
        };

        $scope.back  = function () {
            $scope.clearForm();
            $scope.showMainBox();
        };

        $scope.clearForm = function () {
            $scope.room = {
                invitesEnabled: false,
                name: null,
                description: null
            };
        };

        $scope.init();

}]);

myApp.controller('PublicRoomsListController', ['$scope', '$timeout', 'Log', 'ArrayUtils', 'Utils', function($scope, $timeout, Log, ArrayUtils, Utils) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(bPublicRoomAddedNotification, (function (event, room) {
            Log.notification(bPublicRoomAddedNotification, 'PublicRoomsListController');
            // Add the room and sort the list
            if(!ArrayUtils.contains($scope.allRooms, room)) {
                $scope.allRooms.push(room);
            }
            $scope.updateList();

        }).bind(this));

        $scope.$on(bPublicRoomRemovedNotification, function (event, room) {
            Log.notification(bPublicRoomRemovedNotification, 'PublicRoomsListController');

            ArrayUtils.remove($scope.allRooms, room);
            $scope.updateList();

        });

        // Update the list if the user count on a room changes
        $scope.$on(bRoomUpdatedNotification, $scope.updateList);

        $scope.$on(bLogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);
    };


    $scope.updateList = function () {

        Log.notification(bLogoutNotification, 'PublicRoomsListController');

        $scope.allRooms.sort(function(a, b) {

            var au = Utils.unORNull(a.meta.userCreated) ? false : a.meta.userCreated;
            var bu = Utils.unORNull(b.meta.userCreated) ? false : b.meta.userCreated;

            if(au != bu) {
                return au ? 1 : -1;
            }

            // Weight
            var aw = Utils.unORNull(a.meta.weight) ? 100 : a.meta.weight;
            var bw = Utils.unORNull(b.meta.weight) ? 100 : b.meta.weight;

            if(aw != bw) {
                return aw - bw;
            }
            else {

                var ac = a.getOnlineUserCount();
                var bc = b.getOnlineUserCount();

                //console.log("1: " + ac + ", 2: " + bc);

                if(ac != bc) {
                    return bc - ac;
                }
                else {
                    return a.name < b.name ? -1 : 1;
                }
            }

        });

        $scope.rooms = ArrayUtils.filterByKey($scope.allRooms, $scope.search[$scope.activeTab], function (room) {
            return room.meta.name;
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

//    $scope.getRooms = function() {
//        // Filter rooms by search text
//        return Utilities.filterByName(Cache.getPublicRooms(), $scope.search[$scope.activeTab]);
//    };

    $scope.init();

}]);

myApp.controller('InboxRoomsListController', ['$scope', '$timeout', 'Log', 'RoomStore', 'ArrayUtils', function($scope, $timeout, Log, RoomStore, ArrayUtils) {

    $scope.rooms = [];
    $scope.allRooms = [];

    $scope.init = function () {

        $scope.$on(bRoomAddedNotification, (function () {
            Log.notification(bRoomAddedNotification, 'InboxRoomsListController');
            $scope.updateList();

        }).bind(this));

        $scope.$on(bRoomRemovedNotification, function () {
            Log.notification(bRoomRemovedNotification, 'InboxRoomsListController');
            $scope.updateList();
        });

        $scope.$on(bLoginCompleteNotification, function () {
            Log.notification(bLoginCompleteNotification, 'InboxRoomsListController');
            RoomStore.loadPrivateRoomsToMemory();
            $scope.updateList();
        });

        // Update the list if the user count on a room changes
        $scope.$on(bRoomUpdatedNotification, $scope.updateList);

        $scope.$on(bLogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        $scope.allRooms = RoomStore.getPrivateRooms();

        $scope.allRooms = ArrayUtils.roomsSortedByMostRecent($scope.allRooms);

        $scope.rooms = ArrayUtils.filterByKey($scope.allRooms, $scope.search[$scope.activeTab], function (room) {
            return room.meta.name;
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.init();

}]);

myApp.controller('OnlineUsersListController', ['$scope', '$timeout', 'Log', 'ArrayUtils', 'OnlineConnector', function($scope, $timeout, Log, ArrayUtils, OnlineConnector) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(bOnlineUserAddedNotification, (function () {
            Log.notification(bOnlineUserAddedNotification, 'OnlineUsersListController');
            $scope.updateList();

        }).bind(this));

        $scope.$on(bOnlineUserRemovedNotification, function () {
            Log.notification(bOnlineUserRemovedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bUserBlockedNotification, function () {
            Log.notification(bUserBlockedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bUserUnblockedNotification, function () {
            Log.notification(bUserUnblockedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bFriendAddedNotification, function () {
            Log.notification(bFriendAddedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bFriendRemovedNotification, function () {
            Log.notification(bFriendAddedNotification, 'OnlineUsersListController');
            $scope.updateList();
        });

        $scope.$on(bLogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        // Filter online users to remove users that are blocking us
        $scope.allUsers = ArrayUtils.objectToArray(OnlineConnector.onlineUsers);
        $scope.users = ArrayUtils.filterByKey($scope.allUsers, $scope.search[$scope.activeTab], function (user) {
            return user.meta.name;
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.init();

}]);

myApp.controller('UserListController', ['$scope', '$timeout', 'OnlineConnector', 'ArrayUtils', 'Log', function($scope, $timeout, OnlineConnector, ArrayUtils, Log) {

    $scope.users = [];
    $scope.allUsers = [];

    $scope.init = function () {

        $scope.$on(bFriendAddedNotification, function () {
            Log.notification(bFriendAddedNotification, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(bFriendRemovedNotification, function () {
            Log.notification(bFriendAddedNotification, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(bUserBlockedNotification, function () {
            Log.notification(bUserBlockedNotification, 'UserListController');
            $scope.updateList();
        });

        $scope.$on(bUserUnblockedNotification, function () {
            Log.notification(bUserUnblockedNotification, 'UserListController');
            $scope.updateList();
        });

        // TODO: A bit hacky
        $scope.$on(bRoomUpdatedNotification, function (event, room) {
            Log.notification(bRoomUpdatedNotification, 'UserListController');
            if(room == $scope.room) {
                $scope.updateList();
            }
        });

        $scope.$on(bLogoutNotification, $scope.updateList);

        $scope.$watchCollection('search', $scope.updateList);

    };

    $scope.updateList = function () {

        // Filter online users to remove users that are blocking us
        $scope.allUsers = $scope.getAllUsers();

        if($scope.searchKeyword()) {
            $scope.users = ArrayUtils.filterByKey($scope.allUsers, $scope.searchKeyword(), function (user) {
                return user.meta.name;
            });
        }
        else {
            $scope.users = $scope.allUsers;
        }

        // Sort the array first by who's online
        // then alphabetically
        $scope.users.sort(function (a, b) {
            // Sort by who's online first then alphabetcially
            var aOnline = OnlineConnector.onlineUsers[a.meta.uid];
            var bOnline = OnlineConnector.onlineUsers[b.meta.uid];

            if(aOnline != bOnline) {
                return aOnline ? 1 : -1;
            }
            else {
                if(a.meta.name != b.meta.name) {
                    return a.meta.name > b.meta.name ? 1 : -1;
                }
                return 0;
            }
        });

        $timeout(function(){
            $scope.$digest();
        });
    };

    $scope.init();

}]);

myApp.controller('ProfileSettingsController', ['$scope', 'Auth', 'Config', 'SoundEffects', 'Log', 'LocalStorage', 'Paths',
    function($scope, Auth, Config, SoundEffects, Log, LocalStorage, Paths) {

    $scope.ref = null;
    $scope.muted = false;
    $scope.nameChangeDummy = null;
    $scope.dirty = false;

    $scope.init = function () {

        // Listen for validation errors
        $scope.muted = SoundEffects.muted;

        $scope.validation = {
            name: {
                minChars: 2,
                maxChars: 50,
                valid: true
            },
            city: {
                minChars: 2,
                maxChars: 50,
                valid: true
            },
            profileLink: {
                minChars: 0,
                maxChars: 100,
                valid: true
            }
        };

        $scope.$watchCollection('user.meta', function () {
            $scope.dirty = true;
        });

        // When the box will be opened we need to add a listener to the
        // user
        $scope.$on(bShowProfileSettingsBox, (function () {

            Log.notification(bShowProfileSettingsBox, 'ProfileSettingsController');

            // Remove the previous listener
            if($scope.ref) {
                $scope.ref.off('value');
            }

            if($scope.getUser() && $scope.getUser().meta && $scope.getUser().meta.uid) {

                // Create a firebase ref to the user
                $scope.ref = Paths.userMetaRef($scope.getUser().meta.uid);

                $scope.ref.on('value', function (snapshot) {

                    $scope.validate();

                    // This is a method created by the directive...
                    $scope.setDateOfBirth(snapshot.val().dateOfBirth);

                }, function (error) {
                    if(DEBUG) console.log(error);
                });

            }

        }).bind(this));
    };

    $scope.toggleMuted = function () {
        $scope.muted = SoundEffects.toggleMuted();
    };

    $scope.clearCache = function () {
        if(!$scope.cacheCleared) {
            LocalStorage.clearCache();
        }
        $scope.cacheCleared = true;
    };

    $scope.isValidURL = function(url) {// wrapped in self calling function to prevent global pollution

        //URL pattern based on rfc1738 and rfc3986
        var rg_pctEncoded = "%[0-9a-fA-F]{2}";
        var rg_protocol = "(http|https):\\/\\/";

        var rg_userinfo = "([a-zA-Z0-9$\\-_.+!*'(),;:&=]|" + rg_pctEncoded + ")+" + "@";

        var rg_decOctet = "(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])"; // 0-255
        var rg_ipv4address = "(" + rg_decOctet + "(\\." + rg_decOctet + "){3}" + ")";
        var rg_hostname = "([a-zA-Z0-9\\-\\u00C0-\\u017F]+\\.)+([a-zA-Z]{2,})";
        var rg_port = "[0-9]+";

        var rg_hostport = "(" + rg_ipv4address + "|localhost|" + rg_hostname + ")(:" + rg_port + ")?";

        // chars sets
        // safe           = "$" | "-" | "_" | "." | "+"
        // extra          = "!" | "*" | "'" | "(" | ")" | ","
        // hsegment       = *[ alpha | digit | safe | extra | ";" | ":" | "@" | "&" | "=" | escape ]
        var rg_pchar = "a-zA-Z0-9$\\-_.+!*'(),;:@&=";
        var rg_segment = "([" + rg_pchar + "]|" + rg_pctEncoded + ")*";

        var rg_path = rg_segment + "(\\/" + rg_segment + ")*";
        var rg_query = "\\?" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";
        var rg_fragment = "\\#" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";

        var rgHttpUrl = new RegExp(
            "^"
            + rg_protocol
            + "(" + rg_userinfo + ")?"
            + rg_hostport
            + "(\\/"
            + "(" + rg_path + ")?"
            + "(" + rg_query + ")?"
            + "(" + rg_fragment + ")?"
            + ")?"
            + "$"
        );

        // export public function
        if (rgHttpUrl.test(url)) {
            return true;
        } else {
            return false;
        }
    };

    $scope.validate = function () {

        var meta = $scope.getUser().meta;

        // Validate the user
        var nameValid = meta.name && meta.name.length >= $scope.validation.name.minChars && meta.name.length <= $scope.validation.name.maxChars;
        $scope.validation.name.valid = nameValid;

        var cityValid = meta.city && meta.city.length >= $scope.validation.city.minChars && meta.city.length <= $scope.validation.city.maxChars;
        $scope.validation.city.valid = cityValid;

        var profileLinkValid = meta.profileLink && meta.profileLink.length >= $scope.validation.profileLink.minChars && meta.profileLink.length <= $scope.validation.profileLink.maxChars;
        profileLinkValid = $scope.isValidURL(meta.profileLink) || !meta.profileLink.length;

        $scope.validation.profileLink.valid = profileLinkValid;

        var dateOfBirthValid = meta.dateOfBirth;
        $scope.validation.dateOfBirth = dateOfBirthValid;

        return nameValid && cityValid && dateOfBirthValid && profileLinkValid;

    };

    /**
     * This is called when the user confirms changes to their user
     * profile
     */
    $scope.done = function () {

        var dob = $scope.dateOfBirth;

        $scope.user.meta.dateOfBirth = dob ? dob.getTime() : null;
        $scope.user.meta.yearOfBirth = dob ? dob.getFullYear() : $scope.user.meta.yearOfBirth;

        // Is the name valid?
        if($scope.validate()) {
            $scope.showMainBox();
            $scope.ref.off('value');
            $scope.ref = null;


            // Did the user update any values?
            if($scope.dirty) {
                $scope.user.pushMeta();
                $scope.dirty = false;
            }
        }
        else {
            if(!$scope.validation.name.valid) {
                $scope.showNotification(bNotificationTypeAlert, "Validation failed", "The name must be between "+$scope.validation.name.minChars+" - "+$scope.validation.name.maxChars+" characters long ", "Ok");
            }
            if(!$scope.validation.city.valid) {
                $scope.showNotification(bNotificationTypeAlert, "Validation failed", "The city must be between "+$scope.validation.city.minChars+" - "+$scope.validation.city.maxChars+" characters long", "Ok");
            }
            if(!$scope.validation.dateOfBirth.valid) {
                $scope.showNotification(bNotificationTypeAlert, "Validation failed", "The date of birth must be set", "Ok");
            }
            if(!$scope.validation.profileLink.valid) {
                $scope.showNotification(bNotificationTypeAlert, "Validation failed", "The profile link must be a valid URL", "Ok");
            }
        }
    };

    $scope.init();

}]);

var bNotificationTypeWaiting = 'waiting';
var bNotificationTypeAlert = 'alert';

myApp.controller('NotificationController', ['$scope', function($scope) {

    $scope.submit = function () {
        $scope.notification.show = false;
    };
}]);

myApp.controller('DraggableUserController', ['$scope', function($scope) {
    $scope.init = function () {

    }
    $scope.init();
}]);

myApp.controller('ChatSettingsController', ['$scope', function($scope) {

    $scope.saveTranscript = function () {

        var t = $scope.room.transcript();

        if(DEBUG) console.log(t);

        saveAs(new Blob([t], {type: "text/plain;charset=utf-8"}), $scope.room.name + "-transcript.txt");

    };

    $scope.copyTranscript = function () {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", $scope.room.transcript());
    };


}]);

myApp.controller('EmojiController', ['$scope', 'Emojis', function($scope, Emojis) {

    $scope.init = function () {
        // Get a list of the emoji
        $scope.emojis = Emojis.getEmojis();
    };

    $scope.addEmoji = function (e) {
        if(!$scope.input.text) {
            $scope.input.text = "";
        }
        $scope.input.text += e;
    };

    $scope.init();

}]);

myApp.controller('UserProfileBoxController', ['$scope', function($scope) {

    $scope.copyUserID = function () {

        // Get the ID
        var id = $scope.currentUser.meta.uid;

        window.prompt("Copy to clipboard: Ctrl+C, Enter", id);
    };

}]);

myApp.controller('ErrorBoxController', ['$scope', function($scope) {


}]);