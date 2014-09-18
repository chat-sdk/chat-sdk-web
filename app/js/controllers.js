'use strict';

/* Controllers */

var myApp = angular.module('myApp.controllers', ['firebase', 'angularFileUpload']);

myApp.controller('AppController', [
    '$rootScope', '$scope','$timeout', '$window', '$firebase', '$firebaseSimpleLogin', '$upload', 'Auth', 'Cache','$document','Layout', 'Presence',
    function($rootScope, $scope, $timeout, $window, $firebase, $firebaseSimpleLogin, $upload, Auth, Cache, $document, Layout, Presence) {

    $scope.init = function () {

        // Show the waiting overlay
        $scope.notification = {
            show: false
        };

        $scope.on = true;

        $rootScope.baseURL = ROOT + 'partials/'

        $rootScope.anonymousLoginDisabled = CC_OPTIONS.anonymousLoginDisabled;

    };

    $scope.getUser = function () {
        return Auth.getUser();
    };

    /**
     * Resize the main box in proportion to the window height
     * - this is called whenever the window size changes
     */

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
        $scope.minimize = !$scope.minimize;
    };

    $scope.minimizeMainBox = function () {
        $scope.minimize = true;
    };

    /**
     * Return a list of all the user's current
     * rooms active or not
     */
    $scope.getAllRooms = function () {
        return Layout.getAllRooms();
    };

    /**
     * Get a list of the user's rooms filtered
     * by whether they're active
     */
    $scope.getRooms = function (active) {
        return Layout.getRooms(active);
    };

    $scope.saveRoomSlotToUser = function (room) {
        $scope.getUser().updateRoomSlot(room, room.slot());
    };

    /**
     * Should the room list box be shown?
     * @return yes if non-zero number of inactive rooms
     */
    // TODO: Why does it make a warning?
    $scope.showRoomListBox = function () {
        var showListBox = ($scope.getRooms(false).length > 0);
        return showListBox;
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
    $scope.numberOfUsersOnline = function () {
        var i = 0;
        for(var key in Cache.onlineUsers) {
            if(Cache.onlineUsers.hasOwnProperty(key)) {
                i++;
            }
        }
        return i;
    };

    $scope.userClicked = function (user) {

        // Is the user blocked?
        if(user.blocked) {
            $scope.getUser().unblockUser(user);
        }
        else if (user.online) {
            Auth.createPrivateRoom([user], {invitesEnabled: true}).then(function(room) {
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
        $scope.auth.$logout();

        $scope.showLoginBox();
    };

    $scope.shutdown = function () {
        $scope.on = !$scope.on;
        if($scope.on) {
            Presence.goOnline();
        }
        else {
            Presence.goOffline();
        }
    };

    $scope.shutdownImage = function () {
        if($scope.on) {
            return 'cc-30-shutdown.png';
        }
        else {
            return 'cc-30-shutdown_on.png';
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

        var reader = new FileReader();

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

                    var dataURL = canvas.toDataURL('image/jpeg');

                    $scope.getUser().setImage(dataURL);
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

myApp.controller('MainBoxController', ['$scope', 'Auth', 'Cache', 'Utilities', function($scope, Auth, Cache, Utilities) {

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

        // Can the user create a new public chat room?
        $scope.roomCreationEnabled = CC_OPTIONS.usersCanCreatePublicRooms;

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
        Auth.joinRoom(room, bUserStatusMember);
    };

    $scope.init();
}]);

myApp.controller('LoginController', ['$rootScope', '$scope','Auth', 'Cache', '$firebaseSimpleLogin', 'API', 'Presence',
    function($rootScope, $scope, Auth, Cache, $firebaseSimpleLogin, API, Presence) {

    /**
     * Initialize the login controller
     * Add listeners to AngularFire login, logout and error broadcasts
     * Setup teh auth variable and try to authenticate
     */
    $scope.init = function () {

        // Show the notification to say we're authenticating
        $scope.showNotification(bNotificationTypeWaiting, "Authenticating");

        // Add observers for AngularFire login events
        // When the user logs in
        $scope.$on('$firebaseSimpleLogin:login', function (e) {

            if(DEBUG) console.log("firebase simple login");

            // Login was successful so log the user in given their ID
            $scope.handleUserLogin($scope.auth.user);

            // Hide the waiting overlay
            //$scope.setOverlayHidden(true);
            $scope.hideNotification();
        });

        // When the user logs out
        $scope.$on('$firebaseSimpleLogin:logout', (function (e) {
            if(DEBUG) console.log("firebase simple logout");
            $scope.logout();
        }).bind(this));

        // When there's a login error
        $scope.$on('$firebaseSimpleLogin:error', (function (e) {
            if(DEBUG) console.log("firebase simple error");
            $scope.logout();
        }).bind(this));


        // Setup an AngularFire auth reference
        $rootScope.auth = $firebaseSimpleLogin(Paths.firebase());
    };

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

        $scope.auth.$login(method, options).then(function(user) {

            // TODO:  We currently handle this using an observer
            //$scope.handleUserLogin(user);

        }, function(error) {
            $scope.handleLoginError(error);
        });
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
    $scope.handleUserLogin = function (user, firstLogin) {

        $scope.showNotification(bNotificationTypeWaiting, "Opening Chat...");

        API.getAPIDetails().then((function(api) {

            Paths.setCID(api.cid);

            Auth.numberOfChatters().then((function(number) {

                $scope.hideNotification();

                if(number >= api.max) {
                    alert("Sorry the chat server is full! Try again later");
                    this.logout();
                }
                else {

                    Auth.bindUser(user).then(function() {
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
                alert(error);
                //$scope.showNotification(bNotificationTypeAlert, 'Login Error', error, 'Ok');
            });

        }).bind(this), function (error) {
            alert(error);
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

myApp.controller('ChatController', ['$scope','$timeout', 'Auth', 'Layout', function($scope, $timeout, Auth, Layout) {

    $scope.init = function (room) {
        $scope.input = {};
        $scope.room = room;

        $scope.hideChat = false;

        $scope.tabClicked('messages');

        // The height of the bottom message input bar
        $scope.inputHeight = 26;
    };

    $scope.getZIndex = function () {
       // Make sure windows further to the right have a higher index
       var z =  $scope.room.zIndex ? $scope.room.zIndex :  100 * (1 - $scope.room.offset/$scope.screenWidth);
       return parseInt(z);
    };

    $scope.sendMessage = function () {
        var user = Auth.getUser();

        $scope.room.sendMessage($scope.input.text, user);

        $scope.input.text = "";

    };

    $scope.tabClicked = function (tab) {
        $scope.activeTab = tab;
    };

    $scope.deleteRoom = function(room) {
        Auth.deleteRoom(room);
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
        if ($scope.room.offset + bProfileBoxWidth + $scope.room.width > $scope.screenWidth) {
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
        Layout.updateRoomPositions();
    };

    $scope.startDrag = function () {
        $scope.dragStarted = true;
        $scope.boxWasDragged = false;
    };

    $scope.wasDragged = function () {
        // We don't want the chat crossing the min point
        if($scope.room.offset < $scope.mainBoxWidth + bChatRoomSpacing) {
            $scope.room.offset = $scope.mainBoxWidth + bChatRoomSpacing;
        }
        $scope.boxWasDragged = true;
    };

    $scope.stopDrag = function () {
    };

    $scope.wasResized = function () {
        // Constrain the chat window
        $scope.room.width = Math.max(bChatRoomWidth, $scope.room.width);

        var screenWidth = Layout.showRoomListBox() ? $scope.screenWidth - bRoomListBoxWidth - bChatRoomSpacing : $scope.screenWidth;

        if($scope.room.width + $scope.room.offset >= screenWidth) {
            $scope.room.width = screenWidth - $scope.room.offset;
        }

        $scope.room.height = Math.max(bChatRoomHeight, $scope.room.height);

        if($scope.room.height > $scope.screenHeight - bChatRoomTopMargin) {
            $scope.room.height = $scope.screenHeight - bChatRoomTopMargin;
        }
    };

    $scope.nearestSlotToRoom = function (room) {
        return Layout.nearestSlotToRoom(room);
    };

    $scope.roomAtSlot = function (slot) {

        var rooms = Layout.roomsSortedByOffset();
        for(var i in rooms) {
            if(rooms.hasOwnProperty(i)) {
                // TODO: Workout exactly what this line does...
                // if I remove it, it stops working but I forget
                // why it's needed
                if(rooms[i] != $scope.room) {
                    if(slot == $scope.nearestSlotToOffset(rooms[i].offset)) {
                        return rooms[i];
                    }
                }
            }
        }
        return null;
    };

    $scope.getUsers = function () {
        var users = {};
        for(var key in $scope.room.users) {
            if($scope.room.users.hasOwnProperty(key)) {
                var user = $scope.room.users[key];
                if(user.meta.uid != $scope.getUser().meta.uid) {
                    users[user.meta.uid] = user;
                }
            }
        }
        return users;
    };

    // Get the nearest allowable position for a chat room
    $scope.nearestSlotToOffset = function (x) {
        return Layout.nearestSlotToOffset(x);
    };

    $scope.setTyping = function (typing) {
        if(typing) {
            $scope.room.startTyping($scope.getUser());
        }
        else {
            $scope.room.finishTyping($scope.getUser());
        }
    };

    $scope.getTyping = function () {
        var i = 0;
        var name = null;
        for(var key in $scope.room.typing) {
            if($scope.room.typing.hasOwnProperty(key)) {
                if(key == $scope.getUser().meta.uid) {
                    continue;
                }
                name = $scope.room.typing[key];
                i++;
            }
        }

        var typing = null;
        if (i == 1) {
            typing = name + "...";
        }
        else if (i > 1) {
            typing = i + "people typing";
        }

        return typing;
    };

}]);

myApp.controller('RoomListBoxController', ['$scope', 'Auth', 'Layout', function($scope, Auth, Layout) {

    $scope.init = function () {
        $scope.boxWidth = bRoomListBoxWidth;
        $scope.boxHeight = bRoomListBoxHeight;
        $scope.canDeleteRoom = true;
    };

    $scope.superGetRooms = $scope.getRooms;
    $scope.getRooms = function() {
        var rooms = $scope.superGetRooms(false);

        // Sort rooms by the number of unread messages
        rooms.sort(function (a, b) {
            // First order by number of unread messages
            // Badge can be null
            var ab = a.badge ? a.badge : 0;
            var bb = b.badge ? b.badge : 0;

            if(ab != bb) {
                return bb - ab;
            }
            // Otherwise sort them by number of users
            else {
                return b.userCount() - a.userCount();
            }
        });

        return rooms;
    };

    $scope.roomClicked = function(room) {

        // Get the left most room
        var rooms = Layout.roomsSortedByOffset();

        // Get the last box that's active
        for(var i = rooms.length - 1; i >= 0; i--) {
            if(rooms[i].active) {

                // Get the details of the final room
                var offset = rooms[i].offset;
                var width = rooms[i].width;
                var height = rooms[i].height;

                // Update the old room with the position of the new room
                rooms[i].offset = room.offset;
                rooms[i].width = room.width;
                rooms[i].height = room.height;
                rooms[i].active = false;

                // Update the new room
                room.offset = offset;
                room.width = width;
                room.height = height;
                room.activate();
                room.badge = null;
                room.minimized = false;

                break;
            }
        }
    };

    $scope.minimize = function () {
        $scope.hideRoomList = true;
    };

    $scope.toggle = function () {
        $scope.hideRoomList = !$scope.hideRoomList;
    };

    $scope.deleteRoom = function(room) {
        Auth.deleteRoom(room);
    };

    $scope.init();

}]);

myApp.controller('CreateRoomController', ['$scope', 'Auth', function($scope, Auth) {

    $scope.init = function () {
        $scope.clearForm();

        $scope.$on(bShowCreateChatBox, function () {
            $scope.focusName = true;
        });
    };

    $scope.createRoom  = function () {
        // Is this a public room?
        if($scope.public) {
            $scope.room.invitesEnabled = true;
            Auth.createPublicRoom($scope.room);
        }
        else {
            Auth.createPrivateRoom([], $scope.room);
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

myApp.controller('PublicRoomsListController', ['$scope', 'Cache', 'Utilities', function($scope, Cache, Utilities) {

    $scope.getRooms = function() {
        // Filter rooms by search text
        return Utilities.filterByName(Cache.getPublicRooms(), $scope.search[$scope.activeTab]);
    };

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
                return aOnline ? -1 : 1;
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

myApp.controller('ProfileSettingsController', ['$scope', 'Auth', function($scope, Auth) {

    $scope.ref = null,

    $scope.init = function () {

        // Listen for validation errors

        $scope.validation = {
            name: {
                minChars: 3,
                maxChars: 18,
                valid: true
            },
            city: {
                minChars: 3,
                maxChars: 18,
                valid: true
            }
        };

        // When the box will be opened we need to add a listener to the
        // user
        $scope.$on(bShowProfileSettingsBox, (function (event, args) {

            // Remove the previous listener
            if($scope.ref) {
                $scope.ref.off();
            }

            if(Auth.getUser() && Auth.getUser().meta && Auth.getUser().meta.uid) {

                // Create a firebase ref to the user
                $scope.ref = Paths.userMetaRef(Auth.getUser().meta.uid);

                $scope.ref.on('value', function (snapshot) {

                    $scope.validate();

                }, function (error) {
                    if(DEBUG) console.log(error);
                });

            }

        }).bind(this));
    };

    $scope.validate = function () {

        var meta = Auth.getUser().meta;

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
        }
        else {
            $scope.showNotification(bNotificationTypeAlert, "Validation failed", "Please check that all fields are valid", "Ok");
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

