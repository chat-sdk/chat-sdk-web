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

myApp.factory('Config', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

    var setByDefault = 0;
    var setByInclude = 1;
    var setBySingleSignOn = 2;
    var setByFirebase = 3;

    return {

        setByDefault: setByDefault,
        setByInclude: setByInclude,
        setBySingleSignOn: setBySingleSignOn,
        setByFirebase: setByFirebase,

        // How many historic messages to set by default
        maxHistoricMessages: 50,
        maxHistoricMessagesSet: setByDefault,

        // Stop the user from changing their name
        disableUserNameChange: false,
        disableUserNameChangeSet: setByDefault,

        // Stop the profile box from being displayed
        disableProfileBox: false,
        disableProfileBoxSet: setByDefault,

        // Clock type:
        // - 12hour
        // - 24hour
        clockType: '12hour',
        clockTypeSet: setByDefault,

        // Are users allowed to create their own public rooms
        usersCanCreatePublicRooms: false,
        usersCanCreatePublicRoomsSet: setByDefault,

        // The primary domain is used when the chat is needed
        // across multiple subdomains
        primaryDomain: '',
        primaryDomainSet: setByDefault,

        // Allow anonymous login?
        anonymousLoginEnabled: false,
        anonymousLoginEnabledSet: setByDefault,

        // Can the user log in using social logins
        socialLoginEnabled: true,
        socialLoginEnabledSet: setByDefault,

        // Header and tab color
        headerColor: '#0d82b3',
        headerColorSet: setByDefault,

        // After how long should the user be marked as offline
        inactivityTimeout: 5,
        inactivityTimeoutSet: setByDefault,

        // We update the config using the data provided
        // but we only update variables where the priority
        // of this setBy entity is higher than the previous
        // one
        setConfig: function (setBy, config) {

            if(config.maxHistoricMessages && this.maxHistoricMessagesSet < setBy) {
                this.maxHistoricMessages = config.maxHistoricMessages;
                this.maxHistoricMessagesSet = setBy;
            }
            if(config.disableUserNameChange && this.disableUserNameChangeSet < setBy) {
                this.disableUserNameChange = config.disableUserNameChange;
                this.disableUserNameChangeSet = setBy;
            }
            if(config.disableProfileBox && this.disableProfileBoxSet < setBy) {
                this.disableProfileBox = config.disableProfileBox;
                this.disableProfileBoxSet = setBy;
            }
            if(config.clockType && this.clockTypeSet < setBy) {
                this.clockType = config.clockType;
                this.clockTypeSet = setBy;
            }
            if(config.usersCanCreatePublicRooms && this.usersCanCreatePublicRoomsSet < setBy) {
                this.usersCanCreatePublicRooms = config.usersCanCreatePublicRooms;
                this.usersCanCreatePublicRoomsSet = setBy;
            }
            if(config.primaryDomain && this.primaryDomainSet < setBy) {
                this.primaryDomain = config.primaryDomain;
                this.primaryDomainSet = setBy;
            }
            if(config.anonymousLoginEnabled && this.anonymousLoginEnabledSet < setBy) {
                this.anonymousLoginEnabled = config.anonymousLoginEnabled;
                this.anonymousLoginEnabledSet = setBy;
            }
            if(config.socialLoginEnabled && this.socialLoginEnabledSet < setBy) {
                this.socialLoginEnabled = config.socialLoginEnabled;
                this.socialLoginEnabledSet = setBy;
            }
            if(config.headerColor && this.headerColorSet < setBy) {
                this.headerColor = config.headerColor;
                this.headerColorSet = setBy;
            }
            if(config.inactivityTimeout && this.inactivityTimeoutSet < setBy) {
                this.inactivityTimeout = config.inactivityTimeout;
                this.inactivityTimeout = Math.max(this.inactivityTimeout, 2);
                this.inactivityTimeout = Math.min(this.inactivityTimeout, 15);
                this.inactivityTimeoutSet = setBy;
            }

            // After we've updated the config we need to digest the
            // root scope
            $timeout(function() {
                $rootScope.$digest();
            });

            $rootScope.config = this;

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

myApp.factory('SingleSignOn', ['$rootScope', '$q', '$http', 'Config', 'LocalStorage', 'Utils', function ($rootScope, $q, $http, Config, LocalStorage, Utils) {

    // API Levels

    // 0: Client makes request to SSO server every time chat loads
    // each time it requests a new token

    // 1: Introduced user token caching - client first makes request
    // to get user's ID. It only requests a new token if the ID has
    // changed

    return {

        defaultError: "Unable to reach server",
        busy: false,

        getAPILevel: function () {
            if(Utils.unORNull(CC_OPTIONS.singleSignOnAPILevel)) {
                return 0;
            }
            else {
                return CC_OPTIONS.singleSignOnAPILevel;
            }
        },

        invalidate: function () {
            LocalStorage.removeProperty(LocalStorage.tokenKey);
            LocalStorage.removeProperty(LocalStorage.tokenExpiryKey);
            LocalStorage.removeProperty(LocalStorage.UIDKey);
        },

        authenticate: function (url) {
            this.busy = true;
            switch (this.getAPILevel()) {
                case 0:
                    return this.authenticateLevel0(url);
                    break;
                case 1:
                    return this.authenticateLevel1(url);
                    break;
            }
        },

        authenticateLevel0: function (url) {

            var deferred = $q.defer();

            this.executeRequest({
                method: 'get',
                params: {
                    action: 'cc_auth'
                },
                url: url
            }).then((function (data) {

                // Update the config object with options that are set
                // These will be overridden by options which are set on the
                // config tab of the user's Firebase install
                Config.setConfig(Config.setBySingleSignOn, data);

                this.busy = false;
                deferred.resolve(data);

            }).bind(this), (function (error) {
                this.busy = false;
                deferred.reject(error);
            }).bind(this));

            return deferred.promise;
        },

        authenticateLevel1: function (url, force) {

            //this.invalidate();

            var deferred = $q.defer();

            // Get the current user's information
            this.getUserUID(url).then((function (response) {

                var currentUID = response.uid;

                // Check to see if we have a token cached
                var token = LocalStorage.getProperty(LocalStorage.tokenKey);
                var expiry = LocalStorage.getProperty(LocalStorage.tokenExpiryKey);
                var uid = LocalStorage.getProperty(LocalStorage.UIDKey);

                // If any value isn't set or if the token is expired get a new token
                if(!Utils.unORNull(token) && !Utils.unORNull(expiry) && !Utils.unORNull(uid) && !force) {
                    // Time since token was refreshed...
                    var timeSince = new Date().getTime() - expiry;
                    // Longer than 20 days
                    if(timeSince < 60 * 60 * 24 * 20 && uid == currentUID) {

                        Config.setConfig(Config.setBySingleSignOn, response);

                        this.busy = false;
                        response['token'] = token;
                        deferred.resolve(response);
                        return deferred.promise;
                    }
                }

                this.executeRequest({
                    method: 'get',
                    params: {
                        action: 'cc_get_token'
                    },
                    url: url
                }).then((function (data) {

                    // Cache the token and the user's current ID
                    LocalStorage.setProperty(LocalStorage.tokenKey, data.token);
                    LocalStorage.setProperty(LocalStorage.UIDKey, currentUID);
                    LocalStorage.setProperty(LocalStorage.tokenExpiryKey, new Date().getTime());

                    // Update the config object with options that are set
                    // These will be overridden by options which are set on the
                    // config tab of the user's Firebase install
                    Config.setConfig(Config.setBySingleSignOn, data);

                    this.busy = false;
                    deferred.resolve(data);

                }).bind(this), (function (error) {
                    this.busy = false;
                    deferred.reject(error);
                }.bind(this)));

            }).bind(this), deferred.reject);

            return deferred.promise;
        },

        getUserUID: function (url) {

            return this.executeRequest({
                method: 'get',
                params: {
                    action: 'cc_get_uid'
                },
                url: url
            });
        },

        executeRequest: function (params) {

            var deferred = $q.defer();

            $http(params).then((function (r) {

                if(r && r.data && !r.data.error) {
                    if(!r.data.error && r.status == 200) {

                        deferred.resolve(r.data);
                    }
                    else {
                        deferred.reject(r.data.error ? r.data.error : this.defaultError);
                    }
                }
                else {
                    deferred.reject(this.defaultError);
                }
            }).bind(this), function (error) {
                deferred.reject(error.message ? error.message : this.defaultError);
            });

            return deferred.promise;
        }
    };

}]);

/**
 * The presence service handles the user's online / offline
 * status
 * We need to call visibility to make sure it's initilized
 */
myApp.factory('Presence', ['$rootScope', '$timeout', 'Visibility', 'Config', 'Cache', 'Paths', 'LocalStorage', 'BeforeUnload', '$q', function ($rootScope, $timeout, Visibility, Config, Cache, Paths, LocalStorage, BeforeUnload, $q) {
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
            if(this.user) {
                var uid = this.user.meta.uid;
                if (uid) {
                    var ref = Paths.onlineUserRef(uid);

                    ref.onDisconnect().remove();

                    ref.setWithPriority({
                            uid: uid,
                            time: Firebase.ServerValue.TIMESTAMP
                        }, this.user.meta.name
                    );

//                    // Update the user online counter
//                    var userCountRef = Paths.onlineUserCountRef();
//                    userCountRef.transaction(function (currentValue) {
//                        return (currentValue || 0) + 1;
//                    });
//                    userCountRef.onDisconnect().transaction(function (currentValue) {
//                        return Math.max(currentValue - 1, 0);
//                    });

                    // Go online for the public rooms
                    var rooms = Cache.rooms;
                    var room;
                    for(var i = 0; i < rooms.length; i++) {
                            // TRAFFIC
                            // If this is a public room we would have removed it when we logged off
                            // We need to set ourself as a member again
                            room = rooms[i];
                            if(room.isPublic())
                                room.join(bUserStatusMember);

                    }
                }
            }
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

myApp.factory('API', ['$q', '$http', '$window', '$timeout', 'Config', 'LocalStorage', 'Paths', function ($q, $http, $window, $timeout, Config, LocalStorage, Paths) {
    return {

        meta: {},
        timeout: null,

        saveAPIDetails: function (details) {
            details.time = new Date().getTime();
            LocalStorage.setProperty(LocalStorage.apiDetailsKey, JSON.stringify(details));
        },

        loadAPIDetails: function () {
            var details = LocalStorage.getProperty(LocalStorage.apiDetailsKey);
            if(details) {
                details = JSON.parse(details);
                if((new Date().getTime() - details.time)/1000 < 24 * 60 * 60) {
                    return details;
                }
            }
            return null;
        },

        getAPIDetails: function () {

            var deferred = $q.defer();

            // Do we have the cached details? Only update the details every hour
            var details = this.loadAPIDetails();
            if(details) {
                this.meta = details;
                Paths.setCID(this.meta.cid);
                deferred.resolve(this.meta);
                return deferred.promise;
            }

            // Do we have a primaryURL?
            var url = Config.primaryDomain;

            if(!url || url.length == 0) {
                url = $window.location.host;

                // Is there a www.?
                if(url.match(/^www\./))
                {
                    url = url.substring(4);
                }
            }

            //Contact the API
            $http({
                method: 'get',
                url: '//chatcat.io/wp-admin/admin-ajax.php',
                params: {
                    action: 'get-api-key',
                    domain: url
                }
            }).then((function (r1) {

                // Here we should be provided with the API key
                if(r1.data.code == 200 && r1.data.api_key) {

                    // Using the API key get the groups
                    $http({
                        method: 'get',
                        url: '//chatcat.io/wp-admin/admin-ajax.php',
                        params: {
                            action: 'get-group-details',
                            api_key: r1.data.api_key
                        }
                    }).then((function(r2) {

                        // Here we should have the groups
                        if(r2.data.code == 200) {

                            // Sort the rooms
                            var rooms = [];

                            var details = r2.data.details;
                            for(var i = 0; i < details.length; i++) {
                                rooms.push({
                                    rid: details[i].ID,
                                    name: details[i].group_name,
                                    description: details[i].group_description,
                                    weight: -i
                                });
                            }

                            this.meta = {
                                cid: r1.data.api_key,
                                max: 250,
                                ads: false,
                                whiteLabel: false,
                                rooms: rooms
                            };

                            Paths.setCID(this.meta.cid);

                            // Save the meta data
                            this.saveAPIDetails(this.meta);

                            // Success! Now return the API meta data
                            deferred.resolve(this.meta);

                        }
                        else {
                            deferred.reject(r2.data.message);
                        }

                    }).bind(this), deferred.reject);
                }
                else {
                    deferred.reject(r1.data.message);
                }

            }).bind(this), function (error, message) {

                deferred.reject("Could not connection to Chatcat.io API");

            });

            return deferred.promise;
        }
    };
}]);

myApp.factory('Utilities', ['$q', function ($q) {
    return {

        filterByName: function (array, name) {
            if(!name || name === "") {
                return array;
            }
            else {
                // Loop over all users
                var result = {};
                var u = null;
                var t = null;
                var n = null;
                for(var id in array) {
                    if(array.hasOwnProperty(id)) {
                        u = array[id];
                        // Switch to lower case and remove spaces
                        // to improve search results
                        t = name.toLowerCase().replace(/ /g,'');
                        n = u.meta.name.toLowerCase().replace(/ /g,'');
                        if(n.substring(0, t.length) == t) {
                            result[id] = u;
                        }
                    }
                }
                return result;
            }
        },

        pullImageFromURL: function (context, url) {

            var deferred = $q.defer();

            context.post(bPullURL, {'url': url}).success((function(data, status) {

                if(data && data.dataURL) {
                    deferred.resolve(data.dataURL);
                }
                else {
                    deferred.reject();
                }

            }).bind(this)).error(function(data, status) {

                deferred.reject();

            });

            return deferred.promise;
        },

        saveImageFromURL: function (src) {

            var deferred = $q.defer();

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

                var size = width - 2 * x;

                // First rescale the image to be square
                canvas.width = max_size;
                canvas.height = max_size;

                try {
                    canvas.getContext('2d').drawImage(image, x, y, width - 2 * x, height - 2 * y, 0, 0, max_size, max_size);
                    var dataURL = canvas.toDataURL('image/jpeg');
                    deferred.resolve(dataURL);
                }
                catch (error) {
                    deferred.reject(error);
                }
            };
            image.src = src;

            return deferred.promise;
        },

        textWidth: function (text, font) {
            if (!this.textWidth.fakeEl) this.textWidth.fakeEl = jQuery('<span>').hide().appendTo(document.body);
            this.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
            return this.textWidth.fakeEl.width();
        }
    };
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

myApp.factory('Auth', ['$rootScope', '$timeout', '$http', '$q', '$firebase', 'Facebook', 'RoomStore', 'UserStore', 'Room', 'Utilities', 'Presence', 'API', 'StateManager', 'Time', 'Upgrade', 'Utils', 'Paths',
              function ($rootScope, $timeout, $http, $q, $firebase, Facebook, RoomStore, UserStore, Room, Utilities, Presence, API, StateManager, Time, Upgrade, Utils, Paths) {

    return {

        /**
         * Create a new AngularFire simple login object
         * this object will try to authenticate the user if
         * a session exists
         * @param authUser - the authentication user provided by Firebase
         */
        bindUser: function (authUser) {

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
                var userData = null;

                var p = authUser.provider;
                if(p == "facebook" || p == "twitter" || p == "google" || p == "github") {
                    userData = authUser[p].cachedUserProfile;
                }
                else if (p == "custom") {
                    userData = authUser.thirdPartyData;
                }
                else {
                    userData = {name: null}
                }

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
                    imageURL = userData.profile_image_url.replace("normal", "bigger");

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
                    setUserProperty("yearOfBirth", userData.yearOfBirth);
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
                setUserProperty('image', imageURL);
                user.setImage(imageURL);

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