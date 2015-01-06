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

myApp.factory('Entity', ['$q', function ($q) {
    return {
        newEntity: function (path, id) {

            var entity = {
                _path: path,
                _id: id,
                pathIsOn: {}
            };

            /**
             * Start listening to a path
             * This method first adds a listener to the state ref. It then only
             * adds a listener to the data path if the saved state is out of date
             *
             * @param key - the data key i.e. meta, blocked, friends, messages etc...
             * @returns promise - the promise will ONLY be resolved if the local value is
             *                    updated from Firebase. Reject will be called if the value
             *                    is up to date or if the path is already on
             */
            entity.pathOn = function (key, callback) {

                // Check to see if this path has already
                // been turned on
                if(entity.pathIsOn[key]) {
                    return;
                }
                entity.pathIsOn[key] = true;

                // Start listening to the state
                var stateRef = entity.stateRef(key);

                stateRef.on('value', (function (snapshot) {

                    // If the state isn't set either locally or remotely
                    // or if it is set but the timestamp is lower than the remove value
                    // add a listener to the value
                    if((!snapshot.val() || !entity.state) || (snapshot.val() && snapshot.val() > entity.state[key])) {

                        // Get the ref
                        var ref = entity.pathRef(key);

                        // Make sure the listener isn't added twice
                        ref.off('value');

                        // Add the value listener
                        ref.on('value', (function (snapshot) {
                            if(snapshot.val()) {
                                entity[key] = snapshot.val();
                                if(callback) {
                                    callback(snapshot.val());
                                }
                            }
                        }).bind(this));
                    }
                }).bind(this));
            };

            entity.pathOff = function (key) {

                entity.pathIsOn[key] = false;

                entity.stateRef(key).off('value');
                entity.pathRef(key).off('value');
            };

            entity.ref = function () {
                return Paths.firebase().child(entity._path).child(entity._id);
            };

            entity.pathRef = function (path) {
                return entity.ref().child(path);
            };

            entity.stateRef = function (key) {
                return entity.ref().child(bStatePath).child(key);
            };

            return entity;

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

myApp.factory('SingleSignOn', ['$rootScope', '$q', '$http', 'Config', 'LocalStorage', function ($rootScope, $q, $http, Config, LocalStorage) {

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
            if(unORNull(CC_OPTIONS.singleSignOnAPILevel)) {
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
                if(!unORNull(token) && !unORNull(expiry) && !unORNull(uid) && !force) {
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
                    LocalStorage.setProperty(data.token, LocalStorage.tokenKey);
                    LocalStorage.setProperty(currentUID, LocalStorage.UIDKey);
                    LocalStorage.setProperty(new Date().getTime(), LocalStorage.tokenExpiryKey);

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

myApp.factory('Rooms', ['$window', 'Cache', 'LocalStorage', function ($window, Cache, LocalStorage) {

    var Rooms = {

        rooms: [],

        init: function () {

            var beforeUnloadHandler = (function (e) {

                // Save the rooms to cookies
//                var rooms = this.rooms;
//                for(var i in rooms) {
//                    LocalStorage.setRoom(rooms[i]);
//                }

                LocalStorage.storeRooms(this.rooms);


            }).bind(this);

            if ($window.addEventListener) {
                $window.addEventListener('beforeunload', beforeUnloadHandler);
            } else {
                $window.onbeforeunload = beforeUnloadHandler;
            }

            return this;
        },

        addRoom: function (room) {

            Cache.addRoom(room);

            if(!CCArray.contains(this.rooms, room)) {
                this.rooms.push(room);
            }
        },

        getRoomWithID: function (rid) {

            var room = Cache.getRoomWithID(rid);
            if(!room) {
                room = CCArray.getItem(this.rooms, rid, function (room) {
                    return room.meta.rid;
                });
            }
            return room;
        },

        exists: function (room) {
            return CCArray.contains(this.rooms, room);
        },

        removeRoom: function (room) {
            CCArray.remove(this.rooms, room);
        },

        activeRooms: function () {
            var ar = [];
            for(var i =0; i < this.rooms.length; i++) {
                if(this.rooms[i].active) {
                    ar.push(this.rooms[i]);
                }
            }
            return ar;
        },

        inactiveRooms: function () {
            var ar = [];
            for(var i =0; i < this.rooms.length; i++) {
                if(!this.rooms[i].active) {
                    ar.push(this.rooms[i]);
                }
            }
            return ar;
        },

        getRoomWithOtherUser: function (user) {
            var room;
            var rooms = this.rooms;

            for(var i = 0; i < rooms.length; i++) {
                room = rooms[i];

                // Only look at rooms that are private chats
                // between only two people
                if(room.userCount == 2 && !room.meta.isPublic) {
                    if(room.users[user.meta.uid]) {
                        return room;
                    }
                }
            }
            return null;
        },

        clear: function () {
            this.rooms = [];
        }
    };

    return Rooms.init();
}]);

/**
 * The presence service handles the user's online / offline
 * status
 * We need to call visibility to make sure it's initilized
 */
myApp.factory('Presence', ['$rootScope', '$timeout', 'Visibility', 'Config', function ($rootScope, $timeout, Visibility, Config) {
    return {

        user: null,
        inactiveTimerPromise: null,

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
        },

        goOnline: function () {
            Firebase.goOnline();
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
                }
            }
        }
    };
}]);

myApp.factory('API', ['$q', '$http', '$window', '$timeout', 'Config', 'LocalStorage', function ($q, $http, $window, $timeout, Config, LocalStorage) {
    return {

        meta: {},
        timeout: null,

        saveAPIDetails: function (details) {
            details.time = new Date().getTime();
            LocalStorage.setProperty(JSON.stringify(details), LocalStorage.apiDetailsKey);
        },

        loadAPIDetails: function (override) {
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

/**
 * This service keeps track of the slot positions
 * while the rooms are moving around
 */
myApp.factory('RoomPositionManager', ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage', 'Rooms', 'Screen', function ($rootScope, $timeout, $document, $window, LocalStorage, Rooms, Screen) {

    var rpm = {

        rooms: [],
        slotPositions: [],
        dirty: true,

        init: function () {

            this.updateAllRoomActiveStatus();
            $rootScope.$on(bScreenSizeChangedNotification, (function () {
                this.updateAllRoomActiveStatus();
            }).bind(this));

            return this;
        },

        roomDragged: function (room) {

            this.calculateSlotPositions();

            // Right to left
            var nextSlot = room.slot;
            var nextRoom = null;

            if(room.dragDirection > 0) {
                nextSlot++;
                if(this.rooms.length > nextSlot) {

                    nextRoom = this.rooms[nextSlot];

                    // If the room is covering over half of the next room
                    if(room.offset + room.width > this.slotPositions[nextSlot] + nextRoom.width/2) {
                        this.setDirty();
                        room.slot = nextSlot;
                        $rootScope.$broadcast(bAnimateRoomNotification, {
                            room: nextRoom,
                            slot: nextSlot - 1
                        });
                    }
                }
            }
            // Left to right
            else {
                nextSlot--;
                if(nextSlot >= 0) {

                    nextRoom = this.rooms[nextSlot];

                    // If the room is covering over half of the next room
                    if(room.offset < this.slotPositions[nextSlot] + nextRoom.width / 2) {
                        this.setDirty();
                        room.slot = nextSlot;
                        $rootScope.$broadcast(bAnimateRoomNotification, {
                            room: nextRoom,
                            slot: nextSlot + 1
                        });
                    }
                }
            }
            return;
        },

        insertRoom: function (room, slot, duration) {

            // Update the rooms from the cache
            this.updateRoomsList();

            // Move the rooms left
            for(var i = slot; i < this.rooms.length; i++) {
                this.rooms[i].slot++;
            }

            // Add the room
            Rooms.addRoom(room);

            room.slot = slot;


            // Flag as dirty since we've added a room
            this.setDirty();

            // Recalculate
            this.calculateSlotPositions();

            $rootScope.$broadcast(bRoomPositionUpdatedNotification, room);

            for(var i = slot; i < this.rooms.length; i++) {
                $rootScope.$broadcast(bAnimateRoomNotification, {
                    room: this.rooms[i],
                    duration: duration
                });
            }

            room.updateOffsetFromSlot();
            $rootScope.$broadcast(bRoomAddedNotification, room);

            this.updateAllRoomActiveStatus();

        },

        removeRoom: function (room) {

            Rooms.removeRoom(room);

            // Update the slot positions
            this.autoSetSlots();
            this.setDirty();

        },

        autoSetSlots: function () {
            for(var i = 0; i < this.rooms.length; i++) {
                this.rooms[i].slot = i;
            }
        },

        autoPosition: function (duration) {

            this.calculateSlotPositions(true);
            this.autoSetSlots();

            // Are there any inactive rooms?
            // We do this becuase we can't animate rooms that
            // are inactive
            if(Rooms.inactiveRooms().length) {
                duration = 0;
            }

            // Animate all rooms into position
            for(var i = 0; i < this.rooms.length; i++) {
                if(this.rooms[i].active && duration > 0) {
                    $rootScope.$broadcast(bAnimateRoomNotification, {
                        room: this.rooms[i],
                        duration: duration
                    });
                }
                // We need this because if a room isn't active then it's
                // HTML and therefore controller won't exist
                else {
                    this.rooms[i].updateOffsetFromSlot();
                }
            }
        },

        updateAllRoomActiveStatus: function () {

            if(this.rooms.length === 0) {
                return;
            }

            this.calculateSlotPositions(true);

            var effectiveScreenWidth = this.effectiveScreenWidth();

            // Get the index of the current room
            // If any room has gone changed their active status then digest
            var digest;

            for(var i = 0; i < this.rooms.length; i++) {
                if((this.slotPositions[i] + this.rooms[i].width) < effectiveScreenWidth) {
                    digest = digest || this.rooms[i].active == false;
                    this.rooms[i].setActive(true);
                }
                else {
                    digest = digest || this.rooms[i].active == true;
                    this.rooms[i].setActive(false);
                }
            }
            if(digest) {
                $rootScope.$broadcast(bUpdateRoomActiveStatusNotification);
            }
        },

        updateRoomPositions: function (room, duration) {

            this.calculateSlotPositions();

            if(this.rooms.length) {
                for(var i = Math.max(this.rooms.indexOf(room), 0); i < this.rooms.length; i++) {
                    if(this.rooms[i].active && duration > 0) {
                        $rootScope.$broadcast(bAnimateRoomNotification, {
                            room: this.rooms[i],
                            duration: duration
                        });
                    }
                    else {
                        this.rooms[i].updateOffsetFromSlot();
                    }
                }
            }
        },

        /**
         * Returns the width of the screen -
         * if the room list is showing then it subtracts it's width
         * @returns {Usable screen width}
         */
        effectiveScreenWidth: function () {

            this.calculateSlotPositions();

            var width = Screen.screenWidth;

            if(!this.rooms.length) {
                return width;
            }

            // Check the last box to see if it's off the end of the
            // screen
            var lastRoom = this.rooms[this.rooms.length - 1];

            // If we can fit the last room in then
            // the rooms list will be hidden which will
            // give us extra space
            if(lastRoom.width + this.slotPositions[lastRoom.slot] > Screen.screenWidth) {
                width -= bRoomListBoxWidth;
            }

            return width;
        },

        getRooms: function () {
            this.calculateSlotPositions();
            return this.rooms;
        },

        updateRoomsList: function () {
            this.rooms = Rooms.rooms;

            // Sort the rooms by slot
            this.rooms.sort(function (a, b) {
                return a.slot - b.slot;
            });
        },

        setDirty: function () {
            this.dirty = true;
        },

        calculateSlotPositions: function (force) {
            if(force) {
                this.setDirty();
            }
            if(!this.dirty) {
                return;
            }

            this.dirty = false;

            this.updateRoomsList();

            this.slotPositions = [];

            // Work out the positions
            var p = bMainBoxWidth + bChatRoomSpacing;
            for(var i = 0; i < this.rooms.length; i++) {

                this.slotPositions.push(p);

                p += this.rooms[i].minimized ? bChatRoomWidth : this.rooms[i].width;
                p += bChatRoomSpacing;
            }

//            for(var i in this.slotPositions) {
//                console.log("Slot: " + i + " - " + this.slotPositions[i]);
//            }
//            for(i = 0; i < this.rooms.length; i++) {
//                console.log("Room "+i+": " + this.rooms[i].slot);
//                if(i != this.rooms[i].slot) {
//                    console.log("ERRR");
//                }
//            }

        },

        offsetForSlot: function (slot) {
            this.calculateSlotPositions();
            return this.slotPositions[slot];
        }

    }

    return rpm.init();

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

myApp.factory('Auth', ['$rootScope', '$timeout', '$http', '$q', '$firebase', 'Facebook', 'Cache', 'Room', 'Utilities', 'Presence', 'API', 'StateManager',
              function ($rootScope, $timeout, $http, $q, $firebase, Facebook, Cache, Room, Utilities, Presence, API, StateManager) {

    var Auth = {

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

                var setUserProperty = function (property, value, force) {
                    if((!user.meta[property] || user.meta[property].length == 0 || force) && value && value.length > 0) {
                        user.meta[property] = value;
                    }
                };

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
                        Facebook.api('http://graph.facebook.com/'+userData.id+'/picture?width=100', function(response) {
                            user.setImage(response.data.url, true);
                        });
                        Facebook.api('http://graph.facebook.com/'+userData.id+'/picture?width=40', function(response) {
                            user.setThumbnail(response.data.url, true);
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

                // If they don't have a profile picture load it from the social network
                if((!user.hasImage()) && imageURL) {

                    user.setImage(imageURL, true);
                    user.setThumbnail(imageURL, true);

//                    Utilities.pullImageFromURL($http, imageURL).then(function(imageData) {
//
//                        user.setImage(imageData);
//                        user.setThumbnail(imageData)
//
//                    }, function(error) {
//                        user.setImage();
//                    });

                }
                else {
                    user.setImage(bDefaultProfileImage, true);
                    user.setThumbnail(bDefaultProfileImage, true);
                }

                /** LOCATION **/
                // Get the user's city and country from their IP
                if(!user.meta.country || !user.meta.city) {

                    $http.post('http://ip-api.com/json').then((function (r) {

                        // The first time the user logs on
                        // try to guess which city and country they're from
                        if(!user.meta.city) {
                            user.meta.city = r.data.city;
                        }
                        if(!user.meta.country) {
                            user.meta.country = r.data.countryCode;
                        }

                        // Digest to update the interface
                        $timeout(function() {
                            $rootScope.$digest();
                        });


                    }).bind(this), function (error) {

                    });

                }

                /** GRAVATAR **/

                /** Tidy up existing rooms **/


                /** Create static rooms **/
                this.addStaticRooms();


                StateManager.on();
                StateManager.userOn(authUser.uid);

                // Add listeners to the user
                //this.addListenersToUser(authUser.uid);

                deferred.resolve();

            }).bind(this), function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },

        bindUserWithUID: function (uid) {

            var deferred = $q.defer();

            // Get a ref to the user
            var userMetaRef = Paths.userMetaRef(uid);

            // Create an angular binding ref
            var $userMetaRef = $firebase(userMetaRef);

            // Create the user
            // TODO: if we do this we'll also be listening for meta updates...
            $rootScope.user = Cache.getOrCreateUserWithID(uid);
            //$rootScope.user = User.buildUserWithID(uid);
            //$rootScope.user.on();

            // Bind the user to the user variable
            //$userMetaRef.$asObject().$bindTo($rootScope, "user.meta").then((function (unbind) {

                // If the user hasn't got a name yet don't throw an error
                if (!$rootScope.user.meta.name) {
                    $rootScope.user.meta.name = "";
                }

                Presence.start($rootScope.user);

//                $rootScope.unbindUser = (function () {
//                    unbind();
//
//                    // Clear the data
//                    $rootScope.user = null;
//                }).bind(this);

                // Mark the user as online
                if(DEBUG) console.log("Did bind user to scope " + uid);

                deferred.resolve();

            //}).bind(this), function (error) {
            //    deferred.reject(error);
            //});

            return deferred.promise;
        },

        addStaticRooms: function () {

            var addRoom = (function (roomDef) {
                // Validate the room
                if(unORNull(roomDef.name) || roomDef.name.length === 0) {
                    console.log("ERROR: Room name is undefined or of zero length");
                    return;
                }
                if(unORNull(roomDef.rid) || roomDef.rid.length === 0) {
                    console.log("ERROR: Room rid is undefined or of zero length");
                    return;
                }
                if(unORNull(roomDef.description) || roomDef.description.length === 0) {
                    console.log("WARNING: Room description is undefined or of zero length");
                }
                if(unORNull(roomDef.weight)) {
                    roomDef.weight = 100;
                }

                var room = Room.newRoom(roomDef.name, true, roomDef.description, false, true, roomDef.weight);
                room.setRID(roomDef.rid);
                room.create();

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
                            var room = Room.getOrCreateRoomWithID(rid);

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

    return Auth;

}]);