'use strict';

/* Controllers */

var myApp = angular.module('myApp.controllers', ['firebase', 'angularFileUpload', 'ngSanitize', 'emoji']);

myApp.controller('AppController', [
    '$rootScope', '$scope','$timeout', '$window', '$sce', '$firebase', '$upload', 'Auth', 'Cache','$document','Rooms', 'Presence', 'CookieTin', 'Room', 'Config', 'Parse',
    function($rootScope, $scope, $timeout, $window, $sce, $firebase, $upload, Auth, Cache, $document, Rooms, Presence, CookieTin, Room, Config, Parse) {

    $scope.totalUserCount = 0;

    $scope.init = function () {


        // Show the waiting overlay
        $scope.notification = {
            show: false
        };

        if(CookieTin.isOffline()) {
            $scope.on = false;
            Presence.goOffline();
        }
        else {
            $scope.on = true;
        }

        $rootScope.baseURL = bPartialURL;
        $rootScope.websiteName = $window.location.host;

        // By default the main box isn't minimized
        //$scope.minimize = false;

        /**
         * Single Sign on
         */

        // Setup the login and register URLs
        var ssoURL = CC_OPTIONS.singleSignOnURL;
        $rootScope.singleSignOnEnabled = ssoURL && ssoURL.length > 0;

        if($rootScope.singleSignOnEnabled) {
            Paths.firebase().unauth();
        }


        var loginURL = CC_OPTIONS.loginURL;
        if(loginURL && loginURL.length > 0) {
            $rootScope.loginURL = loginURL;
        }

        var registerURL = CC_OPTIONS.registerURL;
        if(registerURL && registerURL.length > 0) {
            $rootScope.registerURL = registerURL;
        }

        /**
         * Anonymous login and social login
         */

        // Set the config object that contains settings for the chat
        Config.setConfig(Config.setByInclude, CC_OPTIONS);

        $scope.setupImages();

        $scope.setMainBoxMinimized(CookieTin.getProperty(CookieTin.mainMinimizedKey));

        $scope.$on(bUserOnlineStateChangedNotification, function () {
            $scope.updateTotalUserCount();
            $timeout(function () {
                $scope.$digest();
            });
        });

    };

    $scope.playAlert1 = function () {

    }

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
    }

    $scope.getUser = function () {
        return $rootScope.user;
    };

    /**
     * Show the login box
     */
    $scope.showLoginBox = function () {
        $scope.activeBox = 'loginBox';
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
        $scope.activeBox = 'mainBox';
    };

    /**
     * Show the create public room box
     */
    $scope.showCreateRoomBox = function () {
        $scope.activeBox = 'createRoomBox';
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
        CookieTin.setProperty(minimized, CookieTin.mainMinimizedKey);
    }

    /**
     * Return a list of all the user's current
     * rooms active or not
     */
//    $scope.getAllRooms = function () {
//        return Layout.getAllRooms();
//    };

    /**
     * Get a list of the user's rooms filtered
     * by whether they're active
     */
//    $scope.getRooms = function (active) {
//        return Layout.getRooms(active);
//    };

    $scope.saveRoomSlotToUser = function (room) {
        $scope.getUser().updateRoomSlot(room, room.slot);
    };

    /**
     * Should the room list box be shown?
     * @return yes if non-zero number of inactive rooms
     */
    // TODO: Why does it make a warning?
    $scope.showRoomListBox = function () {
        return Rooms.inactiveRooms().length > 0;
    };

    /**
     * Show the floating profile box
     * when the user's mouse leaves the box
     * we wait a small amount of time before
     * hiding the box - this gives the mouse
     * time to go from the list to inside the
     * box before the box disappears
     */
    $scope.showProfileBox = function (uid, duration) {

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
            $scope.currentUser = Cache.getUserWithID(uid);
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
        if(user) {
            return !unORNull(Cache.friends[user.meta.uid]);
        }
        return false;
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
            return !unORNull(Cache.blockedUsers[user.meta.uid]);
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
        if(user) {
            return !unORNull(Cache.onlineUsers[user.meta.uid]);
        }
        return false;
    };

    /**
     * @return number of online users
     */
    $scope.updateTotalUserCount = function () {
        var i = 0;
        for(var key in Cache.onlineUsers) {
            if(Cache.onlineUsers.hasOwnProperty(key)) {
                i++;
            }
        }
        $scope.totalUserCount = i;
    };

    $scope.userClicked = function (user) {

        // Is the user blocked?
        if(user.blocked) {
            $scope.getUser().unblockUser(user);
        }
        else if (user.online) {
            var room = Room.newRoom(null, true, null, true);

            room.create([user]).then(function () {
                if (DEBUG) console.log("Room Created: " + room.meta.name);
            });

        }
        else if(user.blockingMe) {
        }
    };


    /**
     * Log the user out
     */
    $scope.logout = function () {

        // This will be handled by the logout listener anyway
        Paths.firebase().unauth();

        $scope.showLoginBox();
    };

    $scope.shutdown = function ($event) {

        if (typeof $event.stopPropagation != "undefined") {
            $event.stopPropagation();
        } else {
            $event.cancelBubble = true;
        }

        $scope.on = !$scope.on;
        if($scope.on) {
            CookieTin.setOffline(false);
            Presence.goOnline();
        }
        else {
            Presence.goOffline();
            CookieTin.setOffline(true);
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

        if(f.type == "image/png" || f.type == 'image/jpeg') {

        }
        else {
            $scope.showNotification(bNotificationTypeAlert, 'File error', 'Only image files can be uploaded', 'ok');
            return;
        }

        if($files.length > 0) {
            Parse.uploadFile($files[0]).then((function(r) {

                if(r.data && r.data.url) {

                    $scope.getUser().setImage(r.data.url, true);
                    $scope.getUser().setThumbnail(r.data.url, true);
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

                    //thumbnailer(canvas, image, 100, 3);

                    if (width > height) {
                        x = (width - height)/2;

                    } else {
                        y = (height - width)/2;
                    }

                    var size = width - 2 * x;

                    // First rescale the image to be square
                    canvas.width = max_size;
                    canvas.height = max_size;
                    canvas.getContext('2d').drawImage(image, x, y, width - 2 * x, height - 2 * y, 0, 0, max_size, max_size);

                    var imageDataURL = canvas.toDataURL('image/jpeg');

                    // Set the user's thumbnail
                    var thumb_size = 30;

                    canvas.width = thumb_size;
                    canvas.height = thumb_size;
                    canvas.getContext('2d').drawImage(image, x, y, width - 2 * x, height - 2 * y, 0, 0, thumb_size, thumb_size);

                    var thumbnailDataURL = canvas.toDataURL('image/jpeg');

                    // Set the user's image
                    $scope.$apply(function () {
                        $scope.getUser().setImage(imageDataURL, false);
                        $scope.getUser().setThumbnail(thumbnailDataURL, false);
                    });

                };
                image.src = e.target.result;
            };
        })(f);

        reader.readAsDataURL(f);

        return;


        //$files: an array of files selected, each file has name, size, and type.
//        for (var i = 0; i < $files.length; i++) {
//            var file = $files[i];
//            $scope.upload = $upload.upload({
//                url: 'server/upload.php', //upload.php script, node.js route, or servlet url
//                // method: 'POST' or 'PUT',
//                // headers: {'header-key': 'header-value'},
//                // withCredentials: true,
//                //data: {myObj: $scope.myModelObj},
//                file: file // or list of files: $files for html5 only
//                /* set the file formData name ('Content-Desposition'). Default is 'file' */
//                //fileFormDataName: myFile, //or a list of names for multiple files (html5).
//                /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
//                //formDataAppender: function(formData, key, val){}
//            }).progress(function(evt) {
//
//                if(DEBUG)
//                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
//
//                $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
//
//                if($scope.uploadProgress == 100) {
//                    $timeout(function () {
//                        $scope.uploadingFile = false;
//                        $scope.uploadProgress = 0;
//                    }, 1000);
//                }
//
//            }).success(function(data, status, headers, config) {
//
//                if(data.fileName) {
//                    $scope.getUser().setImageName(data.fileName);
//                }
//
//            }).error(function () {
//                $scope.uploadingFile = false;
//            });
//            //.error(...)
//            //.then(success, error, progress);
//            //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
//        }
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
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
    };

    $scope.init();

}]);

myApp.controller('ChatBarController', ['$scope', '$timeout', 'Rooms', 'RoomPositionManager', function($scope, $timeout, Rooms, RoomPositionManager) {

    $scope.rooms = [];

    $scope.init = function () {

        $scope.$on(bRoomAddedNotification, function (event, room) {
            $scope.updateList();
        });

        $scope.$on(bRoomRemovedNotification, function (event, room) {
            $scope.updateList();
        });

        $scope.$on(bUpdateRoomActiveStatusNotification, function (event, room) {
            $timeout(function () {
                $scope.$digest();
            });
        });

    };

    $scope.updateList = function () {

        // Only include rooms that are active
        $scope.rooms = Rooms.activeRooms();

        $timeout(function () {
            $scope.$digest();
        });
    };

    $scope.init();

}]);

myApp.controller('MainBoxController', ['$scope', '$timeout', 'Auth', 'Cache', 'Utilities', 'Config', 'Screen', function($scope, $timeout, Auth, Cache, Utilities, Config, Screen) {

    $scope.init = function () {

        // Setup the search variable - if we don't do this
        // Angular can't set search.text
        $scope.search = {};
        $scope.search[bUsersTab] = "";
        $scope.search[bRoomsTab] = "";
        $scope.search[bFriendsTab] = "";

        // Make the users tab start clicked
        $scope.tabClicked(bUsersTab);

        // This is used by sub views for their layouts
        $scope.boxWidth = bMainBoxWidth;

        // We don't want people deleting rooms from this view
        $scope.canDeleteRoom = false;

        // When the user value changes update the user interface
        $scope.$on(bUserValueChangedNotification, function (user) {
            $timeout(function () {
                $scope.$digest();
            });
        });

        $scope.updateMainBoxSize();
        $scope.$on(bScreenSizeChangedNotification, function () {
            $scope.updateMainBoxSize();
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
    };

    /**
     * Return a list of users filtered by the search box
     * @return A list of users who's names meet the search text
     */
    $scope.getUsers = function () {

        // Filter online users to remove users that are blocking us
        var users = Cache.onlineUsers;

        return Utilities.filterByName(Cache.onlineUsers, $scope.search[$scope.activeTab]);
    };

    $scope.roomClicked = function (room) {
        // Messages on is called by when we add the room to the user
        room.join(bUserStatusMember);
    };

    $scope.init();
}]);

myApp.controller('LoginController', ['$rootScope', '$scope', '$timeout','Auth', 'Cache', 'API', 'Presence', 'SingleSignOn', 'Rooms',
    function($rootScope, $scope, $timeout, Auth, Cache, API, Presence, SingleSignOn, Rooms) {

    /**
     * Initialize the login controller
     * Add listeners to AngularFire login, logout and error broadcasts
     * Setup teh auth variable and try to authenticate
     */
    $scope.init = function () {

        // Show the notification to say we're authenticating
        $scope.showNotification(bNotificationTypeWaiting, "Authenticating");

        var ref = Paths.firebase();
        ref.onAuth(function(authData) {

            // Hide the waiting overlay
            $scope.hideNotification();

            if (authData) {
                // user authenticated with Firebase
                console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);

                if($rootScope.singleSignOnEnabled) {
                    Paths.firebase().unauth();
                    $scope.singleSignOn();
                }
                else {
                    // Login was successful so log the user in given their ID
                    $scope.handleUserLogin(authData);
                }

            } else {
                // This is called whenever the page loads
                if($rootScope.singleSignOnEnabled) {
                    // Try to authenticate
                    $scope.singleSignOn();
                }
                else {
                    $scope.logout();
                }

            }
        });
    };

    $scope.tries = 0;
    $scope.singleSignOn = function () {
        SingleSignOn.authenticate(CC_OPTIONS.singleSignOnURL).then((function (data) {

            // Authenticate with firebase using token
            Paths.firebase().auth(data.token, (function(error, result) {
                if (error) {

                    // If this is the first try then maybe the token has expired...
                    // invalidate the token and try again
                    if($scope.tries == 0) {
                        $scope.tries++;
                        // Invalidate the token and try again
                        SingleSignOn.invalidate();
                        $scope.singleSignOn();
                    }
                    else {
                        $scope.logout();
                    }

                } else {

                    $rootScope.auth = result.auth;
                    $rootScope.auth.provider = 'custom';
                    $rootScope.auth.thirdPartyData = data;

                    if(result) {
                        $scope.handleUserLogin($rootScope.auth, false);

                        console.log('Authenticated successfully with payload:', result.auth);
                        console.log('Auth expires at:', new Date(result.expires * 1000));
                    }
                    else {
                        $scope.logout();
                    }

                }
            }).bind(this));

            //$scope.logout();

        }).bind(this), function (error) {
            $scope.logout();
        });
    }

    $scope.setError = function (message) {
        $scope.showError = !unORNull(message);
        $scope.errorMessage = message;
    };

    /**
     *
     */
    $scope.logout = function () {

        // Try to unbind the user - we should have setup
        // this function when the user was created
        try {
            $scope.unbindUser();
        }
        catch (err) {
        }

        // Now we need to
        Presence.goOffline();

        //
        Presence.stop();

        // Nullify the user
        $rootScope.user = null;

        // Clear the cache down
        Cache.clear();
        Rooms.clear();

        // Allow the user to log back in
        $scope.showLoginBox();

        //
        $scope.hideNotification();

        $scope.email = "";
        $scope.password = "";

        try {
            Auth.removeListenersFromUser();
        }
        catch (error) {

        }
    };

    $scope.loginWithPassword = function () {
        $scope.login('password',{
            email:$scope.email,
            password:$scope.password,
            rememberMe: $scope.rememberMe}
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
        $scope.showNotification(bNotificationTypeWaiting, "Logging in");

        var handleResult = function (error, authData) {
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
                remember: "sessionOnly"
            });
        }
        else {
//            ref.authWithOAuthRedirect(method, handleResult,{
//                    remember: "sessionOnly",
//                    scope: "email,user_likes"
//            });

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

            ref.authWithOAuthPopup(method, handleResult, {
                remember: "sessionOnly",
                scope: scope
            });
        }
    };

    $scope.forgotPassword  = function (email) {

        $scope.auth.$sendPasswordResetEmail(email).then(function() {

            $scope.showNotification(bNotificationTypeAlert, "Email sent",
                "Instructions have been sent. Please check your Junk folder!", "ok");

            $scope.setError(null);

        }, function(error) {
            $scope.handleLoginError(error);
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

        $scope.auth.$createUser(email, password).then((function(user) {

            // Authenticate the user - creating the user doesn't
            // also authenticate it for some reason...
            Paths.firebase().auth(user.token);

            $scope.handleUserLogin(user, true);

        }).bind(this), function(error) {
            $scope.handleLoginError(error);
        });
    };

    /**
     * Bind the user to Firebase
     * Using the user's authentcation information create
     * a three way binding to the user property
     * @param {Obj} the User object from Firebase authentication
     */

    $scope.handleUserLogin = function (userData, firstLogin) {

        $scope.showNotification(bNotificationTypeWaiting, "Opening Chat...");

        API.getAPIDetails().then((function(api) {

            Paths.setCID(api.cid);

            // Get the number of chatters that are currently online
            Auth.numberOfChatters().then((function(number) {

                $scope.hideNotification();

                if(number >= api.max) {
                    alert("Sorry the chat server is full! Try again later");
                    this.logout();
                }
                else {

                    Auth.bindUser(userData).then(function() {
                        // We have the user's ID so we can get the user's object
                        if(firstLogin) {
                            $scope.showProfileSettingsBox();
                        }
                        else {
                            $scope.showMainBox();
                        }

                    }, function(error) {
                        $scope.showNotification(bNotificationTypeAlert, 'Login Error', error, 'Ok');
                    });
                }

            }).bind(this), function (error) {

                // We couldn't connect to Chatcat.io API
                // Next check to see if they specified an API key
                console.log(error);

                //alert(error);
                //$scope.showNotification(bNotificationTypeAlert, 'Login Error', error, 'Ok');
            });

        }).bind(this), function (error) {
            console.log(error);
            //alert(error);
            //$scope.showNotification(bNotificationTypeAlert, 'Login Error', error, 'Ok');
        });
    };

    /**
     * Handle a login error
     * Show a red warning box in the UI with the
     * error message
     * @param {Obj} the error returned from Firebase
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

myApp.controller('ChatController', ['$scope','$timeout', 'Auth', 'Screen', 'RoomPositionManager', function($scope, $timeout, Auth, Screen, RoomPositionManager) {

    $scope.init = function (room) {
        $scope.input = {};
        $scope.room = room;

        $scope.hideChat = false;

        $scope.tabClicked('messages');

        // The height of the bottom message input bar
        $scope.inputHeight = 26;

        var digest = function () {
            $timeout(function () {
                $scope.$digest();
            });
        };

        // When the user value changes update the user interface
        $scope.$on(bUserValueChangedNotification, function (event, user) {
            if($scope.room.containsUser(user)) {
                digest();
            }
        });

        $scope.$on(bRoomPositionUpdatedNotification, function(event, room) {
            if($scope.room == room) {
                // Update the room's active status
                digest();
            }
        });
        $scope.$on(bRoomSizeUpdatedNotification, function(event, room) {
            if($scope.room == room) {
                digest();
            }
        });

    };

    $scope.getZIndex = function () {
       // Make sure windows further to the right have a higher index
       var z =  $scope.room.zIndex ? $scope.room.zIndex :  100 * (1 - $scope.room.offset/Screen.screenWidth);
       return parseInt(z);
    };

    $scope.sendMessage = function () {
        var user = $scope.getUser();

        $scope.room.sendMessage($scope.input.text, user);


        $scope.input.text = "";

    };

    $scope.loadMoreMessages = function () {
        console.log("Load more messages");
    };

    $scope.tabClicked = function (tab) {
        $scope.activeTab = tab;
    };

    $scope.deleteRoom = function(room) {
        room.remove();
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
        $scope.room.setStatusForUser($scope.getUser(), bUserStatusMember);
    };

    $scope.minimize = function () {
        $scope.setMinimized(true);
    };

    $scope.setMinimized = function (minimized) {
        $scope.room.minimized = minimized;
        $scope.chatBoxStyle = minimized ? {height: 0} : {};
        RoomPositionManager.updateRoomPositions($scope.room);
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

    $scope.getUsers = function () {

        var users = $scope.room.getUsers();
        // Add the users to an array
        var array = [];
        for(var key in users) {
            if(users.hasOwnProperty(key)) {
                array.push(users[key]);
            }
        }
        // Sort the array
        array.sort(function (a, b) {
            a = unORNull(a.online) ? false : a.online;
            b = unORNull(b.online) ? false : b.online;

            if(a == b) {
                return 0;
            }
            else {
                return a == true ? -1 : 1;
            }
        });

        return array;
    };

    // Get the nearest allowable position for a chat room
//    $scope.nearestSlotToOffset = function (x) {
//        return Layout.nearestSlotToOffset(x);
//    };

    $scope.setTyping = function (typing) {
        if(typing) {
            $scope.room.startTyping($scope.getUser());
        }
        else {
            $scope.room.finishTyping($scope.getUser());
        }
    };

//    $scope.getTyping = function () {
//
//        var i = 0;
//        var name = null;
//        for(var key in $scope.room.typing) {
//            if($scope.room.typing.hasOwnProperty(key)) {
//                if(key == $scope.getUser().meta.uid) {
//                    continue;
//                }
//                name = $scope.room.typing[key];
//                i++;
//            }
//        }
//
//        var typing = null;
//        if (i == 1) {
//            typing = name + "...";
//        }
//        else if (i > 1) {
//            typing = i + "people typing";
//        }
//
//        return typing;
//    };

}]);

myApp.controller('RoomListBoxController', ['$scope', '$timeout', 'Auth', 'Rooms', 'CookieTin', 'RoomPositionManager',
    function($scope, $timeout, Auth, Rooms, CookieTin, RoomPositionManager) {

    $scope.rooms = [];

    $scope.init = function () {
        $scope.boxWidth = bRoomListBoxWidth;
        $scope.boxHeight = bRoomListBoxHeight;
        $scope.canDeleteRoom = true;

        // Is the more box minimized?
        $scope.setMoreBoxMinimized(CookieTin.getProperty(CookieTin.moreMinimizedKey));

        // Update the list when a room changes
        $scope.$on(bRoomUpdatedNotification, $scope.updateList);

    };

    $scope.updateList = function () {

        $scope.rooms = Rooms.inactiveRooms();

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
                return b.userCount - a.userCount;
            }
        });

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

                // Update the old room with the position of the new room
                rooms[i].setOffset(room.offset);
                rooms[i].width = room.width;
                rooms[i].height = room.height;
                //rooms[i].active = false;
                rooms[i].setActive(false);

                // Update the new room
                room.setOffset(offset);
                room.width = width;
                room.height = height;
                room.setActive(true);
                room.badge = null;
                room.minimized = false;

                break;
            }
        }
    };

    $scope.minimize = function () {
        $scope.setMoreBoxMinimized(true);
    };

    $scope.toggle = function () {
        $scope.setMoreBoxMinimized(!$scope.hideRoomList);
    };

    $scope.setMoreBoxMinimized = function (minimized) {
        $scope.hideRoomList = minimized;
        CookieTin.setProperty(minimized, CookieTin.moreMinimizedKey);
    }

    $scope.deleteRoom = function(room) {
        room.remove();
    };

    $scope.init();

}]);

myApp.controller('CreateRoomController', ['$scope', '$timeout', 'Auth', 'Room', function($scope, $timeout, Auth, Room) {

    $scope.init = function () {
        $scope.clearForm();

        $scope.$on(bShowCreateChatBox, function () {
            $scope.focusName = true;
        });

        $scope.$on(bChatUpdatedNotification, function (event, room) {
            if(room == $scope.room) {
                $timeout(function(){
                    $scope.$digest();
                });
            }
        })
    };

    $scope.createRoom  = function () {
        // Is this a public room?
        if($scope.public) {

            var room = Room.newRoom($scope.room.name, true, $scope.room.description, true, true);
            room.create();

        }
        else {
            var room = Room.newRoom(
                $scope.room.name,
                $scope.room.invitesEnabled,
                $scope.room.description,
                true
            );
            room.create();


        }
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

myApp.controller('PublicRoomsListController', ['$scope', '$timeout', 'Cache', 'Utilities', function($scope, $timeout, Cache, Utilities) {

    $scope.rooms = [];

    $scope.init = function () {

        $scope.$on(bPublicRoomAddedNotification, (function (event, room) {

            // Add the room and sort the list
            if(!CCArray.contains($scope.rooms, room)) {
                $scope.rooms.push(room);
            }
            $scope.updateList();

        }).bind(this));

        $scope.$on(bPublicRoomRemovedNotification, function (event, room) {

            CCArray.remove($scope.rooms, room);
            $scope.updateList();

        });

        $scope.$watchCollection('search', $scope.updateList);
    };


    $scope.updateList = function () {

        $scope.rooms.sort(function(a, b) {

            var au = unORNull(a.meta.userCreated) ? false : a.meta.userCreated;
            var bu = unORNull(b.meta.userCreated) ? false : b.meta.userCreated;

            if(au != bu) {
                return au ? 1 : -1;
            }

            // Weight
            var aw = unORNull(a.meta.weight) ? 100 : a.meta.weight;
            var bw = unORNull(b.meta.weight) ? 100 : b.meta.weight;

            if(aw != bw) {
                return aw - bw;
            }
            else {

                var ac = a.onlineUserCount();
                var bc = b.onlineUserCount();

                //console.log("1: " + ac + ", 2: " + bc);

                if(ac != bc) {
                    return bc - ac;
                }
                else {
                    return a.name < b.name ? -1 : 1;
                }
            }

        });

        $scope.rooms = CCArray.filterByKey($scope.rooms, $scope.search[$scope.activeTab], function (room) {
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

myApp.controller('FriendsListController', ['$scope', 'Cache', 'Utilities', function($scope, Cache, Utilities) {

    $scope.init = function (header) {
        $scope.sectionHeader = header;
    };

    $scope.getUsers = function() {

        // Filter rooms by search text
        var friends = Utilities.filterByName(Cache.friends, $scope.search.text);
        // Add the friends to an array
        var array = [];

        for(var key in friends) {
            if (friends.hasOwnProperty(key)) {
                array.push(friends[key]);
            }
        }

        // Sort the array first by who's online
        // then alphabetically
        array.sort(function (a, b) {
            // Sort by who's online first then alphabetcially
            var aOnline = Cache.onlineUsers[a.meta.uid];
            var bOnline = Cache.onlineUsers[b.meta.uid];

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

        // Filter by search term
        array = Utilities.filterByName(array, $scope.search[$scope.activeTab]);

        return array;
    };

}]);

myApp.controller('ProfileSettingsController', ['$scope', 'Auth', 'Config', function($scope, Auth, Config) {

    $scope.ref = null,

    $scope.init = function () {

        // Listen for validation errors

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
            }
        };

        // When the box will be opened we need to add a listener to the
        // user
        $scope.$on(bShowProfileSettingsBox, (function (event, args) {

            // Remove the previous listener
            if($scope.ref) {
                $scope.ref.off('value');
            }

            if($scope.getUser() && $scope.getUser().meta && $scope.getUser().meta.uid) {

                // Create a firebase ref to the user
                $scope.ref = Paths.userMetaRef($scope.getUser().meta.uid);

                $scope.ref.on('value', function (snapshot) {

                    $scope.validate();

                }, function (error) {
                    if(DEBUG) console.log(error);
                });

            }

        }).bind(this));
    };

    $scope.validate = function () {

        var meta = $scope.getUser().meta;

        // Validate the user
        var nameValid = meta.name && meta.name.length >= $scope.validation.name.minChars && meta.name.length <= $scope.validation.name.maxChars;
        $scope.validation.name.valid = nameValid;

        var cityValid = meta.city && meta.city.length >= $scope.validation.city.minChars && meta.city.length <= $scope.validation.city.maxChars;
        $scope.validation.city.valid = cityValid;

        return nameValid && cityValid;

    };

    /**
     * This is called when the user confirms changes to their user
     * profile
     */
    $scope.done = function () {

        // Is the name valid?
        if($scope.validate()) {
            $scope.showMainBox();
            $scope.ref.off('value');
            $scope.ref = null;
        }
        else {
            if(!$scope.validation.name.valid) {
                $scope.showNotification(bNotificationTypeAlert, "Validation failed", "The name must be between "+$scope.validation.name.minChars+" - "+$scope.validation.name.maxChars+" characters long ", "Ok");
            }
            if(!$scope.validation.city.valid) {
                $scope.showNotification(bNotificationTypeAlert, "Validation failed", "The city must be between "+$scope.validation.city.minChars+" - "+$scope.validation.city.maxChars+" characters long", "Ok");
            }
        }
    };

    $scope.disableUserNameChange = function () {
        return Config.disableUserNameChange;
    }

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

