/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.room', ['firebase']);

myApp.factory('Room', ['$rootScope','$timeout','$q', '$window','Config','Message','Cache', 'UserCache','User', 'Presence', 'RoomPositionManager', 'SoundEffects', 'Visibility', 'Log', 'Time', 'Entity',
    function ($rootScope, $timeout, $q, $window, Config, Message, Cache, UserCache, User, Presence, RoomPositionManager, SoundEffects, Visibility, Log, Time, Entity) {
        return {

            createRoom: function (name, description, invitesEnabled, isPublic, weight) {
                return this.createRoomWithRID(null, name, description, invitesEnabled, isPublic, true, weight);
            },

            createRoomWithRID: function (rid, name, description, invitesEnabled, isPublic, userCreated, weight) {

                var deferred = $q.defer();

                if(!rid) {
                    rid = Paths.roomsRef().push().key();
                }
                var roomMeta = this.roomMeta(rid, name, description, true, invitesEnabled, isPublic, weight);

                var roomMetaRef = Paths.roomMetaRef(rid);

                // Add the room to Firebase
                roomMetaRef.set(roomMeta, (function (error) {

                    if(error) {
                        deferred.reject(error);
                    }
                    else {

                        this.addUserToRoom(rid, $rootScope.user, bUserStatusOwner, isPublic);

                        if(isPublic) {
                            var ref = Paths.publicRoomRef(rid);

                            ref.set({
                                rid: rid,
                                created: Firebase.ServerValue.TIMESTAMP,
                                userCreated: true
                            }, (function (error) {
                                if(!error) {
                                    deferred.resolve(rid);
                                }
                                else {
                                    deferred.reject(error);
                                }
                            }).bind(this));
                        }
                        else {
                            deferred.resolve(rid);
                        }
                    }

                    Entity.updateState(bRoomsPath, rid, bMetaKey);

                }).bind(this));

                return deferred.promise;
            },

            createPublicRoom: function (name, description, weight) {
                return this.createRoom(name, description, true, true, weight);
            },

            createPrivateRoom: function (users) {

                var deferred = $q.defer();

                // Check to see if there's already a room between us and the
                // other user
                if(users && users.length == 1) {
                    var r = Cache.getRoomWithOtherUser(users[0]);
                    var user = users[0];
                    if(r && user) {

                        return $q.all([
                            r.addUser(user, bUserStatusInvited),
                            user.addRoom(r)
                        ]);
                    }
                }

                this.createRoom(null, null, true, false).then((function (rid) {
                    for (var i = 0; i < users.length; i++) {
                        this.addUserToRoom(rid, users[i], bUserStatusInvited);
                    }
                    deferred.resolve();
                }).bind(this), deferred.reject());

                return deferred.promise;
            },

            addUserToRoom: function (rid, user, status, isPublic) {

                var deferred = $q.defer();

                var ref = Paths.roomUsersRef(rid);
                ref.child(user.meta.uid).update({
                    status: status,
                    uid: user.meta.uid,
                    time: Firebase.ServerValue.TIMESTAMP
                }, function (error) {
                    if(!error) {
                        user.addRoomWithRID(rid);
                        Entity.updateState(bRoomsPath, rid, bUsersMetaPath);
                        deferred.resolve();
                    }
                    else {
                        deferred.reject(error);
                    }
                });

                // TRAFFIC
                if(isPublic) {
                    ref.onDisconnect().remove();
                }

                return deferred.promise;
            },

            roomMeta: function (rid, name, description, userCreated, invitesEnabled, isPublic, weight) {
                return {
                    rid: rid ? rid : null,
                    name: name ? name : null,
                    invitesEnabled: !unORNull(invitesEnabled) ? invitesEnabled : true,
                    description: description ? description : null,
                    userCreated: !unORNull(userCreated) ? userCreated : true,
                    isPublic: !unORNull(isPublic) ? isPublic : false,
                    created: Firebase.ServerValue.TIMESTAMP,
                    weight: weight ? weight : 0
                }
            },

            newRoom: function (rid, name, invitesEnabled, description, userCreated, isPublic, weight) {

                var room = Entity.newEntity(bRoomsPath, rid);

                room.meta = this.roomMeta(rid, name, description, userCreated, invitesEnabled, isPublic);
                room.meta.rid = rid;

                room.users = {};
                room.usersMeta = {};
                room.userCount = 0;

                room.messages = [];
                room.typing = {};
                room.typingMessage = null;
                room.badge = 0;

                // Layout
                room.offset = 0; // The x offset
                room.dragDirection = 0; // drag direction +ve / -ve

                room.width = bChatRoomWidth;
                room.height = bChatRoomHeight;
                room.zIndex = null;
                room.active = true; // in side list or not
                room.minimized = false;
                room.loadingMoreMessages = false;
                room.loadingTimer = null;
                room.muted = false;

                room.deleted = false;

                /***********************************
                 * GETTERS AND SETTERS
                 */

                room.setRID = function (rid) {
                    room.meta.rid = rid;
                };

                room.getRID = function () {
                    return room.meta.rid;
                };

                room.getUserCreated = function () {
                    return room.meta.userCreated;
                };

                /***********************************
                 * UPDATE METHOD
                 */

                room.update = function () {
                    room.updateName();
                    room.updateOnlineUserCount();
                    $rootScope.$broadcast(bRoomUpdatedNotification, room);
                };

                room.updateTyping = function () {

                    var i = 0;
                    var name = null;
                    for(var key in room.typing) {
                        if(room.typing.hasOwnProperty(key)) {
                            if(key == $rootScope.user.meta.uid) {
                                continue;
                            }
                            name = room.typing[key];
                            i++;
                        }
                    }

                    var typing = null;
                    if (i == 1) {
                        typing = name + "...";
                    }
                    else if (i > 1) {
                        typing = i + " people typing";
                    }

                    room.typingMessage = typing;
                };

                room.updateOnlineUserCount = function () {
                    room.userCount = room.onlineUserCount();
                };

                room.updateName = function () {

                    if(room.meta && room.meta.name) {
                        room.name = room.meta.name;
                        return;
                    }

                    // How many users are there?
                    var i = 0;
                    for(var key in room.users) {
                        if(room.users.hasOwnProperty(key)) {
                            i++;
                        }
                    }
                    // TODO: Do this better
                    if(i == 2) {
                        for(key in room.users) {
                            if(room.users.hasOwnProperty(key)) {
                                var user = room.users[key];

                                // We only want to use the name of a user
                                // who isn't the current user
                                if(Cache.onlineUsers[user.meta.uid]) {
                                    if(user.meta.name) {
                                        room.name = user.meta.name;
                                    }
                                }
                            }
                        }
                    }

                    // Private chat x users
                    // Ben Smiley
                    if(!room.name) {
                        room.name = bGroupChatDefaultName;
                    }

                };

                /***********************************
                 * LIFECYCLE
                 */

                /**
                 * Removes the room from the display
                 * and leaves the room
                 */
                room.close = function () {
                    // TODO: Don't listen to hundreds of rooms

                    // If this is a private room we want to set the status to closed
                    // this means that if we re-click the user, we wouldn't make a new
                    // room
                    if(room.isPublic()) {
                        room.removeUser($rootScope.user);
                        room.updateState(bUsersMetaPath);
                    }
                    else {
                        //room.setStatusForUser($rootScope.user, bUserStatusMember);
                    }

                    //room.leave();
                    $rootScope.user.removeRoom(room);

                    // Remove the room from the cache
                    RoomPositionManager.removeRoom(room);

                };

                // We continue
                room.permanentDelete = function () {
                    room.off();
                    room.removeUser($rootScope.user);
                    room.updateState(bUsersMetaPath);
                    $rootScope.user.removeRoom(room);
                };

                room.temporaryDelete = function () {
                    room.metaOff();
                    room.deleted = true;
                };

                /**
                 * Leave the room - remove the current user from the room
                 */
//                room.leave = function () {
//                    if(room) {
//
//
//                        room.deleted = true;
//
//                    }
//                };

                room.isPublic = function () {
                    return room.meta.isPublic;
                }

                room.join = function (status) {
                    if(room) {
                        // Add the user to the room
                        room.addUser($rootScope.user, status);

                        // Add the room to the user
                        $rootScope.user.addRoom(room);
                    }
                };

                room.removeUser = function (user) {
                    var ref = Paths.roomUsersRef(room.meta.rid);
                    ref.child(user.meta.uid).remove();
                    room.updateState(bUsersMetaPath);
                };

                room.canInviteUser = function () {

                    // Is this room an invite only room?
                    if(room.meta.invitesEnabled) {
                        return true;
                    }
                    else {
                        // Are we the owner?
                        var owner = room.getOwner();
                        if(owner && owner.meta) {
                            return owner.meta.uid == $rootScope.user.meta.uid;
                        }
                        else {
                            return false;
                        }
                    }
                };

                room.setActive = function (active) {
                    if(active) {
                        room.markRead();
                    }
                    room.active = active;
                };

                /***********************************
                 * USERS
                 */

                room.getUserInfoWithUID = function (uid) {
                    // This could be called from the UI so it's important
                    // to wait until users has been populated
                    if(room.usersMeta) {
                        return room.usersMeta[uid];
                    }
                    return null;
                };

                room.getUserInfo = function (user) {
                    // This could be called from the UI so it's important
                    // to wait until users has been populated
                    if(user && user.meta) {
                        return this.getUserInfoWithUID(user.meta.uid);
                    }
                    return null;
                };

                room.getUserStatus = function (user) {
                    var info = room.getUserInfo(user);
                    return info ? info.status : null;
                };

                room.getUsers = function () {
                    var users = {};
                    for(var key in room.users) {
                        if(room.users.hasOwnProperty(key)) {
                            var user = room.users[key];
                            if(user.meta && $rootScope.user && $rootScope.user.meta) {
                                if(user.meta.uid != $rootScope.user.meta.uid && room.userIsActiveWithUID(user.meta.uid)) {
                                    users[user.meta.uid] = user;
                                }
                            }
                        }
                    }
                    return users;
                };

                room.userIsActiveWithInfo = function (info) {
                    // TODO: For the time being assume that users that
                    // don't have this information are active
                    if(info && info.status && info.time) {
                        if(info.status != bUserStatusClosed) {
                            return Time.secondsSince(info.time) < 60 * 60 * 24;
                        }
                    }
                    return true;
                };

                room.userIsActiveWithUID = function (uid) {
                    var info = room.getUserInfo(uid);
                    return room.userIsActiveWithInfo(info);
                };

                room.getOwner = function () {
                    // get the owner's ID
                    var data = null;

                    for(var key in room.usersMeta) {
                        if(room.usersMeta.hasOwnProperty(key)) {
                            data = room.usersMeta[key];
                            if(data.status == bUserStatusOwner) {
                                break;
                            }
                        }
                    }
                    if(data) {
                        return UserCache.getOrCreateUserWithID(data.uid);
                    }
                    return null;
                };

                room.containsUser = function (user) {
                    return room.users[user.meta.uid] != null;
                };

                room.addUser = function (user, status) {

                    var deferred = $q.defer();

                    // Are we able to invite the user?
                    // If the user is us or if the room is public then we can
                    if(user == $rootScope.user) {

                    }
                    else if(!room.canInviteUser() && status != bUserStatusOwner) {
                        $rootScope.showNotification(bNotificationTypeAlert, 'Invites disabled', 'The creator of this room has disabled invites', 'ok');
                        return;
                    }

                    // If the user is already a member of the
                    // room
                    var currentStatus = room.getUserStatus(user);
                    if(currentStatus && currentStatus != bUserStatusClosed) {
                        deferred.resolve();
                        return deferred.promise;
                    }
                    else {
                        this.setStatusForUser(user, status);
                    }
                };

                room.setStatusForUser = function(user, status) {

                    var deferred = $q.defer();

                    var ref = Paths.roomUsersRef(room.meta.rid).child(user.meta.uid);
                    ref.update({
                        status: status,
                        uid: user.meta.uid,
                        time: Firebase.ServerValue.TIMESTAMP
                    }, function (error) {
                        if(!error) {
                            room.updateState(bUsersMetaPath);
                            deferred.resolve();
                        }
                        else {
                            deferred.reject(error);
                        }
                    });

                    // TRAFFIC
                    if(room.meta.isPublic) {
                        ref.onDisconnect().remove();
                    }

                    return deferred.promise;
                };

                // Update the timestamp on the user status
                room.updateUserStatusTime = function (user) {

                    var deferred = $q.defer();

                    var ref = Paths.roomUsersRef(room.meta.rid);
                    ref.child(user.meta.uid).update({
                        time: Firebase.ServerValue.TIMESTAMP
                    }, function (error) {
                        if(!error) {
                            deferred.resolve();
                        }
                        else {
                            deferred.reject(error);
                        }
                    });
                    return deferred.promise;
                };

                /***********************************
                 * ROOM INFORMATION
                 */

                room.onlineUserCount = function () {
                    var user;
                    var i = 0;
                    for(var key in room.usersMeta) {
                        if(room.users.hasOwnProperty(key)) {
                            user = room.usersMeta[key];
                            if($rootScope.user && $rootScope.user.meta) {
                                if((Cache.onlineUsers[user.uid] || $rootScope.user.meta.uid == user.uid) && room.userIsActiveWithUID(user.uid)) {
                                    i++;
                                }
                            }
                        }
                    }
                    return i;
                };

                /**
                 * This function will return the time in seconds
                 * since a message was posted in the room - if
                 *
                 */
                room.timeSinceLastMessage = function () {

                    if(unORNull(room.meta.lastUpdated)) {
                        return 60 * 60 * 24 * 10;
                    }
                    else {
                        var date =  new Date(room.meta.lastUpdated);
                        var time = 0;
                        if(!date.now) {
                            time = date.getTime();
                        }
                        else {
                            time = date.now();
                        }
                        return time * 1000;
                    }

                };

                /**
                 * Checks the rooms meta data to see if it
                 * is inactive
                 * Rooms are considered inactive if:
                 * - They've been created more than 3 days ago
                 * - They have no users and no messages have been added in the last day
                 * - They have users but no messages have been added in the last 2 days
                 */
                room.isInactive = function () {

                    // If this is a static room then
                    // we just return
                    if(!room.meta.userCreated) {
                        return false;
                    }

                    var created = timeSince(room.meta.created);

                    // This is a room that was created before this patch
                    // went live - therefore we'll delete it
                    if(created < 0) {
                        return true;
                    }
                    else {

                        // If the room was created more than three days
                        // ago it's a candidate to be deleted
                        if(created > bDay * 3) {

                            var lastUpdated = timeSince(room.meta.lastUpdated);

                            // if there are no users check when
                            if(room.onlineUserCount() == 0) {

                                // Check when the last message was sent
                                if(lastUpdated < 0 || lastUpdated > bDay) {
                                    return true;
                                }
                            }
                            else {
                                // Check when the last message was sent
                                if(lastUpdated < 0 || lastUpdated > bDay * 2) {
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                };

                /***********************************
                 * LAYOUT
                 */

                // If the room is animating then
                // return the destination
                room.getOffset = function () {
                    if(room.roomState == room.room_state_animating) {
                        return room.destinationOffset;
                    }
                    else {
                        return room.offset;
                    }
                };

                room.getCenterX = function () {
                    return room.getOffset() + room.width / 2;
                };

                room.getMinX = function () {
                    return room.getOffset();
                };

                room.getMaxX = function () {
                    return room.getOffset() + room.width;
                };

                room.updateOffsetFromSlot = function () {
                    room.setOffset(RoomPositionManager.offsetForSlot(room.slot));
                };

                room.setOffset = function(offset) {
                    room.offset = offset;
                };

                room.setSlot = function (slot) {
                    room.slot = slot;
                };

                /***********************************
                 * MESSAGES
                 */

                room.sendMessage = function (text, user) {

                    if(!text || text.length === 0)
                        return;

                    // Make the message
                    var message = Message.newMessage(room.meta.rid, user.meta.uid, text);
                    message.user = null;

                    // Get a ref to the room
                    var ref = Paths.roomMessagesRef(room.meta.rid);

                    // Add the message
                    var newRef = ref.push();
                    newRef.setWithPriority(message.meta, Firebase.ServerValue.TIMESTAMP);

                    // Now update this room with this data
                    var roomMetaRef = Paths.roomMetaRef(room.meta.rid);

                    //
                    var lastMessageMeta = message.meta;
                    lastMessageMeta['userName'] = user.meta.name;

                    // Update the room
                    roomMetaRef.update({
                        lastUpdated: Firebase.ServerValue.TIMESTAMP,
                        lastMessage: lastMessageMeta
                    });

                    // The user's been active so update their status
                    // with the current time
                    room.updateUserStatusTime(user);

                    // Avoid a clash..
                    room.updateState(bMessagesPath).then(function () {
                        room.updateState(bMetaKey);
                    });

                    // Update the user's presence state
                    Presence.update();

                };

                room.loadMoreMessages = function (callback, numberOfMessages) {

                    if(!numberOfMessages) {
                        numberOfMessages = 10;
                    }

                    if(room.loadingMoreMessages) {
                        return;
                    }

                    // If we already have a message then only listen for new
                    // messages
                    if(room.messages.length && room.lastMessage.meta.time) {

                        room.loadingMoreMessages = true;

                        // Also get the messages from the room
                        var ref = Paths.roomMessagesRef(room.meta.rid).orderByPriority();

                        ref = ref.endAt(room.messages[0].meta.time);
                        ref = ref.limitToLast(numberOfMessages);

                        // Store the messages locally
                        var messages = [];

                        var finishQuery = (function () {

                            $timeout.cancel(this.loadingTimer);

                            // Stop listening to reference
                            ref.off();

                            // Add messages to front of global list
                            // Ignore the last message - it's a duplicate
                            var lastMessage = null;
                            for(var i = messages.length - 2; i >= 0; i--) {
                                if(this.messages.length > 0) {
                                    lastMessage = this.messages[0];
                                }
                                this.messages.unshift(messages[i]);
                                if(lastMessage) {
                                    lastMessage.hideName = lastMessage.shouldHideUser(messages[i]);
                                    lastMessage.hideTime = lastMessage.shouldHideDate(messages[i]);
                                }
                            }

                            room.loadingMoreMessages = false;

                            $rootScope.$broadcast(bLazyLoadedMessagesNotification, room, callback);

                        }).bind(this);

                        // Set a timeout for the query - if it's not finished
                        // after 1 second finish it manually
                        this.loadingTimer = $timeout(function () {
                            finishQuery();
                        }, 1000);

                        ref.on('child_added', (function (snapshot) {
                            var val = snapshot.val();
                            if(val) {
                                var message = Message.buildMessage(snapshot.key(), val);
                                messages.push(message);
                                if(messages.length == numberOfMessages) {
                                    finishQuery();
                                }
                            }
                        }).bind(this));
                    }
                };

                room.sortMessages = function () {
                    // Now we should sort all messages
                    this.sortMessageArray(this.messages);
                };

                room.sortMessageArray = function (messages) {
                    messages.sort(function (a, b) {
                        return a.meta.time - b.meta.time;
                    });
                };

                room.markRead = function () {

                    var messages = room.unreadMessages;

                    if(messages && messages.length > 0) {

                        for(var i in messages) {
                            if(messages.hasOwnProperty(i)) {
                                messages[i].markRead();
                            }
                        }

                        // Clear the messages array
                        while(messages.length > 0) {
                            messages.pop();
                        }
                    }
                    room.badge = null;
                };

                room.transcript = function () {

                    var transcript = "";

                    // Loop over messages and format them
                    var messages = room.getMessages();

                    var m = null;
                    for(var i in messages) {
                        if(messages.hasOwnProperty(i)) {
                            m = messages[i];
                            transcript += Time.formatTimestamp(m.meta.time) + " " + m.user.meta.name + ": " + m.meta.text + "\n";
                        }
                    }

                    return transcript;
                };

                /***********************************
                 * TYPING INDICATOR
                 */

                room.startTyping = function (user) {
                    // The user is typing...
                    var ref = Paths.roomTypingRef(room.meta.rid).child(user.meta.uid);
                    ref.set({name: user.meta.name});

                    // If the user disconnects, tidy up by removing the typing
                    // indicator
                    ref.onDisconnect().remove();
                };

                room.finishTyping = function (user) {
                    var ref = Paths.roomTypingRef(room.meta.rid).child(user.meta.uid);
                    ref.remove();
                };

                /***********************************
                 * SERIALIZATION
                 */

                var _superS = room.serialize;
                room.serialize = function () {
                    var m = [];
                    for(var i = 0; i < room.messages.length; i++) {
                        m.push(room.messages[i].serialize());
                    }
                    var sr = {
                        _super: _superS(),
                        minimized: room.minimized,
                        width: room.width,
                        height: room.height,
                        //offset: room.offset,
                        messages: m,
                        meta: room.meta,
                        usersMeta: room.usersMeta
                    };

                    return sr;
                };

                var _superD = room.deserialize;
                room.deserialize = function (sr) {
                    if(sr) {
                        _superD(sr._super);
                        room.minimized = sr.minimized;
                        room.width = sr.width;
                        room.height = sr.height;
                        room.meta = sr.meta;

                        room.setUsersMeta(sr.usersMeta);

                        //room.offset = sr.offset;

                        for(var i = 0; i < sr.messages.length; i++) {
                            room.addMessageMeta(sr.messages[i].mid, sr.messages[i].meta, sr.messages[i]);
                        }
                    }
                };

                /***********************************
                 * FIREBASE
                 */

                /**
                 * Start listening to updates in the
                 * room meta data
                 */
                room.metaOn = function () {
                    return room.pathOn(bMetaKey, function (val) {
                        if(val) {
                            room.meta = val;
                            room.update();
                        }
                    });
                };

                room.metaOff = function () {
                    room.pathOff(bMetaKey);
                };

                room.setUsersMeta = function (val) {

                    var updateUser = (function (uid, userMeta) {
                        // If the user doesn't already exist add it
                        if(!room.usersMeta[uid]) {
                            // Add the user
                            addUser(uid, userMeta);
                        }
                        else {
                            // Has the value changed?
                            if(userMeta.time != room.usersMeta[uid].time) {
                                // If the status is closed
                                if(userMeta.status == bUserStatusClosed) {
                                    // Remove the user from the user list
                                    removeUser(uid, userMeta);
                                }
                                else {
                                    addUser(uid, userMeta);
                                }
                            }
                        }

                    }).bind(this);

                    // TODO: Currently if a user goes offline they don't appear in the
                    // room. They'd have to enter and
                    var addUser = (function (uid, userMeta) {
                        if(room.userIsActiveWithInfo(userMeta)) {
                            //if(Cache.isOnlineWithUID(uid) || $rootScope.user.meta.uid == uid) {
                                var user = UserCache.getOrCreateUserWithID(uid);
                                room.users[user.meta.uid] = user;
                            //}
                        }
                    }).bind(this);

                    var removeUser = (function (uid, meta) {
                        delete room.users[uid];
                    }).bind(this);

                    if(val) {
                        // Loop over the users and see if they're changed
                        for(var uid in val) {
                            if(val.hasOwnProperty(uid)) {
                                updateUser(uid, val[uid]);
                            }
                        }
                        room.usersMeta = val;
                        room.update();
                    }
                    else {
                        for(var uid in room.usersMeta) {
                            if(room.usersMeta.hasOwnProperty(uid)) {
                                removeUser(uid, room.usersMeta[uid]);
                            }
                        }
                        room.usersMeta = {};
                        room.update();
                    }
                };

                room.usersMetaOn = function () {
                    return room.pathOn(bUsersMetaPath, (function (val) {
                        room.setUsersMeta(val);
                    }).bind(this));
                };

                room.usersMetaOff = function () {
                    room.pathOff(bUsersMetaPath);
                };

                room.on = function () {

                    var deferred = $q.defer();

                    if(!room.isOn && room.meta && room.meta.rid) {
                        room.isOn = true;

                        room.userOnlineStateChangedNotificationOff = $rootScope.$on(bUserOnlineStateChangedNotification, function (event, user) {
                            Log.notification(bUserOnlineStateChangedNotification, 'Room');

                            // If the user is a member of this room, update the room
                            room.update();
                        });

                        // Handle typing
                        var ref = Paths.roomTypingRef(room.meta.rid);

                        ref.on('child_added', function (snapshot) {
                            room.typing[snapshot.key()] = snapshot.val().name;

                            room.updateTyping();

                            // Send a notification to the chat room
                            $rootScope.$broadcast(bChatUpdatedNotification, room);
                        });

                        ref.on('child_removed', function (snapshot) {
                            delete room.typing[snapshot.key()];

                            room.updateTyping();

                            // Send a notification to the chat room
                            $rootScope.$broadcast(bChatUpdatedNotification, room);
                        });

                        // Do we really need to use a promise here?
                        // We do because we need to have the users meta
                        // to know whether we're invited or a member
                        // This should work anyway because the user status is pulled
                        // dynamically
                        room.metaOn();
                        room.usersMetaOn();
                    }

                    deferred.resolve();
                    return deferred.promise;
                };

                /**
                 * Start listening to messages being added
                 */

                room.addMessageMeta = function (mid, val, serialization) {

                    if(!val || !val.text || val.text.length === 0) {
                        return;
                    }

                    if(room.lastMessage) {
                        // Sometimes we get double messages
                        // check that this message hasn't been added already
                        if(room.lastMessage.mid == mid) {
                            return;
                        }
                    }

                    // Create the message object
                    var message = Message.buildMessage(mid, val);
                    if(serialization) {
                        message.deserialize(serialization);
                    }

                    // Change the page title
                    $window.document.title = message.meta.text + "...";

                    // Add the message to this room
                    if(message) {

                        // This logic handles whether the date and name should be
                        // show

                        // Get the previous message if it exists
                        if(room.lastMessage) {

                            var lastMessage = room.lastMessage;

                            // We hide the name on the last message if it is sent by the
                            // same message as this message i.e.
                            // - User 1 (name hidden)
                            // - User 1
                            lastMessage.hideName = lastMessage.shouldHideUser(message);
                            //lastMessage.hideName = message.meta.uid == lastMessage.meta.uid;

                            // Last message date
                            //var lastDate = new Date(lastMessage.meta.time);
                            //var newDate = new Date(message.meta.time);

                            // If messages have the same day, hour and minute
                            // hide the time

                            //lastMessage.hideTime = lastDate.getDay() == newDate.getDay() && lastDate.getHours() == newDate.getHours() && lastDate.getMinutes() == newDate.getMinutes();

                            lastMessage.hideTime = lastMessage.shouldHideDate(message);

                            // Add a pointer to the lastMessage
                            message.lastMessage = lastMessage;

                        }

                        // We always hide the time for the latest message
                        message.hideTime = true;

                        room.messages.push(message);

                        room.sortMessages();

                        room.lastMessage = message;
                        room.messagesDirty = true;
                    }

                    // If the room is inactive or minimized increase the badge
                    if((!room.active || room.minimized) && !message.readBy()) {

                        if(!room.unreadMessages) {
                            room.unreadMessages  = [];
                        }

                        room.unreadMessages.push(message);

                        // If this is the first badge then room.badge will
                        // undefined - so set it to one
                        if(!room.badge) {
                            room.badge = 1;
                        }
                        else {
                            room.badge = Math.min(room.badge + 1, 99);
                        }
                    }
                    else {
                        // Is the room active? If it is then mark the message
                        // as seen
                        message.markRead();
                    }

                    room.update();
                };

                room.messagesOn = function () {

                    // Make sure the room is valid
                    if(room.messagesAreOn || !room.meta || !room.meta.rid) {
                        return;
                    }
                    room.messagesAreOn = true;

                    // Also get the messages from the room
                    var ref = Paths.roomMessagesRef(room.meta.rid);

                    // If we already have a message then only listen for new
                    // messages
                    if(room.lastMessage && room.lastMessage.meta.time) {
                        // Start 1 thousandth of a second after the last message
                        // so we don't get a duplicate
                        ref = ref.startAt(room.lastMessage.meta.time + 1);
                    }
                    else {
                        ref = ref.limitToLast(Config.maxHistoricMessages);
                    }

                    // Add listen to messages added to this thread
                    ref.on('child_added', (function (snapshot) {
                        this.addMessageMeta(snapshot.key(), snapshot.val());

                        // Is the window visible?
                        // Play the sound
                        if(!room.muted) {
                            if(Visibility.getIsHidden()) {
                                // Only make a sound for messages that were recieved less than
                                // 30 seconds ago
                                if(DEBUG) console.log("Now: " + new Date().getTime() + ", Time now: " + Time.now() + ", Message: " + snapshot.val().time);
                                if(DEBUG) console.log("Diff: " + Math.abs(Time.now() - snapshot.val().time));
                                if(Math.abs(Time.now() - snapshot.val().time)/1000 < 30) {
                                    SoundEffects.messageReceived();
                                }
                            }
                        }
                    }).bind(this));
                };

                room.messagesOff = function () {

                    room.messagesAreOn = false;

                    // Get the room meta data
                    if(room.meta && room.meta.rid) {
                        Paths.roomMessagesRef(room.meta.rid).off();
                    }
                };

                room.off = function () {

                    room.isOn = false;

                    if(room.userOnlineStateChangedNotificationOff) {
                        room.userOnlineStateChangedNotificationOff();
                    }

                    room.messagesOff();

                    room.metaOff();
                    room.usersMetaOff();

                    // Get the room meta data
//                    Paths.roomMetaRef(room.meta.rid).off();
//                    Paths.roomUsersRef(room.meta.rid).off();
                    Paths.roomTypingRef(room.meta.rid).off();
                };

                /**
                 * If this public room doesn't already exist
                 * add it to the list of public rooms
                 * @returns {promise}
                 */
                room.addToPublicRooms = function () {

                    var deferred = $q.defer();

                    // Does this room already exist?
                    var ref = Paths.publicRoomRef(room.getRID());
                    ref.once('value', function(snapshot) {
                        if(!snapshot.val()) {
                            ref.set({
                                rid: room.meta.rid,
                                created: Firebase.ServerValue.TIMESTAMP,
                                userCreated: room.getUserCreated()
                            }, function (error) {
                                if(!error) {
                                    deferred.resolve();
                                }
                                else {
                                    deferred.reject(error);
                                }
                            });
                        }
                    });

                    return deferred.promise;
                }

                /**
                 * Remove a public room
                 * @returns {promise}
                 */
                room.removeFromPublicRooms = function () {

                    var deferred = $q.defer();

                    var ref = Paths.publicRoomRef(room.getRID());
                    ref.remove(function (error) {
                        if(!error) {
                            deferred.resolve();
                        }
                        else {
                            deferred.reject(error);
                        }
                    });

                    return deferred.promise;
                };

                /***********************************
                 * ROOM STATE
                 */

//                room.updateState = function (key) {
//
//                    var deferred = $q.defer();
//
//                    var ref = Paths.roomStateRef(room.meta.rid);
//
//                    var data = {}; data[key] = Firebase.ServerValue.TIMESTAMP;
//
//                    ref.update(data, function (error) {
//                        if(!error) {
//                            deferred.resolve();
//                        }
//                        else {
//                            deferred.reject(error);
//                        }
//                    });
//                    return deferred.promise;
//                };

                return room;
            }
        };
    }]);