'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var myApp = angular.module('myApp.services', ['firebase']).
  value('version', '0.1');

// myApp.config(['FacebookProvider', function(FacebookProvider) {
//     // Set your appId through the setAppId method or
//     // use the shortcut in the initialize method directly.
//     if(ChatSDKOptions.facebookAppID) {
//         FacebookProvider.init(ChatSDKOptions.facebookAppID);
//     }
// }]);

myApp.factory('CloudImage', ['Environment',function (Environment) {
    return {
        // Cloud Image
        cloudImageToken: Environment.cloudImageToken(),

        cloudImage: function(url, w, h) {
            return 'http://' + this.cloudImageToken + '.cloudimg.io/s/crop/'+w+'x'+h+'/' + url;
        }

    };
}]);

myApp.factory('SoundEffects', ['LocalStorage', 'Environment', function (LocalStorage, Environment) {
    return {

        messageReceivedSoundNumber: 1,
        muted: LocalStorage.isMuted(),

        messageReceived: function () {
            if(this.muted) {
                return;
            }
            if(this.messageReceivedSoundNumber == 1) {
                this.alert1();
            }
        },

        alert1: function () {
            var sound = new Howl({
                src: [Environment.audioURL() + 'alert_1.mp3']
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

myApp.factory('Marquee', ['$window', '$interval', function ($window, $interval) {
    var Marquee = {

        running: null,
        title: "",

        init: function () {
            this.title = $window.document.title;
            return this;
        },

        startWithMessage: function (message) {
            if(this.running) {
                this.stop();
            }
            var text = "Chatcat Message: " + message + "...";

            this.running = $interval((function () {
                // Change the page title
                $window.document.title = text;
                if(text.length > 0) {
                    text = text.slice(1);
                }
                else {
                    this.stop();
                }
            }).bind(this), 80);
        },

        stop: function () {
            $interval.cancel(this.running);
            this.running = null;
            // Change the page title
            $window.document.title = this.title;
        }

    };
    return Marquee.init();
}]);

/**
 * This service allows us to flag a room to be opened. This
 * is useful because when we create a new room it's turned
 * on in the impl_roomAdded function. We want to be able
 * to flag it to be opened from anywhere and then let
 * that function open it
 */
myApp.factory('RoomOpenQueue', [function () {
    return {

        rids: [],

        addRoomWithID: function (rid) {
            if(this.rids.indexOf(rid) <0) {
                this.rids.push(rid);
            }
        },

        roomExistsAndPop: function (rid) {
            var index = this.rids.indexOf(rid);
            if(index >= 0) {
                this.rids.splice(index, 1);
                return true;
            }
            return false;
        }
    };
}]);

myApp.factory('Partials', ['$http', '$templateCache', 'Environment', function ($http, $templateCache, Environment) {
    return {
        load: function () {
            $http.get(Environment.partialsURL() + 'chat-room.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'chat-settings.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'countries-select.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'create-room-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'emojis.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'login-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'main-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'notification.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'profile-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'profile-settings-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'room-description.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'room-list.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'room-list-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'user-list.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'year-of-birth-select.html', {cache:$templateCache});
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
            firebase.database().goOffline();
//            this.onlineCounterMinusOne().then(function () {
//
//            });
        },

        goOnline: function () {
            firebase.database().goOnline();
            //this.onlineCounterPlusOne();
            this.update();
        },

        update: function () {

            var deferred = $q.defer();

            if(this.user) {
                var uid = this.user.uid();
                if (uid) {

                    if(Config.onlineUsersEnabled) {
                        var ref = Paths.onlineUserRef(uid);

                        ref.onDisconnect().remove();

                        ref.setWithPriority({
                            uid: uid,
                            time: firebase.database.ServerValue.TIMESTAMP
                        }, this.user.getName(), function (error) {
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

myApp.factory('PathAnalyser', [function () {

    return {

        toAscii: function (string) {
            var output = "";
            for(var i = 0; i < string.length; i++) {
                output += string.charCodeAt(i);
            }
            return output;
        },

        searchPath: function (query) {

            query = query.trim();

            // First see if the query has any wildcards. The * is a wildcard
            // and can be used at the start or end of the query
            var wildPrefix = false;
            if(query.length) {
                wildPrefix = query[0] == '*';
            }
            var wildSuffix = false;
            if(query.length) {
                wildSuffix = query[query.length - 1] == '*';
            }
            if(wildPrefix) {
                query = query.substring(1);
            }
            if(wildSuffix) {
                query = query.substring(0, query.length - 1);
            }

            // Now convert to ascii. We do this because otherwise the special
            // characters in the domain can mess up the regex search
            query = (wildPrefix ? '' : '/^') + this.toAscii(query) + (wildSuffix ? '.*' : '$');

            // Now get the path
            var path = this.toAscii(document.location.href);
            // First we check to see if the query has wild cards

            return path.search(query)!= -1;
        },

        shouldShowChatOnPath: function (paths) {
            // Check to see if we should load the chat on this page?
            var matches = false;

            paths = paths.split(',');

            for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                if (this.searchPath(path)) {
                    matches = true;
                    break;
                }
            }
            return matches;
        }
    };
}]);

