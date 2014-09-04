'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var myApp = angular.module('myApp.services', ['firebase', 'facebook']).
  value('version', '0.1');

myApp.config(function(FacebookProvider) {
    // Set your appId through the setAppId method or
    // use the shortcut in the initialize method directly.
    FacebookProvider.init('735373466519297');
});

myApp.factory('Config', function () {
    return {
        maxHistoricMessages: 200
    }
});

myApp.factory('Layout', function ($rootScope, $timeout, $document, $window) {
    var layout = {

        rooms: [],

        init: function () {

            // Set the screen width and height
            this.updateScreenSize();

            // Monitor the window size
            angular.element($window).bind('resize', (function () {

                this.updateScreenSize();


            }).bind(this));

        },

        updateScreenSize: function () {
            $rootScope.screenWidth = $document.width();
            $rootScope.screenHeight = $window.innerHeight;

            this.resizeMainBox();
            this.updateRoomSize();
        },

        resizeMainBox: function () {
            $rootScope.mainBoxHeight = Math.max($rootScope.screenHeight * 0.5, bMainBoxHeight);
            $rootScope.mainBoxWidth = bMainBoxWidth;
        },

        effectiveScreenWidth: function () {
            var width = $rootScope.screenWidth;

            var rooms = this.roomsSortedByOffset();

            // Check the last box to see if it's off the end of the
            // screen
            var lastRoom = rooms[rooms.length - 1];

            // If we can fit the last room in then
            // the rooms list will be hidden which will
            // give us extra space
            if(lastRoom.width + lastRoom.offset > $rootScope.screenWidth) {
                width -= bRoomsListBoxWidth;
            }
            else {

            }

            return width;
        },

        showRoomListBox: function () {
            var showListBox = (this.getRooms(false).length > 0);
            return showListBox;
        },

        /**
         * Get a list of the user's rooms filtered
         * by whether they're active
         */
        getRooms: function (active) {
            var rooms = [];
            for(var i in this.getAllRooms()) {
                var room = this.getAllRooms()[i];
                if(room.active == active) {
                    rooms.push(room);
                }
            }
            return rooms;
        },

        getAllRooms: function () {
            return this.rooms;
        },

        insertRoom: function(room, index) {

            if(room && room.meta.rid) {

                console.log("Add room" + room.meta.name);

                // Update the position of all the rooms

                var rooms = this.roomsSortedByOffset();

                var r = null;

                if(rooms.length > 0) {
                    for(var i = index; i < rooms.length; i++) {

                        r = rooms[i];

                        // Budge all the other rooms up
                        r.targetSlot = this.nearestSlotToOffset(r.offset) + 1;

                        $rootScope.$broadcast('animateRoom', {
                            room: r,
                            finished: (function() {
                                this.updateRoomSize();
                            }).bind(this)
                        });
                    }
                }

                this.rooms.push(room);

                // Update the position of the first room
                //room.offset = this.offsetForSlot(index);
                room.offset = this.offsetForSlot(index);

                this.updateRoomSize();

                this.digest();

            }
        },

        updateRoomSize: function () {

            var rooms = this.roomsSortedByOffset();

            if(rooms.length == 0) {
                return;
            }

            var effectiveScreenWidth = this.effectiveScreenWidth();

            for(var i in rooms) {
                rooms[i].active = (rooms[i].offset + rooms[i].width) < effectiveScreenWidth;
            }

            this.digest();
        },

        removeRoom: function (room) {
            if(room && room.meta.rid) {
                this.removeRoomWithID(room.meta.rid);
            }
        },

        removeRoomWithID: function (rid) {
            for(var i in this.rooms) {
                if(this.rooms[i].meta.rid == rid) {
                    this.rooms.splice(i, 1);
                    break;
                }
            }
            this.updateRoomPositions();
        },


        updateRoomPositions: function (duration) {
            var i = 0;
            var rooms = this.roomsSortedByOffset();
            for(var key in rooms) {
                var room = rooms[key];
                room.targetSlot = i++;
                $rootScope.$broadcast('animateRoom', {
                    room: room,
                    duration: duration,
                    finished: (function () {
                        //$rootScope.$broadcast('updateRoomSize');
                        this.updateRoomSize();
                    }).bind(this)
                });
            }
        },

        //
        slotForRoom: function (room) {
            return this.nearestSlotToOffset(room.offset);
        },

        // Get the nearest allowable position for a chat room
        nearestSlotToOffset: function (x) {

            // The distance between the slot and the position
            var d0 = 999999;
            var d1 = 0;

            var i = 0;

            // The best slot we've found so far
            var slot = 0;

            for(var key in this.getAllRooms()) {
                var slotX = this.offsetForSlot(i);
                d1 = Math.abs(x - slotX);

                // If this slot is closer that the
                // last one record the slot
                if(d1 < d0) {
                    slot = i;
                }
                // TODO: Could have an efficiency saving by checking
                // if the distance is getting bigger

                d0 = d1;
                i++;
            }
            return slot;
        },

        sortRooms: function () {
            var room = null;

            var i = 0;
            var room = null;
            for(var key in this.rooms) {
                room = this.rooms[key];
                room.offset = this.offsetForSlot(room.targetSlot);
                room.targetSlot = null;
            }
        },

        offsetForSlot: function (slot) {
            var pos = $rootScope.mainBoxWidth + bChatRoomSpacing;
            var rooms = this.roomsSortedByOffset();

            for(var i = 0; i < slot; i++) {
                // If the room isn't active then use the default width
                try {
                    pos += (rooms[i].minimized ? bChatRoomWidth : rooms[i].width) + bChatRoomSpacing;
                }
                catch (e) {
                    // It may be that we're not adding the rooms
                    // in the correct order - in that case
                    // assume default width for the room
                    pos += bChatRoomWidth + bChatRoomSpacing;
                }
            }

            return pos;
        },

        roomsSortedByOffset: function () {
            var arr = [];

            // There should only ever be one
//            var roomWithTarget = null;

            var withTarget = [];

            for (var key in this.rooms) {
                var room = this.rooms[key];

                if (room.targetSlot) {
                    withTarget.push(room);
                    //roomWithTarget = room;
                }
                else {
                    arr.push(room);
                }
            }
            arr.sort(function (a, b) {
                return a.offset - b.offset;
            });
            withTarget.sort(function(a, b) {
                return a.targetSlot - b.targetSlot;
            });

            // Now insert the rooms with a target set
            // Sometimes we direct a room to a new slot
            // for it to know the correct offset, we
            // need to calculate the offsets for the
            // room in it's new position before it gets
            // there - using the target slot allows us
            // to calculate offsets in advance of the
            // animation being completed
            for(var i = 0; i < withTarget.length; i++) {
                arr.splice(withTarget[i].targetSlot,  0, withTarget[i]);
            }

//            if(roomWithTarget) {
//                arr.splice(roomWithTarget.targetSlot,  0, roomWithTarget);
//            }

            return arr;
        },

        digest: function () {
            $timeout(function() {
                $rootScope.$digest();
            });
            console.log("Layout digest");
        }
    }
    layout.init();
    return layout;
});

myApp.factory('Cache', function ($rootScope, $timeout, Layout) {
    return {

        // Dict
        users: {},
        rooms: [],
        onlineUsers: {},
        publicRooms: {},
        friends: {},
        blockedUsers: {},

        // A cache of all users
        addUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.users[user.meta.uid] = user;
            }
        },

        removeUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeUserWithID(user.meta.uid);
            }
        },

        removeUserWithID: function (uid) {
            if(uid) {
                delete this.users[uid];
                this.digest();
            }
        },

        addFriend: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.friends[user.meta.uid] = user;
            }
        },

        removeFriend: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeFriendWithID(user.meta.uid);
            }
        },

        removeFriendWithID: function (uid) {
            if(uid) {
                delete this.friends[uid];
                this.digest();
            }
        },

        addBlockedUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.blockedUsers[user.meta.uid] = user;
            }
        },

        removeBlockedUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeBlockedUserWithID(user.meta.uid);
            }
        },

        removeBlockedUserWithID: function (uid) {
            if(uid) {
                delete this.blockedUsers[uid];
                this.digest();
            }
        },

        addOnlineUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.onlineUsers[user.meta.uid] = user;
                this.digest();
            }
        },

        getUserWithID: function (uid) {
           var user = this.users[uid];
           if(!user) {
               user = this.onlineUsers[uid];
           }
            if(!user) {
                user = this.friends[uid];
            }
            if(!user) {
                user = this.blockedUsers[uid];
            }
           return user;
        },

        removeOnlineUser: function (user) {
            if(user && user.meta && user.meta.uid) {
                this.removeOnlineUserWithID(user.meta.uid);
            }
        },

        removeOnlineUserWithID: function (uid) {
            if(uid) {
                delete this.onlineUsers[uid];
                this.digest();
            }
        },

        addPublicRoom: function (room) {
            if(room && room.meta.rid) {
                this.publicRooms[room.meta.rid] = room;

                // TODO: do we need this?
                //this.sortRooms();
                this.digest();
            }
        },

        removePublicRoom: function (room) {
            if(room && room.meta.rid) {
                this.removePublicRoomWithID(room.meta.rid);
                this.digest();
            }
        },

        removePublicRoomWithID: function (rid) {
            if(rid) {
                delete this.publicRooms[rid];
                this.digest();
            }
        },

        getPublicRooms: function () {
            // Add the public rooms to an array
            var rooms = [];
            for(var key in this.publicRooms) {
                rooms.push(this.publicRooms[key]);
            }
            rooms.sort(function(a, b) {
                return b.userCount() - a.userCount();
            });
            return rooms;
        },

        digest: function () {
            $timeout(function() {
                $rootScope.$digest();
            });
            console.log("Cache digest");
        },

        clear: function () {
            this.users = {};
            //this.rooms = {};
            this.onlineUsers = {};
            this.digest();
            Layout.rooms = [];
        }
    }
});

myApp.factory('User', function ($rootScope, $timeout) {
    return {

        buildUserWithID: function (uid) {
            var user = this.newUserWithID(uid);

            // Start listening to the Firebase location
            user.on = (function () {
                var ref = Paths.userMetaRef(uid);

                // Add a method to listen for updates to this user
                ref.on('value',(function(snapshot) {
                    user.meta = snapshot.val();

                    $timeout(function(){
                        $rootScope.$digest();
                        console.log("User updated digest");
                    });

                }).bind(this));

            }).bind(this);

            // Stop listening to the Firebase location
            user.off = (function () {
                var ref = Paths.userMetaRef(uid);
                ref.off();
            }).bind(this);

            user.addRoom = function (room) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.set({uid: room.meta.rid});
            }

            user.removeRoom = function (room) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.remove();
            }

            user.addFriend = function (friend) {
                var ref = Paths.userFriendsRef(user.meta.uid);
                ref = ref.push();
                ref.set({uid: friend.meta.uid});
            }

            user.removeFriend = function (friend) {
                friend.removeFriend();
                friend.removeFriend = null;
            }

            user.blockUser = function (block) {
                var ref = Paths.userBlockedRef(user.meta.uid);
                ref = ref.push();
                ref.set({uid: block.meta.uid});
            }

            user.unblockUser = function (block) {
                block.unblock();
                block.unblock = null;
            }

            user.updateRoomSlot = function (room, slot) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.update({slot: slot});
            }

            user.on();

            return user;
        },

        // Create a new template object
        // This is mainly useful to have the data
        // structure clearly defined
        newUser: function () {
            var user = {
                meta: {
                    uid: null,
                    name: null,
                    description: null,
                    city: null,
                    country: null
                }
            }
            return user;
        },

        newUserWithID: function (uid) {
            var user = this.newUser();
            user.meta.uid = uid;

            user.goOnline = function () {
                var ref = Paths.onlineUserRef(uid);

                ref.setWithPriority({
                        uid: uid
                    }, user.meta.name
                );
                ref.onDisconnect().remove();
            }

            user.thumbnailURL = function (size) {
                if(user.meta.imageURL) {
                    return "server/tmp/resize.php?src=" + user.meta.imageURL + "&w="+size+"&h="+size;
                }
                // TODO: Make this better
                else {
                    return "img/cc-"+size+"-profile-pic.png";
                }
            }

            return user;
        }
    }
});

myApp.factory('Room', function (Config, Message, $rootScope, $timeout, Cache, User, Layout) {
    return {

        buildRoomWithID: function (rid) {

            var room = this.newRoom();
            room.meta.rid = rid;

            room.on = function () {

                // Get the room meta data
                var ref = Paths.roomMetaRef(rid);

                ref.on('value', (function(snapshot) {
                    room.meta = snapshot.val();

                    $timeout(function(){
                        $rootScope.$digest();
                    });
                    console.log("Room value digest");

                }).bind(this));

                // Also get the messages from the room
                ref = Paths.roomMessagesRef(rid);

                ref.endAt().limit(Config.maxHistoricMessages).on('child_added', function (snapshot) {

                    // Get the snapshot value
                    var val = snapshot.val();

                    // Create the message object
                    var message = Message.buildMessageFromSnapshot(snapshot);

                    // Add the message to this room
                    if(message) {
                        room.messages.push(message);
                        room.messagesDirty = true;
                    }

                    // If the room is inactive or minimized increase the badge
                    if(!room.active || room.minimized) {
                        if(!room.badge) {
                            room.badge = 1;
                        }
                        else {
                            room.badge = Math.min(room.badge + 1, 99);
                        }
                    }

                    $timeout(function(){
                        $rootScope.$digest();
                    });
                    console.log("New message digest");
                });

                // Listen to users being added to the thread
                ref = Paths.roomUsersRef(rid);
                ref.on('child_added', function (snapshot) {
                    // Get the user
                    if(snapshot.val()) {

                        var uid = snapshot.val().uid;

                        var user = Cache.getUserWithID(uid);
                        if(!user) {
                            user = User.buildUserWithID(uid);
                            Cache.addUser(user);
                        }
                        room.users[user.meta.uid] = user;

                        // TODO: Should digest here
                        $timeout(function(){
                            $rootScope.$digest();
                        });
                    }
                });

                ref.on('child_removed', function (snapshot) {
                    if(snapshot.val()) {
                        var uid = snapshot.val().uid;

                        delete room.users[uid];
                        // TODO: Should digest here
                        $timeout(function(){
                            $rootScope.$digest();
                        });

                    }
                });

                // Handle typing
                ref = Paths.roomTypingRef(rid);

                ref.on('child_added', function (snapshot) {
                    room.typing[snapshot.name()] = snapshot.val().name;

                    $timeout(function(){
                        $rootScope.$digest();
                    });
                    console.log("typing digest");
                });

                ref.on('child_removed', function (snapshot) {
                    delete room.typing[snapshot.name()];

                    $timeout(function(){
                        $rootScope.$digest();
                    });
                    console.log("typing digest");
                });

            }

            room.startTyping = function (user) {
                // The user is typing...
                var ref = Paths.roomTypingRef(room.meta.rid).child(user.meta.uid);
                ref.set({name: user.meta.name});

                // If the user disconnects, tidy up by removing the typing
                // inidcator
                ref.onDisconnect().remove();
            }

            room.finishTyping = function (user) {
                var ref = Paths.roomTypingRef(room.meta.rid).child(user.meta.uid);
                ref.remove();
            }

            room.off = function () {
                // Get the room meta data
                Paths.roomMetaRef(rid).off();
                Paths.roomMessagesRef(rid).off();
                Paths.roomUsersRef(rid).off();
                Paths.roomTypingRef(rid).off();
            }

            room.on();

            return room;
        },

        newRoom: function () {
            var room = {
                meta: {
                    name: null,
                    public: null,
                    invitesEnabled: false,
                    users: []
                },
                users: {},
                messages: [],
                typing: {},
                offset: 0,
                targetSlot: null,
                width: bChatRoomWidth,
                height: bChatRoomHeight,
                zIndex: null,
                active: true
            }

            room.userCount = function () {
                var i = 0;
                for(var key in room.users) {
                    i++;
                }
                return i;
            }

            room.addUser = function (user, status) {

                // If the user is already a member of the
                // room
                if(room.users[user.meta.uid]) {
                    return;
                }
                else {
                    this.setStatusForUser(user, status);
                }

            }

            room.setStatusForUser = function(user, status) {
                var ref = Paths.roomUsersRef(room.meta.rid);
                ref.child(user.meta.uid).set({
                    status: status,
                    uid: user.meta.uid
                });
            }

            room.removeUser = function (user) {
                var ref = Paths.roomUsersRef(room.meta.rid).child(user.meta.uid);
                ref.remove(function(e) {
                    console.log(e);
                });
            }

            room.sendMessage = function (message) {

                // Get a ref to the room
                var ref = Paths.roomMessagesRef(room.meta.rid);

                ref.push(message, function () {
                    // Get the message now to find it's time stamp
                });
            }

            room.getOwner = function () {
                // get the owner's ID
                var data = null;
                for(var key in room.meta.users) {
                    data = room.meta.users[key];
                    if(data.status == bUserStatusOwner) {
                        break;
                    }
                }
                if(data) {
                    var user = Cache.getUserWithID(data.uid);
                    if(!user) {
                        user = User.buildUserWithID(data.uid);
                        Cache.addUser(user);
                    }
                    return user;
                }
                return null;
            }

            room.getName = function () {

                if(room.meta.name) {
                    return room.meta.name;
                }

                // How many users are there?
                var i = 0;
                for(var key in room.users) {
                    i++;
                }

                // TODO: Do this better
                if(i == 2) {
                    for(var key in room.users) {
                        var user = room.users[key];

                        // We only want to use the name of a user
                        // who isn't the current user
                        if(Cache.onlineUsers[user.meta.uid]) {
                            if(user.meta.name) {
                                return user.meta.name;
                            }
                        }
                    }
                }

                // Private chat x users
                // Ben Smiley
                return bPrivateChatDefaultName;

            }

            room.slot = function () {
                return Layout.nearestSlotToOffset(room.offset);
            }

            room.getUserStatus = function (user) {
                var data = room.meta.users[user.meta.uid];
                if(data) {
                    return data.status;
                }
            }

            room.getMessages = function () {
                if(!room.messagesDirty) {
                    return room.messages;
                }
                // Sort messages by time
                room.messages.sort(function (a, b) {
                    return a.time - b.time;
                })
                room.messagesDirty = false;

                return room.messages;
            }

            return room;
        }
    }
});

myApp.factory('Message', function (Cache, User) {
    var message = {

        buildMessageFromSnapshot: function (snapshot) {
            var val = snapshot.val();
            if(val) {
                return this.buildMessage(val.uid, val.text, val.time);
            }
            else {
                return null;
            }
        },

        buildMessage: function (uid, text, timestamp) {

            var message = this.newMessage();

            message.uid = uid;
            message.text = text;
            message.time = timestamp ? timestamp : Firebase.ServerValue.TIMESTAMP;

            message.user = (function () {

                if(message.uid) {

                    // We need to set the user here
                    var user = Cache.getUserWithID(message.uid);

                    if(!user) {
                        user = User.buildUserWithID(message.uid);
                        Cache.addUser(user);
                    }
                    return user;
                }

                return null;

            }).bind(this);

            return message;
        },

        newMessage: function () {
            return {
                uid: null,
                text: null,
                time: null
            }
        }
    }
    return message;
});

myApp.factory('Auth', function ($rootScope, $firebase, $firebaseSimpleLogin, $timeout, $http, Cache, User, Room, Message, Layout, Facebook) {

    var Auth = {

        _model: null,

        init: function () {
            //this._model = {user: null};
        },

        /**
         * Give the service access to the scope
         * the service will handle all interactions with
         * Firebase and communicate with the controller
         * by updaing the model and via callbacks
         * @param model - AngularJS $scope variable
         */
        //setModel: function (model) {
        //    this._model = $rootScope;
        //},

        //setUser: function (user) {
        //    $rootScope.user = user;
        //},

        getUser: function () {
            return $rootScope.user;
        },

        addOnlineUsersListener: function () {

            var ref = Paths.onlineUsersRef();

            // A user has come online
            ref.on("child_added", (function (snapshot) {

                // Get the UID of the added user
                var uid = null;
                if (snapshot && snapshot.val()) {
                    uid = snapshot.val().uid;
                }

                // We don't want to process the current user
                if (uid && uid != this.getUser().meta.uid) {

                    console.log("Added: " + uid);

                    var user = Cache.getUserWithID(uid);
                    if (!user) {
                        user = User.buildUserWithID(uid);
                    }
                    Cache.addOnlineUser(user);
                }
            }).bind(this));

            ref.on("child_removed", (function (snapshot) {

                var user = Cache.getUserWithID(snapshot.val().uid);
                if (user) {
                    Cache.removeOnlineUser(user)
                }

            }).bind(this));
        },

        goOffline: function () {
            Firebase.goOffline();
        },

        goOnline: function () {
            Firebase.goOnline();
            if(this.getUser()) {
                this.getUser().goOnline();
            }
        },

        /**
         * Create a new AngularFire simple login object
         * this object will try to authenticate the user if
         * a session exists
         * @param callback - notify if the authentication was successful
         */
        // TODO: Use promise
        bindUser: function (authUser, callback) {

            // Set the user's ID
            Paths.userMetaRef(authUser.uid).update({uid: authUser.uid});

            // Bind the user's meta data
            this.bindUserWithUID(authUser.uid, (function () {

                callback();

                var user = this.getUser();

                var name = user.meta.name;
                if(!name || name.length == 0) {
                    name = user.displayName;
                }
                if(!name || name.length == 0) {
                    name = user.username;
                }
                if(!name || name.length == 0) {
                    name = "";
                }
                user.meta.name = name;

                var imageURL = null;
                var thirdPartyData = user.thirdPartyUserData;

                /** SOCIAL INFORMATION **/
                if(user.provider == "facebook") {
                    // Make an API request to Facebook to get an appropriately sized
                    // photo
                    if(!user.meta.imageURL) {
                        Facebook.api('http://graph.facebook.com/'+thirdPartyData.id+'/picture?width=100', function(response) {
                            Utilities.saveImageFromURL($http, response.data.url, function(fileName) {
                                user.meta.imageURL = fileName;
                            });
                        });
                    }
                }
                if(user.provider == "twitter") {

                    // We need to transform the twiter url to replace 'normal' with 'bigger'
                    // to get the 75px image instad of the 50px
                    imageURL = thirdPartyData.profile_image_url.replace("normal", "bigger");

                    if(!user.meta.description) {
                        user.meta.description = thirdPartyData.description;
                    }
                }
                if(user.provider == "github") {
                    imageURL = thirdPartyData.avatar_url;
                }
                if(user.provider == "google") {
                    imageURL = thirdPartyData.picture;
                }
                if(user.provider == "anonymous") {

                }

                // If they don't have a profile picture load it from the social network
                if(!user.meta.imageURL && imageURL) {
                    Utilities.saveImageFromURL($http, imageURL, function(fileName) {
                        user.meta.imageURL = fileName;
                    });
                }

                /** LOCATION **/
                // Get the user's city and country from their IP
                if(!user.meta.country || !user.meta.city) {
                    $.get("http://ipinfo.io", (function(response) {

                        // The first time the user logs on
                        // try to guess which city and country they're from
                        if(!user.meta.city) {
                            user.meta.city = response.city;
                        }
                        if(!user.meta.country) {
                            user.meta.country = response.country;
                        }

                        console.log(response.city, response.country);

                        // Digest to update the interface
                        $timeout(function() {
                            $rootScope.$digest();
                        });

                    }).bind(this), "jsonp");
                }

                /** GRAVATAR **/


                // Track which users are online
                this.addOnlineUsersListener();

                // Add listeners to the user
                this.addListenersToUser(authUser.uid, (function () {

                }).bind(this));
            }).bind(this));
        },

        /**
         * This adds a listener to the user's chat rooms
         * and then adds a message listener to each room
         * @param uid - the user's Firebase ID
         * @param callback - notify when we finish
         */
        addListenersToUser: function (uid, callback) {

            // Listen to the user's rooms
            var roomsRef = Paths.userRoomsRef(uid);

            // A new room was added so we should start listening to it
            roomsRef.on('child_added', (function (snapshot) {

                // Get the room id
                var rid = snapshot.name();

                if (rid) {

                    var room = Room.buildRoomWithID(rid);
                    if (room) {
                        var slot = snapshot.val().slot;

                        Layout.insertRoom(room, slot ? slot : 0);

                    }
                }

            }).bind(this));

            roomsRef.on('child_removed', (function (snapshot) {

                Layout.removeRoomWithID(snapshot.name());

            }).bind(this));

            // Listen to the public rooms
            var publicRoomsRef = Paths.publicRoomsRef();

            publicRoomsRef.on('child_added', (function (snapshot) {

                var rid = snapshot.name();
                if(rid) {
                    var room = Room.buildRoomWithID(rid);
                    if(room) {
                        Cache.addPublicRoom(room);
                    }
                }

            }).bind(this));

            publicRoomsRef.on('child_removed', (function (snapshot) {

                Cache.removePublicRoomWithID(snapshot.name());

            }).bind(this));

            // Listen to friends
            var friendsRef = Paths.userFriendsRef(uid);
            friendsRef.on('child_added', (function (snapshot) {

                var uid = snapshot.val().uid;
                if(uid) {
                    var user = Cache.getUserWithID(uid);
                    if(!user) {
                        user = User.buildUserWithID(uid);
                    }
                    user.removeFriend = function () {
                        snapshot.ref().remove();
                    }
                    Cache.addFriend(user);
                }

            }).bind(this));

            friendsRef.on('child_removed', (function (snapshot) {

                Cache.removeFriendWithID(snapshot.val().uid);

            }).bind(this));

            // Listen to blocked
            var blockedUsersRef = Paths.userBlockedRef(uid);
            blockedUsersRef.on('child_added', (function (snapshot) {

                var uid = snapshot.val().uid;
                if(uid) {
                    var user = Cache.getUserWithID(uid);
                    if(!user) {
                        user = User.buildUserWithID(uid);
                    }
                    user.unblock = function () {
                        snapshot.ref().remove();
                    }
                    Cache.addBlockedUser(user);
                }

            }).bind(this));

            blockedUsersRef.on('child_removed', (function (snapshot) {

                Cache.removeBlockedUserWithID(snapshot.val().uid);

            }).bind(this));
        },

        bindUserWithUID: function (uid, callback) {

            // Get a ref to the user
            var userMetaRef = Paths.userMetaRef(uid);

            // Create an angular binding ref
            var $userMetaRef = $firebase(userMetaRef);

            // Create the user
            // TODO: if we do this we'll also be listening for meta updates...
            $rootScope.user = User.buildUserWithID(uid);

            // Bind the user to the user variable
            $userMetaRef.$asObject().$bindTo($rootScope, "user.meta").then((function (unbind) {

                // If the user hasn't got a name yet don't throw an error
                if (!this.getUser().meta.name) {
                    this.getUser().meta.name = "";
                }

                // TODO: Check this

                this.getUser().goOnline();

                $rootScope.unbindUser = (function () {
                    unbind();

                    // Clear the data
                    $rootScope.user = null;
                }).bind(this);

                // Mark the user as online
                console.log("Did bind user to scope " + uid);

                if (callback) {
                    callback();
                }
            }).bind(this));
        },

        /**
         * Create a new chat room
         * @param The owner of the room
         * @param A list of users to add
         * @param A callback function
         */
        createPrivateRoom: function (users, callback) {

            var room = Room.newRoom();

            this.createRoom(room, (function () {

                this.joinRoom(room, bUserStatusOwner);

                for (var i in users) {
                    room.addUser(users[i], bUserStatusInvited);
                    users[i].addRoom(room);
                }

                try {
                    callback();
                } catch (e) {

                }
            }).bind(this));
        },

        /**
         * Create a new chat room
         * @param The owner of the room
         * @param A list of users to add
         * @param A callback function
         */
        createPublicRoom: function (options, callback) {

            var room = Room.newRoom();

            room.meta.name = options.name;
            room.meta.description = options.description;
            room.meta.private = options.private;
            room.meta.invitesEnabled = options.invitesEnabled;

            this.createRoom(room, (function () {

                // Once the room's created we need to
                // add it to the list of public rooms
                var ref = Paths.publicRoomsRef();
                ref.child(room.meta.rid).set({rid: room.meta.rid});

                this.joinRoom(room, bUserStatusOwner);

            }).bind(this));
        },

        createRoom: function (room, callback) {

            var ref = Paths.roomsRef();

            // Create a new child ref
            var roomRef = ref.push();
            var roomMetaRef = Paths.roomMetaRef(roomRef.name());

            // Add the room then set it's firebase ID
            room.meta.rid = roomRef.name();

            // Add the room to Firebase
            roomMetaRef.set(room.meta, (function () {
                callback();
            }).bind(this));
        },

        deleteRoom: function (room) {

            this.leaveRoom(room);

            // Remove the room from the cache
            Layout.removeRoom(room);

        },

        joinRoom: function (room, status) {
            if(room) {
                // Add the user to the room
                room.addUser(this.getUser(), status);

                // Add the room to the user
                this.getUser().addRoom(room);
            }
        },

        leaveRoom: function (room) {
            if(room) {
                // Remove the user from the room
                room.removeUser(this.getUser());

                // Remove the room from the user's list
                this.getUser().removeRoom(room);
            }
        },

        sendMessage: function (room, text) {

            var message = Message.buildMessage(this.getUser().meta.uid, text);
            message.user = null;

            room.sendMessage(message);

        },

        uidIsMine: function (uid) {
            return uid == this.getUser().meta.uid;
        },

        numberOfChatters: function (callback) {

            // Get the number of chatters
            var ref = Paths.onlineUsersRef();
            ref.once('value', function (snapshot) {

                var i = 0
                for(var key in snapshot.val()) {
                    i++;
                }
                callback(i);
            });
        }
    }

    Auth.init();

    return Auth;

});