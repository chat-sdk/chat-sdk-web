/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.user', ['firebase']);

myApp.factory('User', ['$rootScope', '$timeout', '$q', 'Entity', 'Utils', 'Paths', 'CloudImage', 'Environment',
    function ($rootScope, $timeout, $q, Entity, Utils, Paths, CloudImage, Environment) {

        function User (uid) {

            this.setImageURL(Environment.defaultProfilePictureURL());
            this.setUID(uid);
            this.setAllowInvites(bUserAllowInvitesEveryone);

            //this._id = uid
            this.entity = new Entity(bUsersPath, uid);
        }

        User.prototype.getMeta = function() {
            if(Utils.unORNull(this.meta)) {
                this.meta = {};
            }
            return this.meta;
        };

        User.prototype.getMetaValue = function(key) {
            return this.getMeta()[key];
        };

        User.prototype.metaValue = function (key) {
            return this.getMetaValue(key);
        };

        User.prototype.setMetaValue = function(key, value) {
            return this.getMeta()[key] = value;
        };

        User.prototype.getName  = function () {
            return this.getMetaValue(bUserName);
        };

        User.prototype.setName  = function (name) {
            return this.setMetaValue(bUserName, name);
        };

        User.prototype.name = function name (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getStatus  = function () {
            return this.getMetaValue(bUserStatus);
        };

        User.prototype.setStatus  = function (status) {
            return this.setMetaValue(bUserStatus, status);
        };

        // For Angular getterSetter binding
        User.prototype.status = function status (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getLocation  = function () {
            return this.getMetaValue(bUserLocation);
        };

        User.prototype.setLocation  = function (location) {
            return this.setMetaValue(bUserLocation, location);
        };

        User.prototype.location = function location (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getCountryCode  = function () {
            return this.getMetaValue(bUserCountryCode);
        };

        User.prototype.setCountryCode  = function (countryCode) {
            return this.setMetaValue(bUserCountryCode, countryCode);
        };

        User.prototype.countryCode = function countryCode (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getGender  = function () {
            return this.getMetaValue(bUserGender);
        };

        User.prototype.setGender  = function (gender) {
            return this.setMetaValue(bUserGender, gender);
        };

        User.prototype.gender = function gender (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getProfileLink  = function () {
            return this.getMetaValue(bUserProfileLink);
        };

        User.prototype.setProfileLink  = function (profileLink) {
            return this.setMetaValue(bUserProfileLink, profileLink);
        };

        User.prototype.profileLink = function profileLink (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getHomepageLink  = function () {
            return this.getMetaValue(bUserHomepageLink);
        };

        User.prototype.setHomepageLink  = function (homepageLink) {
            return this.setMetaValue(bUserHomepageLink, homepageLink);
        };

        User.prototype.homepageLink = function homepageLink (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getHomepageText  = function () {
            return this.getMetaValue(bUserHomepageText);
        };

        User.prototype.setHomepageText  = function (homepageText) {
            return this.setMetaValue(bUserHomepageText, homepageText);
        };

        User.prototype.homepageText = function homepageText (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getProfileHTML  = function () {
            return this.getMetaValue(bUserProfileHTML);
        };

        User.prototype.setProfileHTML  = function (profileHTML) {
            return this.setMetaValue(bUserProfileHTML, profileHTML);
        };

        User.prototype.profileHTML = function profileHTML (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getAllowInvites  = function () {
            return this.getMetaValue(bUserAllowInvites);
        };

        User.prototype.setAllowInvites  = function (allowInvites) {
            return this.setMetaValue(bUserAllowInvites, allowInvites);
        };

        User.prototype.allowInvites = function allowInvites (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        User.prototype.getImageURL = function () {
            return this.getMetaValue(bUserImageURL);
        };

        User.prototype.setImageURL = function(imageURL) {
            this.setMetaValue(bUserImageURL, imageURL);
        };

        User.prototype.imageURL = function imageURL (value) {
            return this.handleAngularGetterSetter(arguments, value);
        };

        // This should be called with the function 'arguments' variable. Then we can
        // extract the function name and call the function dynamically
        User.prototype.handleAngularGetterSetter = function (functionArguments, value) {

            functionName = functionArguments.callee.toString().substr('function '.length);
            functionName = functionName.substr(0, functionName.indexOf('('));

            functionName = functionName.charAt(0).toUpperCase() + functionName.slice(1);
            if(Utils.unORNull(value)) {
                // Make the getter
                functionName = "get" + functionName;
                if(typeof this[functionName] === 'function') {
                    return this[functionName]();
                }
            }
            else {
                // Make the setter
                functionName = "set" + functionName;
                if(typeof this[functionName] === 'function') {
                    return this[functionName](value);
                }
            }
        };

        User.prototype.on = function () {

            if(this.entity.pathIsOn[bMetaKey]) {
                return;
            }

            var ref = Paths.userOnlineRef(this.uid());
            ref.on('value', (function (snapshot) {
                if(!Utils.unORNull(snapshot.val())) {
                    this.online = snapshot.val();
                    if(this.online) {
                        $rootScope.$broadcast(bOnlineUserAddedNotification);
                    }
                    else {
                        $rootScope.$broadcast(bOnlineUserRemovedNotification);
                    }
                }
            }).bind(this));

            return this.entity.pathOn(bMetaKey, (function (val) {
                if(val) {
                    this.meta = val;

                    // Update the user's thumbnail
                    this.setImage(this.imageURL());

                    // Here we want to update the
                    // - Main box
                    // - Every chat room that includes the user
                    // - User settings popup
                    $rootScope.$broadcast(bUserValueChangedNotification, this);
                }
            }).bind(this));
        };

        // Stop listening to the Firebase location
        User.prototype.off = function () {
            this.entity.pathOff(bMetaKey);
            Paths.userOnlineRef(this.uid()).off();
        };

        User.prototype.pushMeta = function () {

            var deferred = $q.defer();

            var ref = Paths.userMetaRef(this.uid());
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

        User.prototype.canBeInvitedByUser = function (invitingUser) {

            // This function should only ever be called on the root user
            if(this != $rootScope.user) {
                console.log("Can be invited should only be called on the root user");
                return false;
            }

            if(invitingUser == $rootScope.user) {
                return true;
            }

            var allowInvites = this.allowInvites();
            if(Utils.unORNull(allowInvites) || allowInvites == bUserAllowInvitesEveryone) {
                return true;
            }
    //        else if (allowInvites == bUserAllowInvitesFriends) {
    //            return FriendsConnector.isFriend(invitingUser);
    //        }
            else {
                return false;
            }
        };

        User.prototype.allowInvites = function () {
            return this.getAllowInvites();
        };

        User.prototype.allowInvitesFrom = function (type) {
            return this.allowInvites() == type;
        };

        User.prototype.updateImageURL = function (imageURL) {
            // Compare to the old URL
            var imageChanged = imageURL != this.imageURL();
            if(imageChanged) {
                this.setMetaValue(bUserImageURL, imageURL);
                this.setImageURL(imageURL);
                this.setImage(imageURL, false);
                this.pushMeta();
            }
        };

        User.prototype.setImage = function (image, isData) {
            if(image === undefined) {
                // TODO: Improve this
                this.image = Environment.defaultProfilePictureURL();
            }
            else if(isData || image == Environment.defaultProfilePictureURL()) {
                this.image = image;
                this.thumbnail = image;
            }
            else {
                this.image = CloudImage.cloudImage(image, 100, 100);
                this.thumbnail = CloudImage.cloudImage(image, 30, 30);
            }
        };

        User.prototype.isMe = function () {
            return this.uid() == $rootScope.user.uid();
        };

        User.prototype.getThumbnail = function () {
            if(Utils.unORNull(this.thumbnail)) {
                return Environment.defaultProfilePictureURL();
            }
            return this.thumbnail;
        };

        User.prototype.getAvatar = function () {
            if(Utils.unORNull(this.image)) {
                return Environment.defaultProfilePictureURL();
            }
            return this.image;
        };

        User.prototype.hasImage = function () {
            return this.image && this.image != Environment.defaultProfilePictureURL;
        };

        User.prototype.addRoom = function (room) {
            return this.addRoomWithRID(room.rid(), room.type());
        };

        User.prototype.addRoomWithRID = function (rid, type) {

            var deferred = $q.defer();

            var ref = Paths.userRoomsRef(this.uid()).child(rid);

            var data = {
                invitedBy: $rootScope.user.uid()
            };

            ref.update(data, (function (error) {
                if(!error) {
                    deferred.resolve();
                    this.entity.updateState(bRoomsPath);
                }
                else {
                    deferred.reject(error);
                }
            }).bind(this));

            //if(type == bRoomTypePublic) {
            //    ref.onDisconnect().remove();
            //}

            return deferred.promise;
        };

        User.prototype.removeRoom = function (room) {
            return this.removeRoomWithRID(room.rid());
        };

        User.prototype.removeRoomWithRID = function (rid) {

            var deferred = $q.defer();

            var ref = Paths.userRoomsRef(this.uid()).child(rid);
            ref.remove((function (error) {
                if(!error) {
                    deferred.resolve();
                    this.entity.updateState(bRoomsPath);
                }
                else {
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        User.prototype.addFriend = function (friend) {
            if(friend && friend.meta && friend.uid()) {
                return this.addFriendWithUID(friend.uid());
            }
        };

        User.prototype.addFriendWithUID = function (uid) {
            var deferred = $q.defer();

            var ref = Paths.userFriendsRef(this.uid());
            var data = {};
            data[uid] = {uid: uid};

            ref.update(data, (function (error) {
                if(!error) {
                    deferred.resolve();
                    this.entity.updateState(bFriendsPath);
                }
                else {
                    deferred.reject(error);
                }
            }).bind(this));

            return deferred.promise;
        };

        User.prototype.uid = function () {
            return this.entity._id;
        };

        User.prototype.setUID = function (uid) {
            return this.meta.uid = uid;
        };

        User.prototype.removeFriend = function (friend) {
            // This method is added to the object when the friend is
            // added initially
            friend.removeFriend();
            friend.removeFriend = null;
            this.entity.updateState(bFriendsPath);
        };

        User.prototype.blockUserWithUID = function (uid) {
            var deferred = $q.defer();

            var ref = Paths.userBlockedRef(this.uid());
            var data = {};
            data[uid] = {uid: uid};
            ref.update(data, (function (error) {
                if(error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve();
                }
            }).bind(this));
            this.entity.updateState(bBlockedPath);
            return deferred.promise;
        };

        User.prototype.markRoomReadTime = function (rid) {

            var deferred = $q.defer();

            var ref = Paths.userRoomsRef(this.uid()).child(rid);

            var data = {};
            data[bReadKey] = firebase.database.ServerValue.TIMESTAMP;

            ref.update(data, function (error) {
                if(!error) {
                    deferred.resolve();
                }
                else {
                    deferred.reject(error);
                }
            });

            return deferred.promise;
        };

        User.prototype.blockUser = function (block) {
            if(block && block.meta && block.uid()) {
                this.blockUserWithUID(block.uid());
            }
        };

        User.prototype.unblockUser = function (block) {
            block.unblock();
            block.unblock = null;
            this.entity.updateState(bBlockedPath);
        };

        User.prototype.serialize = function () {
            return {
                meta: this.meta ? this.meta : {},
                _super: this.entity.serialize()
                //thumbnail: this.thumbnail,
                //image: this.image
            }
        };

        User.prototype.deserialize = function (su) {
            if(su) {
                this.entity.deserialize(su._super);
                this.meta = su.meta;
                //this.setThumbnail(su.thumbnail);
                this.setImage(su.meta[bUserImageURL]);
            }
        };


        return User;

}]);
