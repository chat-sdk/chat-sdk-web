import * as PathKeys from "../keys/path-keys";
import * as Dimensions from "../keys/dimensions";
import * as NotificationKeys from "../keys/notification-keys";
import * as RoomNameKeys from "../keys/room-name-keys";
import * as RoomKeys from "../keys/room-keys";
import * as RoomType from "../keys/room-type";
import * as UserStatus from "../keys/user-status";
import * as UserKeys from "../keys/user-keys";
import * as Keys from "../keys/keys";
import * as MessageKeys from "../keys/message-keys";
import * as MessageType from "../keys/message-type";
import * as Defines from "../services/defines";

import firebase = require( "firebase/app" );


angular.module('myApp.services').factory('Room', ['$rootScope','$timeout','$q', '$window','Config','Message','Cache', 'UserStore','User', 'Presence', 'RoomPositionManager', 'SoundEffects', 'Visibility', 'Log', 'Time', 'Entity', 'Utils', 'Paths', 'CloudImage', 'Marquee', 'Environment',
    function ($rootScope, $timeout, $q, $window, Config, Message, Cache, UserStore, User, Presence, RoomPositionManager, SoundEffects, Visibility, Log, Time, Entity, Utils, Paths, CloudImage, Marquee, Environment) {

        function Room (rid, name, invitesEnabled, description, userCreated, type, weight) {

            this.entity = new Entity(PathKeys.RoomsPath, rid);

            this.meta = Room.roomMeta(rid, name, description, userCreated, invitesEnabled, type, 0);

            this.users = {};
            this.usersMeta = {};
            this.onlineUserCount = 0;

            this.messages = [];
            this.typing = {};
            this.typingMessage = null;
            this.badge = 0;

            // Layout
            this.offset = 0; // The x offset
            this.dragDirection = 0; // drag direction +ve / -ve

            this.width = Dimensions.ChatRoomWidth;
            this.height = Dimensions.ChatRoomHeight;
            this.zIndex = null;
            this.active = true; // in side list or not
            this.minimized = false;
            this.loadingMoreMessages = false;
            this.loadingTimer = null;
            this.muted = false;

            // Has the room been deleted?
            this.deleted = false;
            // When was the room deleted?
            this.deletedTimestamp = null;

            this.invitedBy = null;
            this.isOpen = false;
            this.typingMessage = null;
            this.readTimestamp = 0; // When was the thread last read?

            this.thumbnail = Environment.defaultRoomPictureURL();
            this.showImage = false;

            // The room associated with this use
            // this is used to make sure that if a user logs out
            // the next user who logs in doesn't see their
            // inbox
            this.associatedUserID = null;

            // TODO: Check this
            this.name = "";
        }

        /***********************************
         * GETTERS AND SETTERS
         */

        Room.prototype.getRID = function () {
            return this.rid();
        };

        Room.prototype.getUserCreated = function () {
            return this.meta.userCreated;
        };

        /***********************************
         * UPDATE METHOD
         */

        /**
         * If silent is true then this will not broadcast to update the UI.
         * Primarily this is used when deserializing
         *
         * @param silent
         */
        Room.prototype.update = function (silent) {
            this.updateName();
            this.setImage(this.meta.image);
            this.updateOnlineUserCount();
            if(Utils.unORNull(silent) || silent == false) {
                $rootScope.$broadcast(NotificationKeys.RoomUpdatedNotification, this);
            }
        };

        Room.prototype.updateTyping = function () {

            var i = 0;
            var name = null;
            for(var key in this.typing) {
                if(this.typing.hasOwnProperty(key)) {
                    if(key == $rootScope.user.uid()) {
                        continue;
                    }
                    name = this.typing[key];
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

            this.typingMessage = typing;
        };

        Room.prototype.updateOnlineUserCount = function () {
            this.onlineUserCount = this.getOnlineUserCount();
        };

        Room.prototype.updateName = function () {

            // If the room already has a name
            // use it
            if(this.meta && this.meta.name && this.meta.name.length) {
                this.name = this.meta.name;
                return;
            }

            // Otherwise build a room based on the users' names
            this.name = "";
            for(var key in this.users) {
                if(this.users.hasOwnProperty(key)) {
                    var user = this.users[key];
                    if(!user.isMe() && user.getName() && user.getName().length) {
                        this.name += user.getName() + ", ";
                    }
                }
            }
            if(this.name.length >= 2) {
                this.name = this.name.substring(0, this.name.length - 2);
            }

            // Private chat x users
            // Ben Smiley
            if(!this.name || !this.name.length) {
                if (this.isPublic()) {
                    this.name = RoomNameKeys.RoomDefaultNamePublic;
                }
                else if (this.userCount() == 1) {
                    this.name = RoomNameKeys.RoomDefaultNameEmpty;
                }
                else if (this.type() == RoomType.RoomTypeGroup) {
                    this.name = RoomNameKeys.RoomDefaultNameGroup;
                }
                else {
                    this.name = RoomNameKeys.RoomDefaultName1To1;
                }
            }

        };

        /***********************************
         * LIFECYCLE: on -> open -> closed -> off
         */

        Room.prototype.on = function () {

            let deferred = $q.defer();

            if(!this.isOn && this.rid()) {
                this.isOn = true;

                let on = (function () {
                    // When a user changes online state update the room
                    this.userOnlineStateChangedNotificationOff = $rootScope.$on(NotificationKeys.UserOnlineStateChangedNotification, (function (event, user) {
                        Log.notification(NotificationKeys.UserOnlineStateChangedNotification, 'Room');

                        // If the user is a member of this room, update the room
                        this.update();
                    }).bind(this));

                    this.usersMetaOn();
                    this.lastMessageOn();

                    deferred.resolve();

                }).bind(this);

                // First get the meta
                this.metaOn().then((function () {

                    switch (this.type()) {
                        case RoomType.RoomType1to1:
                            this.deleted = false;
                            this.userDeletedDate().then((function(timestamp) {
                                if(timestamp) {
                                    this.deleted = true;
                                    this.deletedTimestamp = timestamp;
                                }
                                on();
                            }).bind(this));
                            break;
                        case RoomType.RoomTypePublic:
                        case RoomType.RoomTypeGroup:
                            on();
                            break;
                        default:
                            deferred.resolve();
                    }

                }).bind(this));

            }

            return deferred.promise;
        };

        Room.prototype.open = function (slot, duration) {

            let open = (function () {

                // Add the room to the UI
                RoomPositionManager.insertRoom(this, slot, duration);

                // Start listening to message updates
                this.messagesOn(this.deletedTimestamp);

                // Start listening to typing indicator updates
                this.typingOn();

                // Update the interface
                $rootScope.$broadcast(NotificationKeys.RoomAddedNotification);

            }).bind(this);

            switch (this.type()) {
                case RoomType.RoomTypePublic:
                    this.join(UserStatus.UserStatusMember).then((function ()
                    {
                        open();
                    }).bind(this), function (error) {
                        console.log(error);
                    });
                    break;
                case RoomType.RoomTypeGroup:
                case RoomType.RoomType1to1:
                    open();
            }
        };

        /**
         * Removes the room from the display
         * and leaves the room
         */
        Room.prototype.close = function () {

            this.typingOff();
            this.messagesOff();

            var type = this.type();

            switch (type) {
                case RoomType.RoomTypePublic:
                {
                    this.removeUser($rootScope.user);
                    $rootScope.user.removeRoom(this);
                }
            }

            RoomPositionManager.closeRoom(this);

        };

        Room.prototype.leave = function () {

            var type = this.type();

            switch (type) {
                case RoomType.RoomType1to1:
                {
                    setStatusForUser(this, $rootScope.user, UserStatus.UserStatusClosed, true);
                    this.deleted = true;
                    $rootScope.$broadcast(NotificationKeys.RoomRemovedNotification);
                    this.deleteMessages();
                    break;
                }
                case RoomType.RoomTypeGroup:
                {
                    var promises = [
                        this.removeUser($rootScope.user),
                        $rootScope.user.removeRoom(this)
                    ];

                    $q.all(promises).then((function () {
                        this.off();
                    }).bind(this));

                    this.deleted = true;
                    $rootScope.$broadcast(NotificationKeys.RoomRemovedNotification);
                    this.deleteMessages();
                    break;
                }
            }


        };

        Room.prototype.off = function () {

            this.isOn = false;

            if(this.userOnlineStateChangedNotificationOff) {
                this.userOnlineStateChangedNotificationOff();
            }

            this.metaOff();
            this.usersMetaOff();
            this.lastMessageOff();

        };

        Room.prototype.type = function () {
            return this.meta.type;
        };

        Room.prototype.calculatedType = function () {

            var type = null;

            if(this.isPublic()) {
                type = RoomType.RoomTypePublic;
            }
            else {
                if(this.userCount() <= 1) {
                    type = RoomType.RoomTypeInvalid;
                }
                else if (this.userCount() == 2) {
                    type = RoomType.RoomType1to1;
                }
                else {
                    type = RoomType.RoomTypeGroup;
                }
            }

            return type;
        };

        Room.prototype.updateType = function () {
            var type = this.calculatedType();
            if(type != this.type()) {
                // One important thing is that we can't go from group -> 1to1
                if(this.type() != RoomType.RoomTypeGroup) {
                    Room.updateRoomType(this.rid(), type);
                }
            }
        };

        // We continue
        Room.prototype.permanentDelete = function () {
            this.off();
            this.removeUser($rootScope.user);
            this.entity.updateState(PathKeys.UsersMetaPath);
            $rootScope.user.removeRoom(this);
        };

        Room.prototype.temporaryDelete = function () {
            this.metaOff();
            this.deleted = true;
        };

        /**
         * Message flagging
         */

        Room.prototype.toggleMessageFlag = function (message) {
            if(message.flagged) {
                return this.unflagMessage(message);
            }
            else {
                return this.flagMessage(message);
            }
        };

        Room.prototype.flagMessage = function (message) {

            message.flagged = true;

            var deferred = $q.defer();

            var ref = Paths.flaggedMessageRef(this.rid(), message.mid);

            var data = {};
            data[Keys.CreatorEntityID] = $rootScope.user.uid();
            data[Keys.DateKey] = firebase.database.ServerValue.TIMESTAMP;
            data[Keys.MessageKey] = message.text();
            data[Keys.SenderEntityID] = message.meta[MessageKeys.messageUserFirebaseID];

            ref.set(data, (function (error) {
                if(!error) {
                    deferred.resolve();
                }
                else {
                    message.flagged = false;
                    $rootScope.$broadcast(NotificationKeys.ChatUpdatedNotification, this);

                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        Room.prototype.unflagMessage = function (message) {

            var deferred = $q.defer();

            message.flagged = false;

            var ref = Paths.flaggedMessageRef(this.rid(), message.mid);
            ref.remove((function (error) {
                if(!error) {
                    deferred.resolve();
                }
                else {
                    message.flagged = true;
                    $rootScope.$broadcast(NotificationKeys.ChatUpdatedNotification, this);
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        Room.prototype.isPublic = function () {
            //return this.meta.isPublic;
            return this.type() == RoomType.RoomTypePublic;
        };

        Room.prototype.type = function () {
            return this.metaValue(RoomKeys.roomType);
        };

        Room.prototype.rid = function () {
            return this.entity._id;
        };

        Room.prototype.metaValue = function (key) {
            if(this.meta) {
                return this.meta[key];
            }
            return null;
        };

        Room.prototype.setMetaValue = function (key, value) {
            if(!this.meta) {
                this.meta = {};
            }
            this.meta[key] = value;
        };

        Room.prototype.created = function () {
            return this.metaValue(RoomKeys.roomCreated);
        };

        Room.prototype.lastMessageExists = function () {
            return this.lastMessageMeta != null;
        };

        Room.prototype.lastMessageType = function () {
            if(this.lastMessageExists()) {
                return this.lastMessageMeta[MessageKeys.messageType];
            }
            return null;
        };

        Room.prototype.lastMessageUserName = function () {
            if(this.lastMessageExists()) {
                return this.lastMessageMeta[MessageKeys.messageUserName];
            }
            return null;
        };

        Room.prototype.lastMessageText = function () {
            if(this.lastMessageExists()) {
                if(this.lastMessageType() == MessageType.MessageTypeText) {
                    return this.lastMessageMeta[MessageKeys.messageJSONv2][MessageKeys.messageText];
                }
                if(this.lastMessageType() == MessageType.MessageTypeImage) {
                    return "Image";
                }
                if(this.lastMessageType() == MessageType.MessageTypeFile) {
                    return "File";
                }
                if(this.lastMessageType() == MessageType.MessageTypeLocation) {
                    return "Location";
                }
            }
            return null;
        };


        /**
         * Add the user to the room and add the room to the
         * user in Firebase
         * @param status
         */
        // TODO: #1
        Room.prototype.join = function (status) {

            var statusPromise = setStatusForUser(this, $rootScope.user, status, true);
            var roomPromise = $rootScope.user.addRoom(this);

            return $q.all([statusPromise, roomPromise]);
        };

        // TODO: #1
        Room.prototype.removeUser = function (user) {
            var ref = Paths.roomUsersRef(this.rid());
            ref.child(user.uid()).remove();
        };

        Room.prototype.canInviteUser = function () {

            // Is this room an invite only room?
            if(this.meta.invitesEnabled) {
                return true;
            }
            else {
                // Are we the owner?
                var owner = this.getOwner();
                if(owner && owner.meta) {
                    return owner.uid() == $rootScope.user.uid();
                }
                else {
                    return false;
                }
            }
        };

        Room.prototype.setActive = function (active) {
            if(active) {
                this.markRead();
            }
            this.active = active;
        };

        Room.prototype.setSizeToDefault = function () {
            this.width = Dimensions.ChatRoomWidth;
            this.height = Dimensions.ChatRoomHeight;
        };

        Room.prototype.flashHeader = function () {
            // TODO: Implement this
            // Ideally if the chat is in the side bar then bring it
            // to the front
            // Or flash the side bar
            if(RoomPositionManager.roomIsOpen(this)) {
                $rootScope.$broadcast(NotificationKeys.RoomFlashHeaderNotification, this, '#555', 500, 'room-header');
                $rootScope.$broadcast(NotificationKeys.RoomFlashHeaderNotification, this, '#CCC', 500, 'room-list');
                return true;
            }
            return false;
        };

        /***********************************
         * USERS
         */

        Room.prototype.getUserInfoWithUID = function (uid) {
            // This could be called from the UI so it's important
            // to wait until users has been populated
            if(this.usersMeta) {
                return this.usersMeta[uid];
            }
            return null;
        };

        Room.prototype.getUserInfo = function (user) {
            // This could be called from the UI so it's important
            // to wait until users has been populated
            if(user && user.meta) {
                return this.getUserInfoWithUID(user.uid());
            }
            return null;
        };

        Room.prototype.getUserStatus = function (user) {
            var info = this.getUserInfo(user);
            return info ? info.status : null;
        };

        Room.prototype.getUsers = function () {
            var users = {};
            for(var key in this.users) {
                if(this.users.hasOwnProperty(key)) {
                    var user = this.users[key];
                    if(user.meta && $rootScope.user && $rootScope.user.meta) {
                        if(user.uid() != $rootScope.user.uid() && this.userIsActiveWithUID(user.uid())) {
                            users[user.uid()] = user;
                        }
                    }
                }
            }
            return users;
        };

        Room.prototype.userIsActiveWithUID = function (uid) {
            var info = this.getUserInfo(uid);
            return Room.userIsActiveWithInfo(info);
        };

        Room.prototype.getOwner = function () {
            // get the owner's ID
            var data = null;

            for(var key in this.usersMeta) {
                if(this.usersMeta.hasOwnProperty(key)) {
                    data = this.usersMeta[key];
                    if(data.status == UserStatus.UserStatusOwner) {
                        break;
                    }
                }
            }
            if(data) {
                return UserStore.getOrCreateUserWithID(data.uid);
            }
            return null;
        };

//        Room.prototype.isClosed = function () {
//            return this.getUserStatus($rootScope.user) == UserStatusClosed;
//        };

        Room.prototype.containsUser = function (user) {
            return this.users[user.uid()] != null;
        };

        Room.prototype.acceptInvitation = function () {
            return setStatusForUser(this, $rootScope.user, UserStatus.UserStatusMember, true);
        };

        // Update the timestamp on the user status
        Room.prototype.updateUserStatusTime = function (user) {

            var deferred = $q.defer();

            var data = {
                time: firebase.database.ServerValue.TIMESTAMP
            };

            var ref = Paths.roomUsersRef(this.rid());
            ref.child(user.uid()).update(data, function (error) {
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

        Room.prototype.getOnlineUserCount = function () {
            var i = 0;
            for(var key in this.usersMeta) {
                if(this.usersMeta.hasOwnProperty(key)) {
                    var user = this.usersMeta[key];
                    if($rootScope.user && $rootScope.user.meta) {
                        if((UserStore.users[user.uid].online || $rootScope.user.uid() == user.uid) && this.userIsActiveWithUID(user.uid)) {
                            i++;
                        }
                    }
                }
            }
            return i;
        };

        Room.prototype.userCount = function () {
            var i = 0;
            for(var key in this.usersMeta) {
                if(this.usersMeta.hasOwnProperty(key)) {
                    i++;
                }
            }
            return i;
        };

        Room.prototype.containsOnlyUsers = function (users) {
            var usersInRoom = 0;
            var totalUsers = 0;

            for(var key in this.users) {
                if(this.users.hasOwnProperty(key)) {
                    totalUsers++;
                }
            }
            for(var i = 0; i < users.length; i++) {
                if(this.usersMeta[users[i].meta[Keys.userUID]]) {
                    usersInRoom++;
                }
            }
            return usersInRoom == users.length && usersInRoom == totalUsers;
        };

        /***********************************
         * LAYOUT
         */

            // If the room is animating then
            // return the destination
        Room.prototype.getOffset = function () {
            return this.offset;
        };

        Room.prototype.getCenterX = function () {
            return this.getOffset() + this.width / 2;
        };

        Room.prototype.getMinX = function () {
            return this.getOffset();
        };

        Room.prototype.getMaxX = function () {
            return this.getOffset() + this.width;
        };

        Room.prototype.updateOffsetFromSlot = function () {
            this.setOffset(RoomPositionManager.offsetForSlot(this.slot));
        };

        Room.prototype.setOffset = function(offset) {
            this.offset = offset;
        };

        Room.prototype.setSlot = function (slot) {
            this.slot = slot;
        };

        /***********************************
         * MESSAGES
         */

        Room.prototype.sendImageMessage = function (user, url, width, height) {
            // Build the payload
            var message = Message.buildImageMeta(this.rid(), user.uid(), url, url, width, height);
            this.sendMessage(message, user);
        };

        Room.prototype.sendFileMessage = function (user, fileName, mimeType, fileURL) {
            // Build the payload
            var message = Message.buildFileMeta(this.rid(), user.uid(), fileName, mimeType, fileURL);
            this.sendMessage(message, user);
        };

        Room.prototype.sendTextMessage = function (text, user, type) {
            if(!text || text.length === 0)
                return;
            var message = Message.buildMeta(this.rid(), user.uid(), text, type);
            this.sendMessage(message, user);
        };

        Room.prototype.sendMessage = function (message, user) {
            var innerSendMessage = (function (message, user) {

                // Get a ref to the room
                var ref = Paths.roomMessagesRef(this.rid());

                // Add the message
                var newRef = ref.push();

                var deferred = $q.defer();

                newRef.setWithPriority(message.meta, firebase.database.ServerValue.TIMESTAMP, function (error) {
                    if(!error) {
                        deferred.resolve(null);
                    }
                    else {
                        deferred.reject(error);
                    }
                });

                // Now update this room with this data
                var roomMetaRef = Paths.roomMetaRef(this.rid());

                // Last message
                var p1 = this.setLastMessage(message, user);

                // The user's been active so update their status
                // with the current time
                this.updateUserStatusTime(user);

                // Avoid a clash..
                var p2 = this.entity.updateState(PathKeys.MessagesPath);

                return $q.all([
                    deferred.promise, p1, p2
                ]);

            }).bind(this);

            innerSendMessage(message, user).then(function () {

            }, function (error) {
                // If there's an error update the state i.e. make sure we're online
                // and try to resend
                Presence.update().then(function () {
                    innerSendMessage(message.text(), user);
                });

            });

            // Update the user's presence state
            //Presence.update();

        };

        Room.prototype.setLastMessage = function (message, user) {

            var deferred = $q.defer();

            var lastMessageMeta = message.meta;
            lastMessageMeta['userName'] = user.getName();

            var ref = Paths.roomLastMessageRef(this.rid());
            ref.set(lastMessageMeta, function (error) {
                if(!error) {
                    deferred.resolve(null);
                }
                else {
                    deferred.reject(error);
                }
            });

            //var deferred2 = $q.defer();
            //
            //// Also set the last-message-added property
            //var roomMetaRef = Paths.roomMetaRef(this.rid());
            //var data = {};
            //data[bLastMessageAddedDatePath] = firebase.database.ServerValue.TIMESTAMP;
            //roomMetaRef.update(data, function (error) {
            //    if(!error) {
            //        deferred2.resolve(null);
            //    }
            //    else {
            //        deferred2.reject(error);
            //    }
            //});


            return deferred.promise;
        };

        Room.prototype.loadMoreMessages = function (callback, numberOfMessages) {

            if(!numberOfMessages) {
                numberOfMessages = 10;
            }

            if(this.loadingMoreMessages) {
                return;
            }

            // If we already have a message then only listen for new
            // messages
            if(this.messages.length && this.lastMessage.time()) {

                this.loadingMoreMessages = true;

                // Also get the messages from the room
                var ref = Paths.roomMessagesRef(this.rid()).orderByPriority();

                var time = new Date().getTime();
                if(this.messages.length) {
                    time = this.messages[0].time();
                }

                ref = ref.endAt(this.messages[0].time());
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

                    this.loadingMoreMessages = false;

                    $rootScope.$broadcast(NotificationKeys.LazyLoadedMessagesNotification, this, callback);

                }).bind(this);

                // Set a timeout for the query - if it's not finished
                // after 1 second finish it manually
                this.loadingTimer = $timeout(function () {
                    finishQuery();
                }, 1000);

                ref.on('child_added', (function (snapshot) {
                    var val = snapshot.val();
                    if(val) {
                        var message = new Message(snapshot.key, val);
                        messages.push(message);
                        if(messages.length == numberOfMessages) {
                            finishQuery();
                        }
                    }
                }).bind(this));
            }
        };

        Room.prototype.sortMessages = function () {
            // Now we should sort all messages
            this.sortMessageArray(this.messages);
        };

        Room.prototype.deduplicateMessages = function () {
            var uniqueMessages = [];

            // Deduplicate list
            var lastMID = null;
            for(var i = 0; i < this.messages.length; i++) {
                if(this.messages[i].mid != lastMID) {
                    uniqueMessages.push(this.messages[i]);
                }
                lastMID = this.messages[i].mid;
            }

            this.messages = uniqueMessages;

        };

        Room.prototype.deleteMessages = function () {
            this.messages.length = 0;
            if(this.unreadMessages) {
                this.unreadMessages.length = 0;
            }
        };

        Room.prototype.sortMessageArray = function (messages) {
            messages.sort(function (a, b) {
                return a.time() - b.time();
            });
        };

        Room.prototype.markRead = function () {

            var messages = this.unreadMessages;

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
            this.badge = 0;
            this.sendBadgeChangedNotification();

            // Mark the date when the thread was read
            if(!this.isPublic())
                $rootScope.user.markRoomReadTime(this.rid());

        };

        Room.prototype.updateImageURL = function (imageURL) {
            // Compare to the old URL
            var imageChanged = imageURL != this.meta.image;
            if(imageChanged) {
                this.meta.image = imageURL;
                this.setImage(imageURL, false);
                this.pushMeta();
            }
        };

        Room.prototype.setImage = function (image, isData) {

            this.showImage = this.type() == RoomType.RoomTypePublic;

            if(!image) {
                image = Environment.defaultRoomPictureURL();
            }
            else {
                if(isData || image == Environment.defaultRoomPictureURL()) {
                    this.thumbnail = image;
                }
                else {
                    this.thumbnail = CloudImage.cloudImage(image, 30, 30);
                }
            }
        };

        Room.prototype.pushMeta = function () {

            var deferred = $q.defer();

            var ref = Paths.roomMetaRef(this.rid());
            ref.update(this.meta, (function (error) {
                if(!error) {
                    deferred.resolve();
                    this.entity.updateState(Keys.DetailsKey);
                }
                else {
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        Room.prototype.sendBadgeChangedNotification = function () {
            $rootScope.$broadcast(NotificationKeys.RoomBadgeChangedNotification, this);
        };

        Room.prototype.transcript = function () {

            var transcript = "";

            for(var i in this.messages) {
                if(this.messages.hasOwnProperty(i)) {
                    var m = this.messages[i];
                    transcript += Time.formatTimestamp(m.time()) + " " + m.user.getName() + ": " + m.text() + "\n";
                }
            }

            return transcript;
        };

        /***********************************
         * TYPING INDICATOR
         */

        Room.prototype.startTyping = function (user) {
            // The user is typing...
            var ref = Paths.roomTypingRef(this.rid()).child(user.uid());
            ref.set({name: user.getName()});

            // If the user disconnects, tidy up by removing the typing
            // indicator
            ref.onDisconnect().remove();
        };

        Room.prototype.finishTyping = function (user) {
            var ref = Paths.roomTypingRef(this.rid()).child(user.uid());
            ref.remove();
        };

        /***********************************
         * SERIALIZATION
         */

        Room.prototype.serialize = function () {
            var m = [];
            for(var i = 0; i < this.messages.length; i++) {
                m.push(this.messages[i].serialize());
            }
            return {
                _super: this.entity.serialize(),
                minimized: this.minimized,
                width: this.width,
                height: this.height,
                //offset: this.offset,
                messages: m,
                meta: this.meta,
                usersMeta: this.usersMeta,
                deleted: this.deleted,
                isOpen: this.isOpen,
                //badge: this.badge,
                associatedUserID: this.associatedUserID,
                offset: this.offset,
                readTimestamp: this.readTimestamp,
                lastMessageMeta: this.lastMessageMeta
            };
        };

        Room.prototype.deserialize = function (sr) {
            if(sr) {
                this.entity.deserialize(sr._super);
                this.minimized = sr.minimized;
                this.width = sr.width;
                this.height = sr.height;
                this.meta = sr.meta;
                this.deleted = sr.deleted;
                this.isOpen = sr.isOpen;
                //this.badge = sr.badge;
                this.associatedUserID = sr.associatedUserID;
                this.offset = sr.offset;
                this.readTimestamp = sr.readTimestamp;
                this.lastMessageMeta = sr.lastMessageMeta;

                //this.setUsersMeta(sr.usersMeta);

                for(var key in sr.usersMeta) {
                    if(sr.usersMeta.hasOwnProperty(key)) {
                        this.addUserMeta(sr.usersMeta[key]);
                    }
                }
                //this.offset = sr.offset;

                for(var i = 0; i < sr.messages.length; i++) {
                    this.addMessageMeta(sr.messages[i].mid, sr.messages[i].meta, sr.messages[i], true);
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
        Room.prototype.metaOn = function () {
            return this.entity.pathOn(Keys.DetailsKey, (function (val) {
                if(val) {
                    this.meta = val;
                    this.update();
                }
            }).bind(this));
        };

        Room.prototype.metaOff = function () {
            this.entity.pathOff(Keys.DetailsKey);
        };

        Room.prototype.addUserMeta = function (meta) {
            // We only display users who have been active
            // recently
            if(Room.userIsActiveWithInfo(meta)) {
                this.usersMeta[meta[Keys.userUID]] = meta;

                // Add the user object
                var user = UserStore.getOrCreateUserWithID(meta[Keys.userUID]);
                this.users[user.uid()] = user;

                this.update(false);
            }
        };

        Room.prototype.removeUserMeta = function (meta) {
            delete this.usersMeta[meta[Keys.userUID]];
            delete this.users[meta[Keys.userUID]];
            this.update(false);
        };

        Room.prototype.usersMetaOn = function () {

            var roomUsersRef = Paths.roomUsersRef(this.rid());

            roomUsersRef.on('child_added', (function (snapshot) {
                if(snapshot.val() && snapshot.val()) {
                    var meta = snapshot.val();
                    meta.uid = snapshot.key;
                    this.addUserMeta(meta);
                }
            }).bind(this));

            roomUsersRef.on('child_removed', (function (snapshot) {
                if(snapshot.val()) {
                    var meta = snapshot.val();
                    meta.uid = snapshot.key;
                    this.removeUserMeta(meta);
                }
            }).bind(this));
        };

        Room.prototype.usersMetaOff = function () {
            Paths.roomUsersRef(this.rid()).off();
        };

        Room.prototype.userDeletedDate = function () {

            var deferred = $q.defer();

            var ref = Paths.roomUsersRef(this.rid()).child($rootScope.user.uid());
            ref.once('value',function (snapshot) {
                var val = snapshot.val();
                if(val && val.status == UserStatus.UserStatusClosed) {
                    deferred.resolve(val.time);
                }
                else {
                    deferred.resolve(null);
                }
            });

            return deferred.promise;
        };




        /**
         * Start listening to messages being added
         */

        Room.prototype.addMessageMeta = function (mid, val, serialization, silent) {

            // if(!val || !val[messagePayload] || val[messagePayload].length === 0) {
            //     return false;
            // }

            // Check that the message doesn't already exist
            for(var i = 0; i < this.messages.length; i++) {
                if(this.messages[i].mid === mid) {
                    return false;
                }
            }

            if(this.lastMessage) {
                // Sometimes we get double messages
                // check that this message hasn't been added already
                if(this.lastMessage.mid === mid) {
                    return false;
                }
            }

            // Create the message object
            var message = new Message(mid, val);
            if(serialization) {
                message.deserialize(serialization);
            }

            // Change the page title
            Marquee.startWithMessage(message.user.getName() + ': ' + message.text());
            //$window.document.title = message.meta.text + "...";

            // Add the message to this room
            if(message) {

                // This logic handles whether the date and name should be
                // show

                // Get the previous message if it exists
                if(this.lastMessage) {

                    var lastMessage = this.lastMessage;

                    // We hide the name on the last message if it is sent by the
                    // same message as this message i.e.
                    // - User 1 (name hidden)
                    // - User 1
                    lastMessage.hideName = lastMessage.shouldHideUser(message);

                    lastMessage.hideTime = lastMessage.shouldHideDate(message);

                    // Add a pointer to the lastMessage
                    message.lastMessage = lastMessage;

                }

                // We always hide the time for the latest message
                message.hideTime = true;


                this.messages.push(message);

                this.sortMessages();

                this.lastMessage = message;

            }

            // If the room is inactive or minimized increase the badge
            if(this.shouldIncrementUnreadMessageBadge() && !message.read && (message.time() > this.readTimestamp || !this.readTimestamp)) {

                if(!this.unreadMessages) {
                    this.unreadMessages  = [];
                }

                this.unreadMessages.push(message);

            }
            else {
                // Is the room active? If it is then mark the message
                // as seen
                message.markRead();
            }

            this.update(silent);

            return true;
        };

        Room.prototype.updateUnreadMessageCounter = function (messageMeta) {
            if(this.shouldIncrementUnreadMessageBadge() && (messageMeta[MessageKeys.messageTime] > this.readTimestamp || !this.readTimestamp)) {
                // If this is the first badge then this.badge will
                // undefined - so set it to one
                if (!this.badge) {
                    this.badge = 1;
                }
                else {
                    this.badge = Math.min(this.badge + 1, 99);
                }
                this.sendBadgeChangedNotification();
            }
        };

        Room.prototype.shouldIncrementUnreadMessageBadge = function () {
            return (!this.active || this.minimized || !RoomPositionManager.roomIsOpen(this));// && !this.isPublic();
        };

        Room.prototype.messagesOn = function (timestamp) {

            // Make sure the room is valid
            if(this.messagesAreOn || !this.rid()) {
                return;
            }
            this.messagesAreOn = true;

            // Also get the messages from the room
            var ref = Paths.roomMessagesRef(this.rid());

            var startDate = timestamp;
            if(Utils.unORNull(startDate)) {
                // If we already have a message then only listen for new
                // messages
                if(this.lastMessage && this.lastMessage.time()) {
                    startDate = this.lastMessage.time() + 1;
                }
            }
            else {
                startDate++;
            }

            if(startDate) {
                // Start 1 thousandth of a second after the last message
                // so we don't get a duplicate
                ref = ref.startAt(startDate);
            }
            ref = ref.limitToLast(Config.maxHistoricMessages);

            // Add listen to messages added to this thread
            ref.on('child_added', (function (snapshot) {

                if(Cache.isBlockedUser(snapshot.val()[MessageKeys.messageUID])) {
                    return;
                }

                if(this.addMessageMeta(snapshot.key, snapshot.val())) {
                    // Trim the room to make sure the message count isn't growing
                    // out of control
                    this.trimMessageList();

                    // Is the window visible?
                    // Play the sound
                    if (!this.muted) {
                        if (Visibility.getIsHidden()) {
                            // Only make a sound for messages that were recieved less than
                            // 30 seconds ago
                            if (Defines.DEBUG) console.log("Now: " + new Date().getTime() + ", Time now: " + Time.now() + ", Message: " + snapshot.val()[MessageKeys.messageTime]);
                            if (Defines.DEBUG) console.log("Diff: " + Math.abs(Time.now() - snapshot.val().time));
                            if (Math.abs(Time.now() - snapshot.val()[MessageKeys.messageTime]) / 1000 < 30) {
                                SoundEffects.messageReceived();
                            }
                        }
                    }
                }

            }).bind(this));

            ref.on('child_removed', (function (snapshot) {
                if(snapshot.val()) {
                    for(var i = 0; i < this.messages.length; i++) {
                        var message = this.messages[i];
                        if(message.mid == snapshot.key) {
                            this.messages.splice(i, 1);
                            break;
                        }
                    }
                    //$rootScope.$broadcast(DeleteMessageNotification, snapshot.val().meta.mid);
                    this.update(false);
                }
            }).bind(this));

        };

        Room.prototype.trimMessageList = function () {
            this.sortMessages();
            this.deduplicateMessages();

            var toRemove = this.messages.length - 100;
            if(toRemove > 0) {
                for(var j = 0; j < toRemove; j++) {
                    this.messages.shift();

                }
            }
        };

        Room.prototype.messagesOff = function () {

            this.messagesAreOn = false;

            // Get the room meta data
            if(this.rid()) {
                Paths.roomMessagesRef(this.rid()).off();
            }
        };

        Room.prototype.typingOn = function () {

            // Handle typing
            var ref = Paths.roomTypingRef(this.rid());

            ref.on('child_added', (function (snapshot) {
                this.typing[snapshot.key] = snapshot.val().name;

                this.updateTyping();

                // Send a notification to the chat room
                $rootScope.$broadcast(NotificationKeys.ChatUpdatedNotification, this);
            }).bind(this));

            ref.on('child_removed', (function (snapshot) {
                delete this.typing[snapshot.key];

                this.updateTyping();

                // Send a notification to the chat room
                $rootScope.$broadcast(NotificationKeys.ChatUpdatedNotification, this);
            }).bind(this));

        };

        Room.prototype.typingOff = function () {
            Paths.roomTypingRef(this.rid()).off();
        };

        Room.prototype.lastMessageOn = function () {
            var lastMessageRef = Paths.roomLastMessageRef(this.rid());
            lastMessageRef.on('value', (function (snapshot) {
                if(snapshot.val()) {

                    this.lastMessageMeta = snapshot.val();

                    // If the message comes in then we should make sure
                    // the room is un deleted
                    if(!Cache.isBlockedUser(this.lastMessageMeta[MessageKeys.messageUID])) {
                        if(this.deleted) {
                            this.deleted = false;
                            $rootScope.$broadcast(NotificationKeys.RoomAddedNotification, this);
                        }
                    }

                    this.updateUnreadMessageCounter(this.lastMessageMeta);
                    this.update(false);

                }
            }).bind(this));
        };

        Room.prototype.lastMessageOff = function () {
            Paths.roomLastMessageRef(this.rid()).off();
        };

        /**
         * Remove a public room
         * @returns {promise}
         */
        Room.prototype.removeFromPublicRooms = function () {

            var deferred = $q.defer();

            var ref = Paths.publicRoomRef(this.getRID());
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

        Room.prototype.userIsMember = function (user) {

//            var deferred = $q.defer();
//
//            var ref = Paths.roomUsersRef(uid);
//            ref.once('value', function (snapshot) {
//
//            });
//
//            return deferred.promise;
            var userStatus = this.getUserStatus(user);
            return userStatus == UserStatus.UserStatusMember || userStatus == UserStatus.UserStatusOwner;

        };

        // **********************
        // *** Static methods ***
        // **********************

        Room.createRoom = function (name, description, invitesEnabled, type, weight) {
            return this.createRoomWithRID(null, name, description, invitesEnabled, type, true, weight);
        };

        Room.createRoomWithRID = function (rid, name, description, invitesEnabled, type, userCreated, weight) {

            var deferred = $q.defer();

            if(Utils.unORNull(rid)) {
                rid = Paths.roomsRef().push().key;
            }
            var roomMeta = this.roomMeta(rid, name, description, true, invitesEnabled, type, weight);
            roomMeta[RoomKeys.roomCreatorEntityID] = $rootScope.user.uid();

            var roomMetaRef = Paths.roomMetaRef(rid);

            // Add the room to Firebase
            roomMetaRef.set(roomMeta, (function (error) {

                if(error) {
                    deferred.reject(error);
                }
                else {

                    this.addUserToRoom(rid, $rootScope.user, UserStatus.UserStatusOwner, type);

                    if(type == RoomType.RoomTypePublic) {
                        var ref = Paths.publicRoomRef(rid);

                        var data = {};

                        data[RoomKeys.roomCreated] = firebase.database.ServerValue.TIMESTAMP;
                        data[RoomKeys.roomRID] = rid;
                        data[RoomKeys.roomUserCreated] = true;

                        ref.set(data, (function (error) {
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

                Entity.updateState(PathKeys.RoomsPath, rid, Keys.DetailsKey);

            }).bind(this));

            return deferred.promise;
        };

        // Group chats should be handled separately to
        // private chats
        Room.updateRoomType = function (rid, type) {

            var deferred = $q.defer();

            var ref = Paths.roomMetaRef(rid);

            var data = {};
            data[Keys.TypeKey] = type;

            ref.update(data, (function (error) {
                if(!error) {
                    deferred.resolve();
                }
                else {
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        Room.createPublicRoom = function (name, description, weight) {
            return this.createRoom(name, description, true, RoomType.RoomTypePublic, weight);
        };

        Room.createPrivateRoom = function (users) {

            var deferred = $q.defer();

            // Since we're calling create room we will be added automatically
            this.createRoom(null, null, true, users.length == 1 ? RoomType.RoomType1to1 : RoomType.RoomTypeGroup).then((function (rid) {

                var promises = [];

                for (var i = 0; i < users.length; i++) {
                    promises.push(
                        this.addUserToRoom(rid, users[i], UserStatus.UserStatusMember)
                    );
                }

                $q.all(promises).then(function () {
                    // If this room has multiple users then mark it as a group chat
//                    if(users.length > 2) {
//
//                    }
                    deferred.resolve(rid);
                });

            }).bind(this), deferred.reject);

            return deferred.promise;
        };

        var setStatusForUser = function(room, user, status, force) {

            if(Utils.unORNull(force)) {
                force = false;
            }

            var deferred = $q.defer();

            // Check the current status
            var currentStatus = room.getUserStatus(user);
            if(currentStatus == status && !force) {
                deferred.resolve();
                return deferred.promise;
            }

            var ref = Paths.roomUsersRef(room.rid()).child(user.uid());

            var data = {
                status: status,
                uid: user.uid(),
                time: firebase.database.ServerValue.TIMESTAMP
            };

            ref.update(data, (function (error) {
                if(!error) {
                    room.entity.updateState(PathKeys.UsersMetaPath);
                    deferred.resolve();
                }
                else {
                    deferred.reject(error);
                }
            }).bind(room));

            if(room.isPublic()) {
                ref.onDisconnect().remove();
            }

            return deferred.promise;
        };

        Room.addUserToRoom = function (rid, user, status, type) {

            let data = {
                status: status,
                time: firebase.database.ServerValue.TIMESTAMP
            };

            let d1 = $q.defer();

            let ref = Paths.roomUsersRef(rid).child(user.uid());
            ref.update(data, function (error) {
                if(!error) {
                    d1.resolve();
                }
                else {
                    d1.reject(error);
                }
            });

            if(type == RoomType.RoomTypePublic) {
                ref.onDisconnect().remove();
            }

            let promises = [
                d1.promise,
                user.addRoomWithRID(rid, type)
            ];

            let deferred = $q.defer();

            $q.all(promises).then(function () {
                Entity.updateState(PathKeys.RoomsPath, rid, PathKeys.UsersMetaPath);

                deferred.resolve();

            }, function (error) {

                // Roll back the changes
                ref.remove();
                user.removeRoomWithRID(rid);

                deferred.reject(error);

            });

            return deferred.promise;
        };

        Room.roomMeta = function (rid, name, description, userCreated, invitesEnabled, type, weight) {

            var m = {};
            m[RoomKeys.roomRID] = rid ? rid : null;
            m[RoomKeys.roomName] = name ? name : null;
            m[RoomKeys.roomInvitesEnabled] = !Utils.unORNull(invitesEnabled) ? invitesEnabled : true;
            m[RoomKeys.roomDescription] = description ? description : null;
            m[RoomKeys.roomUserCreated] = !Utils.unORNull(userCreated) ? userCreated : true;
            m[RoomKeys.roomCreated] = firebase.database.ServerValue.TIMESTAMP;
            m[RoomKeys.roomWeight] = weight ? weight : 0;
            m[RoomKeys.roomType] = type;
            // A fix for legacy v3 users
            m[RoomKeys.roomTypeV3] = type == RoomType.RoomTypePublic ? RoomType.RoomTypePublicV3 : RoomType.RoomTypePrivateV3;

            return m;
        };

        Room.userIsActiveWithInfo = function (info) {
            // TODO: For the time being assume that users that
            // don't have this information are active
            if(info && info.status && info.time) {
                if(info.status != UserStatus.UserStatusClosed) {
                    return Time.secondsSince(info.time) < 60 * 60 * 24;
                }
            }
            return true;
        };

        return Room;
}]);