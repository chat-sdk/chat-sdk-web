'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var myApp = angular.module('myApp.services', ['firebase', 'facebook']).
  value('version', '0.1');

myApp.config(['FacebookProvider', function(FacebookProvider) {
    // Set your appId through the setAppId method or
    // use the shortcut in the initialize method directly.
    FacebookProvider.init('735373466519297');
}]);

myApp.factory('Defines', [function (LocalStorage) {
    return {
        // Cloud Image
        cloudImageToken: 'skbb48',

        // Parse
        parseAPIKey: ''

    };
}]);

myApp.factory('SoundEffects', ['LocalStorage', function (LocalStorage) {
    return {

        messageRecievedSoundNumber: 1,
        muted: LocalStorage.isMuted(),

        messageReceived: function () {
            if(this.muted) {
                return;
            }
            if(this.messageRecievedSoundNumber == 1) {
                this.alert1();
            }
        },

        alert1: function () {
            var sound = new Howl({
                urls: [bAudioURL + 'alert_1.mp3']
            });
            sound.play();
        },

        toggleMuted: function () {
            this.muted = !this.muted;
            LocalStorage.setMuted(this.muted);
            return this.muted;
        }
    };
}]);

myApp.factory('Log', [function () {
    return {
        notification: function (notification, context) {
            if(DEBUG) {
                if(!context)
                    context = "";
                else
                    context = ", context: " + context;
                console.log("Notification: " + notification + context);
            }
        }
    };
}]);

myApp.factory('Partials', ['$http', '$templateCache', function ($http, $templateCache) {
    return {
        load: function (baseURL) {
            $http.get(bPartialURL + 'chat-room.html', {cache:$templateCache});
            $http.get(bPartialURL + 'chat-settings.html', {cache:$templateCache});
            $http.get(bPartialURL + 'countries-select.html', {cache:$templateCache});
            $http.get(bPartialURL + 'create-room-box.html', {cache:$templateCache});
            $http.get(bPartialURL + 'emojis.html', {cache:$templateCache});
            $http.get(bPartialURL + 'login-box.html', {cache:$templateCache});
            $http.get(bPartialURL + 'main-box.html', {cache:$templateCache});
            $http.get(bPartialURL + 'notification.html', {cache:$templateCache});
            $http.get(bPartialURL + 'profile-box.html', {cache:$templateCache});
            $http.get(bPartialURL + 'profile-settings-box.html', {cache:$templateCache});
            $http.get(bPartialURL + 'room-description.html', {cache:$templateCache});
            $http.get(bPartialURL + 'room-list.html', {cache:$templateCache});
            $http.get(bPartialURL + 'room-list-box.html', {cache:$templateCache});
            $http.get(bPartialURL + 'user-list.html', {cache:$templateCache});
            $http.get(bPartialURL + 'year-of-birth-select.html', {cache:$templateCache});
        }
    };
}]);

myApp.factory('Parse', ['$http', function ($http) {

    return {

        uploadFile: function (file) {

            var serverUrl = 'https://api.parse.com/1/files/' + file.name;
            return $http({
                method: "post",
                headers: {
                    "X-Parse-Application-Id": '4S0kgcgrnuZ9JNzCqyV4I5NXN6z0tdv1aF2fKmzl',
                    "X-Parse-REST-API-Key": '7SlPyi4eZHSPCuwtol0ftPu5wVfA0Bu6RVckQDRL',
                    "Content-Type": file.type
                },
                url: serverUrl,
                data: file,
                processData: false,
                contentType: false,
                async:  true
            });
        }
    };
}]);

myApp.factory('Stats', ['Paths', function (Paths) {

    return {

        recordLogin: function () {

            Paths.statsRef().child('login').transaction(function (value) {
                return value + 1;
            });

        }
    };
}]);



myApp.factory('Visibility', ['$rootScope', function ($rootScope) {

    var Visibility = {

        isHidden: false,
        uid: "Test",

        init: function () {
            document.addEventListener("visibilitychange", (this.changed).bind(this));
            document.addEventListener("webkitvisibilitychange", (this.changed).bind(this));
            document.addEventListener("mozvisibilitychange", (this.changed).bind(this));
            document.addEventListener("msvisibilitychange", (this.changed).bind(this));

            this.uid = new Date().getTime();

            return this;
        },

        changed: function (event) {
            this.isHidden = document.hidden || document.webkitHidden || document.mozHidden || document.msHidden;
            $rootScope.$broadcast(bVisibilityChangedNotification, this.isHidden);
        },

        getIsHidden: function () {
            return this.isHidden;
        }
    };

    return Visibility.init();
}]);

/**
 * The presence service handles the user's online / offline
 * status
 * We need to call visibility to make sure it's initilized
 */
myApp.factory('Presence', ['$rootScope', '$timeout', 'Visibility', 'Config', 'Cache', 'Paths', 'LocalStorage', 'BeforeUnload', '$q',
    function ($rootScope, $timeout, Visibility, Config, Cache, Paths, LocalStorage, BeforeUnload, $q) {
    var Presence = {

        user: null,
        inactiveTimerPromise: null,

        // This gets increased when we log on and decreased when we log off
        // it's a safeguard to make sure we can't increase the counter by
        // more than one
        //onlineCount: 0,

        init: function () {
            //this.onlineCount = LocalStorage.getProperty(LocalStorage.onlineCountKey);

            //BeforeUnload.addListener(this);

            return this;
        },

//        beforeUnload: function () {
//            //LocalStorage.setProperty(LocalStorage.onlineCountKey, this.onlineCount);
//            this.goOffline();
//        },

        // Initialize the visibility service
        start: function (user) {

            this.user = user;

            // Take the user online
            this.goOnline();

            $rootScope.$on(bVisibilityChangedNotification, (function (event, hidden) {


                if(this.inactiveTimerPromise) {
                    $timeout.cancel(this.inactiveTimerPromise);
                }

                if(!hidden) {

                    // If the user's clicked the screen then cancel the
                    // inactivity timer
                    this.goOnline();
                }
                else {
                    // If the user switches tabs and doesn't enter for
                    // 2 minutes take them offline
                    this.inactiveTimerPromise = $timeout((function () {
                        this.goOffline();
                    }).bind(this), 1000 * 60 * Config.inactivityTimeout);
                }
            }).bind(this));

        },

        stop: function () {
            this.user = null;
        },

        goOffline: function () {
            Firebase.goOffline();
//            this.onlineCounterMinusOne().then(function () {
//
//            });
        },

        goOnline: function () {
            Firebase.goOnline();
            //this.onlineCounterPlusOne();
            this.update();
        },

        update: function () {

            var deferred = $q.defer();

            if(this.user) {
                var uid = this.user.meta.uid;
                if (uid) {

                    if(Config.onlineUsersEnabled) {
                        var ref = Paths.onlineUserRef(uid);

                        ref.onDisconnect().remove();

                        ref.setWithPriority({
                            uid: uid,
                            time: Firebase.ServerValue.TIMESTAMP
                        }, this.user.meta.name, function (error) {
                            if(!error) {
                                deferred.resolve();
                            }
                            else {
                                deferred.reject(error);
                            }
                        });
                    }

                    // Also store this information on the user object
                    var userOnlineRef = Paths.userOnlineRef(uid);
                    userOnlineRef.set(true);
                    userOnlineRef.onDisconnect().set(false);

//                    // Update the user online counter
//                    var userCountRef = Paths.onlineUserCountRef();
//                    userCountRef.transaction(function (currentValue) {
//                        return (currentValue || 0) + 1;
//                    });
//                    userCountRef.onDisconnect().transaction(function (currentValue) {
//                        return Math.max(currentValue - 1, 0);
//                    });

                    var promises = [
                        deferred.promise
                    ];

                    // Go online for the public rooms
                    var rooms = Cache.rooms;
                    var room;
                    for(var i = 0; i < rooms.length; i++) {
                            // TRAFFIC
                            // If this is a public room we would have removed it when we logged off
                            // We need to set ourself as a member again
                            room = rooms[i];
                            if(room.isPublic())
                                promises.push(room.join(bUserStatusMember));

                    }

                    return $q.all(promises);
                }
            }
            deferred.resolve(null);
            return deferred.promise;
        }

//        onlineCounterPlusOne: function () {
//
//            var deferred = $q.defer();
//
//            if(this.onlineCount == 0) {
//                var ref = Paths.onlineUserCountRef();
//                ref.transaction((function(value) {
//                    deferred.resolve();
//                    this.onlineCount++;
//                    return value + 1;
//                }).bind(this));
//            }
//
//            return deferred.promise;
//        },
//
//        onlineCounterMinusOne: function () {
//
//            var deferred = $q.defer();
//
//            var ref = Paths.onlineUserCountRef();
//            ref.transaction((function(value) {
//                this.onlineCount--;
//                return Math.max(value - 1, 0);
//            }).bind(this), function () {
//                deferred.resolve();
//            });
//
//            return deferred.promise;
//        }
    };

    return Presence.init();
}]);

myApp.factory('Screen', ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage', function ($rootScope, $timeout, $document, $window, LocalStorage) {

    var screen = {

        //rooms: [],
        screenWidth: 0,
        screenHeight: 0,

        init: function () {

            // Set the screen width and height
            this.updateScreenSize();

            // Monitor the window size
            angular.element($window).bind('resize', (function () {
                this.updateScreenSize();
            }).bind(this));

            return this;
        },

        updateScreenSize: function () {
            this.screenWidth = $document.width();
            this.screenHeight = $window.innerHeight;

            $rootScope.$broadcast(bScreenSizeChangedNotification);
        }

    };
    return screen.init();
}]);

myApp.factory('Auth', ['$rootScope', '$timeout', '$http', '$q', '$firebase', 'Facebook', 'RoomStore', 'UserStore', 'Room', 'Presence', 'API', 'StateManager', 'Time', 'Upgrade', 'Utils', 'Paths', 'Stats',
              function ($rootScope, $timeout, $http, $q, $firebase, Facebook, RoomStore, UserStore, Room, Presence, API, StateManager, Time, Upgrade, Utils, Paths, Stats) {

    return {

        /**
         * Create a new AngularFire simple login object
         * this object will try to authenticate the user if
         * a session exists
         * @param authUser - the authentication user provided by Firebase
         */
        bindUser: function (authUser) {

            Stats.recordLogin();

            var deferred = $q.defer();

            // Set the user's ID
            Paths.userMetaRef(authUser.uid).update({uid: authUser.uid});

            this.bindUserWithUID(authUser.uid).then((function () {

                var user = $rootScope.user;

                // Run the upgrade script
                Upgrade.update_user_to_1_0_5(user);

                var oldMeta = angular.copy(user.meta);

                var setUserProperty = (function (property, value, force) {
                    if((!user.meta[property] || user.meta[property].length == 0 || force) && value && value.length > 0) {
                        user.meta[property] = value;
                        return true;
                    }
                    return false;
                }).bind(this);

                // Get the third party data
                var userData = {name: null};

                var p = authUser.provider;
                if(p == "facebook" || p == "twitter" || p == "google" || p == "github") {
                    if(authUser[p] && authUser[p].cachedUserProfile) {
                        userData = authUser[p].cachedUserProfile;
                    }
                }
                else if (p == "custom" && authUser.thirdPartyData) {
                    userData = authUser.thirdPartyData;
                }
//                else {
//                    userData = {name: null}
//                }

                // Set the user's name
                setUserProperty("name", userData.name);
                setUserProperty("name", "ChatCat" + Math.floor(Math.random() * 1000 + 1));

                var imageURL = null;

                /** SOCIAL INFORMATION **/
                if(authUser.provider == "facebook") {

                    setUserProperty("gender", userData.gender == "male" ? "M": "F");

                    // Make an API request to Facebook to get an appropriately sized
                    // photo
                    if(!user.hasImage()) {
                        Facebook.api('http://graph.facebook.com/'+userData.id+'/picture?width=300', function(response) {
                            user.updateImageURL(response.data.url);
                        });
                    }
                }
                if(authUser.provider == "twitter") {

                    // We need to transform the twiter url to replace 'normal' with 'bigger'
                    // to get the 75px image instad of the 50px
                    if(userData.profile_image_url) {
                        imageURL = userData.profile_image_url.replace("normal", "bigger");
                    }

                    setUserProperty("description", userData.description);
                    setUserProperty("city", userData.location);

                }
                if(authUser.provider == "github") {
                    imageURL = userData.avatar_url;
                    setUserProperty("name", authUser.login)
                }
                if(authUser.provider == "google") {
                    imageURL = userData.picture;
                    setUserProperty("gender", userData.gender == "male" ? "M": "F");
                }
                if(authUser.provider == "anonymous") {

                }
                if(authUser.provider == "custom") {

                    setUserProperty("description", userData.status);
                    setUserProperty("city", userData.city);
                    setUserProperty("gender", userData.gender);
                    setUserProperty("country", userData.countryCode);
                    // TODO: Depricated
                    setUserProperty("yearOfBirth", userData.yearOfBirth);
                    setUserProperty("dateOfBirth", userData.dateOfBirth);
                    setUserProperty("homepageLink", userData.homepageLink, true);
                    setUserProperty("homepageText", userData.homepageText, true);

                    if(userData.profileHTML && userData.profileHTML.length > 0) {
                        setUserProperty("profileHTML", userData.profileHTML, true);
                    }
                    else {
                        user.meta.profileHTML = "";
                    }

                    if(userData.imageURL) {
                        imageURL = userData.imageURL;
                    }
                }

                if(!imageURL) {
                    imageURL = bDefaultAvatarProvider + "/" + user.meta.name + ".png";
                }

                // If they don't have a profile picture load it from the social network
                if(setUserProperty('image', imageURL)) {
                    user.setImage(imageURL);
                }

                /** LOCATION **/
                // Get the user's city and country from their IP
                if(!user.meta.country || !user.meta.city) {

                    $http.post('http://ip-api.com/json').then((function (r) {

                        var changed = false;

                        // The first time the user logs on
                        // try to guess which city and country they're from
                        changed = setUserProperty('city', r.data.city);
                        changed = changed || setUserProperty('country', r.data.countryCode);

                        if(changed) {
                            user.pushMeta();

                            // Digest to update the interface
                            // TODO: Don't do a root digest
                            $timeout(function() {
                                $rootScope.$digest();
                            });
                        }

                    }).bind(this), function (error) {

                    });
                }

                if(!angular.equals(user.meta, oldMeta)) {
                    user.pushMeta();
                }

                /** GRAVATAR **/

                /** Tidy up existing rooms **/

                /** Create static rooms **/
                this.addStaticRooms();

                // Start listening to online user list and public rooms list
                StateManager.on();

                // Start listening to user
                StateManager.userOn(authUser.uid);

                deferred.resolve();

            }).bind(this), function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },

        bindUserWithUID: function (uid) {

            var deferred = $q.defer();

            // Create the user
            // TODO: if we do this we'll also be listening for meta updates...
            $rootScope.user = UserStore.getOrCreateUserWithID(uid, true);
            var userPromise = $rootScope.user.on();
            var timePromise = Time.start(uid);

            $q.all([userPromise, timePromise]).then(function () {
                if (!$rootScope.user.meta.name) {
                    $rootScope.user.meta.name = "";
                }

                Presence.start($rootScope.user);

                deferred.resolve();
            });

            return deferred.promise;
        },

        addStaticRooms: function () {

            var addRoom = (function (roomDef) {
                // Validate the room
                if(Utils.unORNull(roomDef.name) || roomDef.name.length === 0) {
                    console.log("ERROR: Room name is undefined or of zero length");
                    return;
                }
                if(Utils.unORNull(roomDef.rid) || roomDef.rid.length === 0) {
                    console.log("ERROR: Room rid is undefined or of zero length");
                    return;
                }
                if(Utils.unORNull(roomDef.description) || roomDef.description.length === 0) {
                    console.log("WARNING: Room description is undefined or of zero length");
                }
                if(Utils.unORNull(roomDef.weight)) {
                    roomDef.weight = 100;
                }

                Room.createRoomWithRID(
                    roomDef.rid,
                    roomDef.name,
                    roomDef.description,
                    true,
                    bRoomTypePublic,
                    false,
                    roomDef.weight
                );

            }).bind(this);

            var staticRooms = this.getStaticRooms();

            // Get the existing static rooms
            var ref = Paths.publicRoomsRef();

            // Get the existing public rooms and add any that don't exist
            ref.once('value', (function (snapshot) {

                var existingRooms = snapshot.val();

                // Now add the rooms
                for(var key in staticRooms) {
                    if(staticRooms.hasOwnProperty(key)) {
                        if(!existingRooms || (existingRooms && !existingRooms[key])) {
                            addRoom(staticRooms[key]);
                        }
                    }
                }

                this.cleanStaticRooms(existingRooms);

            }).bind(this));

        },

        getStaticRooms: function () {
            // Get a full list of static rooms
            var staticRooms = {};

            var room = null;
            if(CC_OPTIONS && CC_OPTIONS.staticRooms) {
                for(var i = 0; i < CC_OPTIONS.staticRooms.length; i++) {
                    room = CC_OPTIONS.staticRooms[i];
                    staticRooms[room.rid] = room;
                }
            }
            if(API.meta && API.meta.rooms) {
                for(i = 0; i < API.meta.rooms.length; i++) {
                    room = API.meta.rooms[i];
                    staticRooms[room.rid] = room;
                }
            }

            return staticRooms;
        },

        cleanStaticRooms: function (existingRooms) {

            var staticRooms = this.getStaticRooms();

            // Now we want to compare the static rooms with the list of
            // public rooms

            for(var key in existingRooms) {
                if(existingRooms.hasOwnProperty(key)) {

                    var rid = existingRooms[key].rid;

                    // This means that it's not a user created room
                    if(rid && rid.length != 20 && !existingRooms[key].userCreated) {
                        // Is this room included in the list of rooms we made?
                        if(!staticRooms[rid]) {
                            // Get the room
                            var room = RoomStore.getOrCreateRoomWithID(rid);

                            // Get the online

                            // TODO: this is a workout around until we remove the Anuj code
                            // Is this a newPanel room
                            if(!room.newPanel) {
                                // Remove the room from the public list and delete the room
                                //room.delete();
                                room.removeFromPublicRooms();
                            }
                        }
                    }
                }
            }

        },
        numberOfChatters: function () {

            var deferred = $q.defer();

            // Get the number of chatters
            var ref = Paths.onlineUsersRef();
            ref.once('value', function (snapshot) {

                var i = 0;
                var chatters = snapshot.val();
                for(var key in chatters) {
                    if(chatters.hasOwnProperty(key)) {
                        i++;
                    }
                }

                deferred.resolve(i);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }
    };
}]);