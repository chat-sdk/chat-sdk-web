/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.room', ['firebase']);

myApp.factory('Room', ['$rootScope','$timeout','$q', '$window','Config','Message','Cache', 'UserStore','User', 'Presence', 'RoomPositionManager', 'SoundEffects', 'Visibility', 'Log', 'Time', 'Entity', 'Utils', 'Paths', 'CloudImage',
    function ($rootScope, $timeout, $q, $window, Config, Message, Cache, UserStore, User, Presence, RoomPositionManager, SoundEffects, Visibility, Log, Time, Entity, Utils, Paths, CloudImage) {

        function Room (rid, name, invitesEnabled, description, userCreated, type, weight) {

            this.entity = new Entity(bRoomsPath, rid);

            this.meta = Room.roomMeta(rid, name, description, userCreated, invitesEnabled, type);
            this.meta.rid = rid;

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

            this.width = bChatRoomWidth;
            this.height = bChatRoomHeight;
            this.zIndex = null;
            this.active = true; // in side list or not
            this.minimized = false;
            this.loadingMoreMessages = false;
            this.loadingTimer = null;
            this.muted = false;

            this.deleted = false;
            this.invitedBy = null;
            this.open = false;
            this.typingMessage = null;
            this.readTimestamp = 0; // When was the thread last read?

            this.thumbnail = bDefaultRoomImage;
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

        Room.prototype.setRID = function (rid) {
            this.meta.rid = rid;
        };

        Room.prototype.getRID = function () {
            return this.meta.rid;
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
                $rootScope.$broadcast(bRoomUpdatedNotification, this);
            }
        };

//        Room.prototype.update = function () {
//            this.update(false);
//        };

        Room.prototype.updateTyping = function () {

            var i = 0;
            var name = null;
            for(var key in this.typing) {
                if(this.typing.hasOwnProperty(key)) {
                    if(key == $rootScope.user.meta.uid) {
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

            if(this.meta && this.meta.name && this.meta.name.length) {
                this.name = this.meta.name;
                return;
            }

            // How many users are there?
//            var i = 0;
//            for(var key in this.users) {
//                if(this.users.hasOwnProperty(key)) {
//                    i++;
//                }
//            }

            this.name = "";
            for(var key in this.users) {
                if(this.users.hasOwnProperty(key)) {
                    var user = this.users[key];
                    if(!user.isMe() && user.meta.name && user.meta.name.length) {
                        this.name += user.meta.name + ", ";
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
                    this.name = bRoomDefaultNamePublic;
                }
                else if (this.userCount() == 1) {
                    this.name = bRoomDefaultNameEmpty;
                }
                else if (this.type() == bRoomTypeGroup) {
                    this.name = bRoomDefaultNameGroup;
                }
                else {
                    this.name = bRoomDefaultName1To1;
                }
            }

        };

        /***********************************
         * LIFECYCLE
         */

        /**
         * Removes the room from the display
         * and leaves the room
         */
        Room.prototype.close = function () {

            if(this.isPublic()) {
                this.leaveAndClose();
            }
            else {
                RoomPositionManager.closeRoom(this);
            }
        };

        /**
         * Leave the room perminantly
         * -
         */
        Room.prototype.leaveAndClose = function () {

            var type = this.type();

            if(type == bRoomType1to1) {
                // Set the status to closed
                setStatusForUser(this, $rootScope.user, bUserStatusClosed, true);
                this.deleteMessages();
                this.deleted = true;
                $rootScope.$broadcast(bRoomRemovedNotification);
            }
            else if(type == bRoomTypeGroup || type == bRoomTypePublic) {

                this.messagesOff();

                var promises = [
                    this.removeUser($rootScope.user),
                    $rootScope.user.removeRoom(this)
                ];

                if(type == bRoomTypeGroup) {
                    $q.all(promises).then((function () {
                        this.off();
                    }).bind(this));
                    this.deleted = true;
                    $rootScope.$broadcast(bRoomRemovedNotification);
                }
            }


            RoomPositionManager.closeRoom(this);
        };

        Room.prototype.type = function () {
            return this.meta.type;
        };

        Room.prototype.calculatedType = function () {

            var type = null;

            if(this.isPublic()) {
                type = bRoomTypePublic;
            }
            else {
                if(this.userCount() <= 1) {
                    type = bRoomTypeInvalid;
                }
                else if (this.userCount() == 2) {
                    type = bRoomType1to1;
                }
                else {
                    type = bRoomTypeGroup;
                }
            }

            return type;
        };

        Room.prototype.updateType = function () {
            var type = this.calculatedType();
            if(type != this.type()) {
                // One important thing is that we can't go from group -> 1to1
                if(this.meta.type != bRoomTypeGroup) {
                    Room.updateRoomType(this.meta.rid, type);
                }
            }
        };

        // We continue
        Room.prototype.permanentDelete = function () {
            this.off();
            this.removeUser($rootScope.user);
            this.entity.updateState(bUsersMetaPath);
            $rootScope.user.removeRoom(this);
        };

        Room.prototype.temporaryDelete = function () {
            this.metaOff();
            this.deleted = true;
        };

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

            var ref = Paths.flaggedMessageRef(message.mid);
            ref.set({
                roomName: this.name,
                roomType: this.type(),
                message: message.meta,
                time: Firebase.ServerValue.TIMESTAMP,
                rid: this.meta.rid
            }, (function (error) {
                if(!error) {
                    deferred.resolve();
                }
                else {
                    message.flagged = false;
                    $rootScope.$broadcast(bChatUpdatedNotification, this);

                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        Room.prototype.unflagMessage = function (message) {

            var deferred = $q.defer();

            message.flagged = false;

            var ref = Paths.flaggedMessageRef(this.meta.rid, message.mid);
            ref.remove((function (error) {
                if(!error) {
                    deferred.resolve();
                }
                else {
                    message.flagged = true;
                    $rootScope.$broadcast(bChatUpdatedNotification, this);
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        /**
         * Leave the room - remove the current user from the room
         */
//                this.leave = function () {
//                    if(room) {
//
//
//                        this.deleted = true;
//
//                    }
//                };

        Room.prototype.isPublic = function () {
            //return this.meta.isPublic;
            return this.meta.type == bRoomTypePublic
                || this.meta.isPublic; //TODO: Depricated
        };

        Room.prototype.isOpen = function () {
            return RoomPositionManager.roomIsOpen(this);
        };

        /**
         * Add the user to the room and add the room to the
         * user in Firebase
         * @param status
         */
        Room.prototype.join = function (status) {

            var statusPromise = setStatusForUser(this, $rootScope.user, status, true);
            var roomPromise = $rootScope.user.addRoom(this);

            return $q.all([statusPromise, roomPromise]);
        };

        Room.prototype.removeUser = function (user) {
            var ref = Paths.roomUsersRef(this.meta.rid);
            ref.child(user.meta.uid).remove();
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
                    return owner.meta.uid == $rootScope.user.meta.uid;
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
            this.width = bChatRoomWidth;
            this.height = bChatRoomHeight;
        };

        Room.prototype.flashHeader = function () {
            // TODO: Implement this
            // Ideally if the chat is in the side bar then bring it
            // to the front
            // Or flash the side bar
            $rootScope.$broadcast(bRoomFlashHeaderNotification, this, '#555', 500, 'room-header');
            $rootScope.$broadcast(bRoomFlashHeaderNotification, this, '#CCC', 500, 'room-list');
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
                return this.getUserInfoWithUID(user.meta.uid);
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
                        if(user.meta.uid != $rootScope.user.meta.uid && this.userIsActiveWithUID(user.meta.uid)) {
                            users[user.meta.uid] = user;
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
                    if(data.status == bUserStatusOwner) {
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
//            return this.getUserStatus($rootScope.user) == bUserStatusClosed;
//        };

        Room.prototype.containsUser = function (user) {
            return this.users[user.meta.uid] != null;
        };

        /**
         *
         * @param user
         * @param status
         * @returns promise
         */
//        Room.prototype.addUser = function (user, status) {
//
//            var deferred = $q.defer();
//
//            // Are we able to invite the user?
//            // If the user is us or if the room is public then we can
//            if(user == $rootScope.user) {
//
//            }
//            else if(!this.canInviteUser() && status != bUserStatusOwner) {
//                $rootScope.showNotification(bNotificationTypeAlert, 'Invites disabled', 'The creator of this room has disabled invites', 'ok');
//                deferred.reject();
//                return deferred.promise;
//            }
//
//            // If the user is already a member of the
//            // room
//            var currentStatus = this.getUserStatus(user);
//            if(currentStatus && currentStatus != bUserStatusClosed) {
//                deferred.resolve();
//                return deferred.promise;
//            }
//            else {
//                setStatusForUser(this, user, status, true);
//            }
//        };

        Room.prototype.acceptInvitation = function () {
            return setStatusForUser(this, $rootScope.user, bUserStatusMember, true);
        };

        // Update the timestamp on the user status
        Room.prototype.updateUserStatusTime = function (user) {

            var deferred = $q.defer();

            var data = {
                time: Firebase.ServerValue.TIMESTAMP
            };

            var ref = Paths.roomUsersRef(this.meta.rid);
            ref.child(user.meta.uid).update(data, function (error) {
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
                        if((UserStore.users[user.uid].online || $rootScope.user.meta.uid == user.uid) && this.userIsActiveWithUID(user.uid)) {
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
            for(var i = 0; i < users.length; i++) {
                if(this.usersMeta[users[i].meta.uid]) {
                    usersInRoom++;
                }
            }
            return usersInRoom == users.length;
//            var totalUsers = 0;
//            for(var key in this.usersMeta) {
//                if(this.usersMeta.hasOwnProperty(key)) {
//                    totalUsers++;
//                }
//            }
//            return totalUsers == usersInRoom;
        };

        /**
         * This function will return the time in seconds
         * since a message was posted in the room - if
         *
         */
//        Room.prototype.timeSinceLastMessage = function () {
//
//            if(unORNull(this.meta.lastUpdated)) {
//                return 60 * 60 * 24 * 10;
//            }
//            else {
//                var date =  new Date(this.meta.lastUpdated);
//                var time = 0;
//                if(!date.now) {
//                    time = date.getTime();
//                }
//                else {
//                    time = date.now();
//                }
//                return time * 1000;
//            }
//
//        };

        /**
         * Checks the rooms meta data to see if it
         * is inactive
         * Rooms are considered inactive if:
         * - They've been created more than 3 days ago
         * - They have no users and no messages have been added in the last day
         * - They have users but no messages have been added in the last 2 days
         */
//        Room.prototype.isInactive = function () {
//
//            // If this is a static room then
//            // we just return
//            if(!this.meta.userCreated) {
//                return false;
//            }
//
//            var created = timeSince(this.meta.created);
//
//            // This is a room that was created before this patch
//            // went live - therefore we'll delete it
//            if(created < 0) {
//                return true;
//            }
//            else {
//
//                // If the room was created more than three days
//                // ago it's a candidate to be deleted
//                if(created > bDay * 3) {
//
//                    var lastUpdated = timeSince(this.meta.lastUpdated);
//
//                    // if there are no users check when
//                    if(this.onlineUserCount() == 0) {
//
//                        // Check when the last message was sent
//                        if(lastUpdated < 0 || lastUpdated > bDay) {
//                            return true;
//                        }
//                    }
//                    else {
//                        // Check when the last message was sent
//                        if(lastUpdated < 0 || lastUpdated > bDay * 2) {
//                            return true;
//                        }
//                    }
//                }
//            }
//            return false;
//        };

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
            this.sendMessage(url+','+url+',W'+width+"&H"+height, user, bMessageTypeImage);
        };

        Room.prototype.sendMessage = function (text, user, type) {

            if(!text || text.length === 0)
                return;

            var innerSendMessage = (function (text, user) {

                // Make the message
                var message = Message.buildMeta(this.meta.rid, user.meta.uid, text, type);

                // Get a ref to the room
                var ref = Paths.roomMessagesRef(this.meta.rid);

                // Add the message
                var newRef = ref.push();

                var deferred = $q.defer();

                newRef.setWithPriority(message.meta, Firebase.ServerValue.TIMESTAMP, function (error) {
                    if(!error) {
                        deferred.resolve(null);
                    }
                    else {
                        deferred.reject(error);
                    }
                });

                // Now update this room with this data
                var roomMetaRef = Paths.roomMetaRef(this.meta.rid);

                // Last message
                var p1 = this.setLastMessage(message, user);

                // The user's been active so update their status
                // with the current time
                this.updateUserStatusTime(user);

                // Avoid a clash..
                var p2 = this.entity.updateState(bMessagesPath);

                return $q.all([
                    deferred.promise, p1, p2
                ]);

            }).bind(this);

            innerSendMessage(text, user).then(function () {

            }, function (error) {
                // If there's an error update the state i.e. make sure we're online
                // and try to resend
                Presence.update().then(function () {
                    innerSendMessage(text, user);
                });

            });

            // Update the user's presence state
            //Presence.update();

        };

        Room.prototype.setLastMessage = function (message, user) {

            var deferred = $q.defer();

            var lastMessageMeta = message.meta;
            lastMessageMeta['userName'] = user.meta.name;

            var ref = Paths.roomLastMessageRef(this.meta.rid);
            ref.set(lastMessageMeta, function (error) {
                if(!error) {
                    deferred.resolve(null);
                }
                else {
                    deferred.reject(error);
                }
            });

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
            if(this.messages.length && this.lastMessage.meta.time) {

                this.loadingMoreMessages = true;

                // Also get the messages from the room
                var ref = Paths.roomMessagesRef(this.meta.rid).orderByPriority();

                ref = ref.endAt(this.messages[0].meta.time);
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

                    $rootScope.$broadcast(bLazyLoadedMessagesNotification, this, callback);

                }).bind(this);

                // Set a timeout for the query - if it's not finished
                // after 1 second finish it manually
                this.loadingTimer = $timeout(function () {
                    finishQuery();
                }, 1000);

                ref.on('child_added', (function (snapshot) {
                    var val = snapshot.val();
                    if(val) {
                        var message = new Message(snapshot.key(), val);
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
                return a.meta.time - b.meta.time;
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
                $rootScope.user.markRoomReadTime(this.meta.rid);

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

            this.showImage = this.type() == bRoomTypePublic;

            if(!image) {
                image = bDefaultRoomImage;
            }
            else {
                if(isData || image == bDefaultRoomImage) {
                    this.thumbnail = image;
                }
                else {
                    this.thumbnail = CloudImage.cloudImage(image, 30, 30);
                }
            }
        };

        Room.prototype.pushMeta = function () {

            var deferred = $q.defer();

            var ref = Paths.roomMetaRef(this.meta.rid);
            ref.update(this.meta, (function (error) {
                if(!error) {
                    deferred.resolve();
                    this.entity.updateState(bMetaKey);
                }
                else {
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };


        Room.prototype.sendBadgeChangedNotification = function () {
            $rootScope.$broadcast(bRoomBadgeChangedNotification, this);
        };

        Room.prototype.transcript = function () {

            var transcript = "";

            for(var i in this.messages) {
                if(this.messages.hasOwnProperty(i)) {
                    var m = this.messages[i];
                    transcript += Time.formatTimestamp(m.meta.time) + " " + m.user.meta.name + ": " + m.meta.text + "\n";
                }
            }

            return transcript;
        };

        /***********************************
         * TYPING INDICATOR
         */

        Room.prototype.startTyping = function (user) {
            // The user is typing...
            var ref = Paths.roomTypingRef(this.meta.rid).child(user.meta.uid);
            ref.set({name: user.meta.name});

            // If the user disconnects, tidy up by removing the typing
            // indicator
            ref.onDisconnect().remove();
        };

        Room.prototype.finishTyping = function (user) {
            var ref = Paths.roomTypingRef(this.meta.rid).child(user.meta.uid);
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
                open: this.open,
                //badge: this.badge,
                associatedUserID: this.associatedUserID,
                offset: this.offset,
                readTimestamp: this.readTimestamp
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
                this.open = sr.open;
                //this.badge = sr.badge;
                this.associatedUserID = sr.associatedUserID;
                this.offset = sr.offset;
                this.readTimestamp = sr.readTimestamp;

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
            return this.entity.pathOn(bMetaKey, (function (val) {
                if(val) {
                    this.meta = val;
                    this.update();
                }
            }).bind(this));
        };

        Room.prototype.metaOff = function () {
            this.entity.pathOff(bMetaKey);
        };

//        Room.prototype.setUsersMeta = function (val) {
//
//            var updateUser = (function (uid, userMeta) {
//                // If the user doesn't already exist add it
//                if(!this.usersMeta[uid]) {
//                    // Add the user
//                    addUser(uid, userMeta);
//                }
//                else {
//                    // Has the value changed?
//                    if(userMeta.time != this.usersMeta[uid].time) {
//                        // If the status is closed
//                        if(userMeta.status == bUserStatusClosed) {
//                            // Remove the user from the user list
//                            removeUser(uid);
//                        }
//                        else {
//                            addUser(uid, userMeta);
//                        }
//                    }
//                }
//
//            }).bind(this);
//
//            // TODO: Currently if a user goes offline they don't appear in the
//            // room. They'd have to enter and
//            var addUser = (function (uid, userMeta) {
//                if(Room.userIsActiveWithInfo(userMeta)) {
//                    //if(Cache.isOnlineWithUID(uid) || $rootScope.user.meta.uid == uid) {
//                    var user = UserStore.getOrCreateUserWithID(uid);
//                    this.users[user.meta.uid] = user;
//                    //}
//                }
//            }).bind(this);
//
//            var removeUser = (function (uid) {
//                delete this.users[uid];
//            }).bind(this);
//
//            var uid = null;
//
//            if(val) {
//                // Loop over the users and see if they're changed
//                for(uid in val) {
//                    if(val.hasOwnProperty(uid)) {
//                        updateUser(uid, val[uid]);
//                    }
//                }
//                this.usersMeta = val;
//                this.update();
//            }
//            else {
//                for(uid in this.usersMeta) {
//                    if(this.usersMeta.hasOwnProperty(uid)) {
//                        removeUser(uid);
//                    }
//                }
//                this.usersMeta = {};
//                this.update();
//            }
//        };

        Room.prototype.addUserMeta = function (meta) {
            if(Room.userIsActiveWithInfo(meta)) {
                this.usersMeta[meta.uid] = meta;

                // Add the user object
                var user = UserStore.getOrCreateUserWithID(meta.uid);
                this.users[user.meta.uid] = user;

                this.update(false);
            }
        };

        Room.prototype.removeUserMeta = function (meta) {
            delete this.usersMeta[meta.uid];
            delete this.users[meta.uid];
            this.update(false);
        };

        Room.prototype.usersMetaOn = function () {

            var roomUsersRef = Paths.roomUsersRef(this.meta.rid);

            roomUsersRef.on('child_added', (function (snapshot) {
                if(snapshot.val() && snapshot.val().uid) {
                    this.addUserMeta(snapshot.val());
                }
            }).bind(this));

            roomUsersRef.on('child_removed', (function (snapshot) {
                if(snapshot.val() && snapshot.val().uid) {
                    this.removeUserMeta(snapshot.val());
                }
            }).bind(this));
        };

        //Room.prototype.usersMetaOn = function () {
        //    return this.entity.pathOn(bUsersMetaPath, (function (val) {
        //        this.setUsersMeta(val);
        //    }).bind(this));
        //};

        Room.prototype.usersMetaOff = function () {
            //this.entity.pathOff(bUsersMetaPath);
            Paths.roomUsersRef(this.meta.rid).off();
        };

        Room.prototype.userDeletedDate = function () {

            var deferred = $q.defer();

            var ref = Paths.roomUsersRef(this.meta.rid).child($rootScope.user.meta.uid);
            ref.once('value',function (snapshot) {
                var val = snapshot.val();
                if(val && val.status == bUserStatusClosed) {
                    deferred.resolve(val.time);
                }
                else {
                    deferred.resolve(null);
                }
            });

            return deferred.promise;
        };

        Room.prototype.on = function () {

            var deferred = $q.defer();

            if(!this.isOn && this.meta && this.meta.rid) {
                this.isOn = true;

                this.userOnlineStateChangedNotificationOff = $rootScope.$on(bUserOnlineStateChangedNotification, (function (event, user) {
                    Log.notification(bUserOnlineStateChangedNotification, 'Room');

                    // If the user is a member of this room, update the room
                    this.update();
                }).bind(this));

                // Handle typing
                var ref = Paths.roomTypingRef(this.meta.rid);

                ref.on('child_added', (function (snapshot) {
                    this.typing[snapshot.key()] = snapshot.val().name;

                    this.updateTyping();

                    // Send a notification to the chat room
                    $rootScope.$broadcast(bChatUpdatedNotification, this);
                }).bind(this));

                ref.on('child_removed', (function (snapshot) {
                    delete this.typing[snapshot.key()];

                    this.updateTyping();

                    // Send a notification to the chat room
                    $rootScope.$broadcast(bChatUpdatedNotification, this);
                }).bind(this));

                // Listen to the last message
                var lastMessageRef = Paths.roomLastMessageRef(this.meta.rid);
                lastMessageRef.on('value', (function (snapshot) {
                    if(snapshot.val()) {
                        this.lastMessageMeta = snapshot.val();
                        this.update(false);
                    }
                }).bind(this));

                // Do we really need to use a promise here?
                // We do because we need to have the users meta
                // to know whether we're invited or a member
                // This should work anyway because the user status is pulled
                // dynamically
                this.metaOn();
                this.usersMetaOn();
            }

            deferred.resolve();
            return deferred.promise;
        };

        /**
         * Start listening to messages being added
         */

        Room.prototype.addMessageMeta = function (mid, val, serialization, silent) {

            if(!val || !val.text || val.text.length === 0) {
                return false;
            }

            // Check that the message doesn't already exist
            for(var i = 0; i < this.messages.length; i++) {
                if(this.messages[i].mid == mid) {
                    return false;
                }
            }

            if(this.lastMessage) {
                // Sometimes we get double messages
                // check that this message hasn't been added already
                if(this.lastMessage.mid == mid) {
                    return false;
                }
            }

            // Create the message object
            var message = new Message(mid, val);
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
                if(this.lastMessage) {

                    var lastMessage = this.lastMessage;

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


                this.messages.push(message);

                this.sortMessages();

                this.lastMessage = message;

            }

            // If the room is inactive or minimized increase the badge
            if((!this.active || this.minimized || !this.isOpen()) && !this.isPublic() && !message.read && (message.meta.time > this.readTimestamp || !this.readTimestamp)) {

                if(!this.unreadMessages) {
                    this.unreadMessages  = [];
                }

                this.unreadMessages.push(message);

                // If this is the first badge then this.badge will
                // undefined - so set it to one
                if(!this.badge) {
                    this.badge = 1;
                }
                else {
                    this.badge = Math.min(this.badge + 1, 99);
                }
                this.sendBadgeChangedNotification();
            }
            else {
                // Is the room active? If it is then mark the message
                // as seen
                message.markRead();
            }

            this.update(silent);

            return true;
        };

        Room.prototype.messagesOn = function (timestamp) {

            // Make sure the room is valid
            if(this.messagesAreOn || !this.meta || !this.meta.rid) {
                return;
            }
            this.messagesAreOn = true;

            // Also get the messages from the room
            var ref = Paths.roomMessagesRef(this.meta.rid);

            var startDate = timestamp;
            if(Utils.unORNull(startDate)) {
                // If we already have a message then only listen for new
                // messages
                if(this.lastMessage && this.lastMessage.meta.time) {
                    startDate = this.lastMessage.meta.time + 1;
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

                // If the user is blocked don't let the messages through
                if(Cache.isBlockedUser(snapshot.val().uid)) {
                    return;
                }

                this.deleted = false;
                //setStatusForUser(this, $rootScope.user, bUserStatusMember, false);

                if(this.addMessageMeta(snapshot.key(), snapshot.val())) {
                    // Trim the room to make sure the message count isn't growing
                    // out of control
                    this.trimMessageList();

                    // Is the window visible?
                    // Play the sound
                    if(!this.muted) {
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
                }

            }).bind(this));

            ref.on('child_removed', (function (snapshot) {
                if(snapshot.val()) {
                    for(var i = 0; i < this.messages.length; i++) {
                        var message = this.messages[i];
                        if(message.mid == snapshot.key()) {
                            this.messages.splice(i, 1);
                            break;
                        }
                    }
                    //$rootScope.$broadcast(bDeleteMessageNotification, snapshot.val().meta.mid);
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
            if(this.meta && this.meta.rid) {
                Paths.roomMessagesRef(this.meta.rid).off();
            }
        };

        Room.prototype.off = function () {

            this.isOn = false;

            if(this.userOnlineStateChangedNotificationOff) {
                this.userOnlineStateChangedNotificationOff();
            }

            var lastMessageRef = Paths.roomLastMessageRef(this.meta.rid);
            lastMessageRef.off();

            this.messagesOff();

            this.metaOff();
            this.usersMetaOff();

            // Get the room meta data
//                    Paths.roomMetaRef(this.meta.rid).off();
//                    Paths.roomUsersRef(this.meta.rid).off();
            Paths.roomTypingRef(this.meta.rid).off();
        };

        Room.prototype.increaseUserCount = function () {
            var metaRef = Paths.roomMetaRef(this.meta.rid).child(bUserCountKey);
            metaRef.transaction(function(value) {
                return value + 1;
            });
        };

        Room.prototype.decreaseUserCount = function () {
            var metaRef = Paths.roomMetaRef(this.meta.rid).child(bUserCountKey);
            metaRef.transaction(function(value) {
                return MAX(value - 1, 0);
            });
        };

        /**
         * If this public room doesn't already exist
         * add it to the list of public rooms
         * @returns {promise}
         */
//        Room.prototype.addToPublicRooms = function () {
//
//            var deferred = $q.defer();
//
//            // Does this room already exist?
//            var ref = Paths.publicRoomRef(this.getRID());
//            ref.once('value', (function(snapshot) {
//                if(!snapshot.val()) {
//                    ref.set({
//                        rid: this.meta.rid,
//                        created: Firebase.ServerValue.TIMESTAMP,
//                        userCreated: this.getUserCreated()
//                    }, function (error) {
//                        if(!error) {
//                            deferred.resolve();
//                        }
//                        else {
//                            deferred.reject(error);
//                        }
//                    });
//                }
//            }).bind(this));
//
//            return deferred.promise;
//        };

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
            return userStatus == bUserStatusMember || userStatus == bUserStatusOwner;

        };

        // **********************
        // *** Static methods ***
        // **********************

        Room.createRoom = function (name, description, invitesEnabled, type, weight) {
            return this.createRoomWithRID(null, name, description, invitesEnabled, type, true, weight);
        };

        Room.createRoomWithRID = function (rid, name, description, invitesEnabled, type, userCreated, weight) {

            var deferred = $q.defer();

            if(!rid) {
                rid = Paths.roomsRef().push().key();
            }
            var roomMeta = this.roomMeta(rid, name, description, true, invitesEnabled, type, weight);

            var roomMetaRef = Paths.roomMetaRef(rid);

            // Add the room to Firebase
            roomMetaRef.set(roomMeta, (function (error) {

                if(error) {
                    deferred.reject(error);
                }
                else {

                    this.addUserToRoom(rid, $rootScope.user, bUserStatusOwner, type);

                    if(type == bRoomTypePublic) {
                        var ref = Paths.publicRoomRef(rid);

                        var data = {
                            rid: rid,
                            created: Firebase.ServerValue.TIMESTAMP,
                            userCreated: true
                        };

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

                Entity.updateState(bRoomsPath, rid, bMetaKey);

            }).bind(this));

            return deferred.promise;
        };

        // Group chats should be handled separately to
        // private chats
        Room.updateRoomType = function (rid, type) {

            var deferred = $q.defer();

            var ref = Paths.roomMetaRef(rid);

            var data = {};
            data[bTypeKey] = type;

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
            return this.createRoom(name, description, true, bRoomTypePublic, weight);
        };

        Room.createPrivateRoom = function (users) {

            var deferred = $q.defer();

            // Since we're calling create room we will be added automatically
            this.createRoom(null, null, true, users.length == 1 ? bRoomType1to1 : bRoomTypeGroup).then((function (rid) {

                var promises = [];

                for (var i = 0; i < users.length; i++) {
                    promises.push(
                        this.addUserToRoom(rid, users[i], bUserStatusMember)
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

            var ref = Paths.roomUsersRef(room.meta.rid).child(user.meta.uid);

            var data = {
                status: status,
                uid: user.meta.uid,
                time: Firebase.ServerValue.TIMESTAMP
            };

            ref.update(data, (function (error) {
                if(!error) {
                    room.entity.updateState(bUsersMetaPath);
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

            var data = {
                status: status,
                uid: user.meta.uid,
                time: Firebase.ServerValue.TIMESTAMP
            };

            var d1 = $q.defer();

            var ref = Paths.roomUsersRef(rid).child(user.meta.uid);
            ref.update(data, function (error) {
                if(!error) {
                    d1.resolve();
                }
                else {
                    d1.reject(error);
                }
            });

            if(type == bRoomTypePublic) {
                ref.onDisconnect().remove();
            }

            var promises = [
                d1.promise,
                user.addRoomWithRID(rid, type)
            ];

            var deferred = $q.defer();

            $q.all(promises).then(function () {
                Entity.updateState(bRoomsPath, rid, bUsersMetaPath);

                deferred.resolve();

            }, function (error) {

                // Roll back the changes
                ref.remove();
                user.removeRoomWithRID(rid);

                deferred.reject(error);

            });

//            user.addRoomWithRID(rid).then(function () {
//                deferred.resolve();
//                Entity.updateState(bRoomsPath, rid, bUsersMetaPath);
//            }, function (error) {
//
//            });

            // TRAFFIC

            return deferred.promise;
        };

        Room.roomMeta = function (rid, name, description, userCreated, invitesEnabled, type, weight) {
            return {
                rid: rid ? rid : null,
                name: name ? name : null,
                invitesEnabled: !Utils.unORNull(invitesEnabled) ? invitesEnabled : true,
                description: description ? description : null,
                userCreated: !Utils.unORNull(userCreated) ? userCreated : true,
                // TODO: Depricated
                isPublic: !Utils.unORNull(type) ? type == bRoomTypePublic : false,
                created: Firebase.ServerValue.TIMESTAMP,
                weight: weight ? weight : 0,
                type: type
            }
        };

        Room.userIsActiveWithInfo = function (info) {
            // TODO: For the time being assume that users that
            // don't have this information are active
            if(info && info.status && info.time) {
                if(info.status != bUserStatusClosed) {
                    return Time.secondsSince(info.time) < 60 * 60 * 24;
                }
            }
            return true;
        };

        return Room;
}]);