/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.user', ['firebase']);

myApp.factory('User', ['$rootScope', '$timeout', '$q', 'Entity', 'Defines', 'Utils', 'Paths', 'CloudImage',
    function ($rootScope, $timeout, $q, Entity, Defines, Utils, Paths, CloudImage) {

    function User (uid) {
        this.meta =  {
            uid: uid,
            name: null,
            description: null,
            city: null,
            country: null,
            image: bDefaultProfileImage,
            allowInvites: bUserAllowInvitesEveryone
        };
        //this._id = uid
        this.entity = new Entity(bUsersPath, uid);
    }

    User.prototype.on = function () {

        if(this.entity.pathIsOn[bMetaKey]) {
            return;
        }

        var ref = Paths.userOnlineRef(this.meta.uid);
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
                this.setImage(this.meta.image);

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
        Paths.userOnlineRef(this.meta.uid).off();
    };

    User.prototype.pushMeta = function () {

        var deferred = $q.defer();

        var ref = Paths.userMetaRef(this.meta.uid);
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
        return this.meta.allowInvites;
    };

    User.prototype.allowInvitesFrom = function (type) {
        return this.allowInvites() == type;
    };

    User.prototype.updateImageURL = function (imageURL) {
        // Compare to the old URL
        var imageChanged = imageURL != this.meta.image;
        if(imageChanged) {
            this.meta.image = imageURL;
            this.setImage(imageURL, false);
            this.pushMeta();
        }
    };

    User.prototype.migrateFromOldImageSystem = function () {
        var imageRef = Paths.userImageRef(this.meta.uid);
        imageRef.once('value', (function (snapshot) {
            var image = null;
            if(snapshot.value) {
                var imageURL = snapshot.value['image'];
                if(imageURL) {
                    var parts = imageURL.split('http://');
                    if(parts.length > 1 && parts[1].length) {
                        image = 'http://' + parts[1];
                    }
                }
            }
            this.setImage(image ? image : bDefaultProfileImage);

        }).bind(this));
    };

    User.prototype.setImage = function (image, isData) {
        if(!image) {
            this.migrateFromOldImageSystem();
        }
        else {
            if(isData || image == bDefaultProfileImage) {
                this.image = image;
                this.thumbnail = image;
            }
            else {
                this.image = CloudImage.cloudImage(image, 100, 100);
                this.thumbnail = CloudImage.cloudImage(image, 30, 30);
//                this.image = 'http://' + Defines.cloudImageToken + '.cloudimage.io/s/crop/100x100/' + image;
//                this.thumbnail = 'http://' + Defines.cloudImageToken + '.cloudimage.io/s/crop/30x30/' + image;
            }
        }
    };

//    User.prototype.isImage = function (src) {
//
//        var deferred = $q.defer();
//
//        var image = new Image();
//        image.onerror = function() {
//            deferred.reject();
//        };
//        image.onload = function() {
//            deferred.resolve();
//        };
//        image.src = src;
//
//        return deferred.promise;
//    };
    User.prototype.isMe = function () {
        return this.meta.uid == $rootScope.user.meta.uid;
    };

    User.prototype.hasImage = function () {
        return this.image && this.image != bDefaultProfileImage;
    };

    User.prototype.addRoom = function (room) {
        return this.addRoomWithRID(room.meta.rid, room.type());
    };

    User.prototype.addRoomWithRID = function (rid, type) {

        var deferred = $q.defer();

        var ref = Paths.userRoomsRef(this.meta.uid).child(rid);

        var data = {
            rid: rid,
            invitedBy: $rootScope.user.meta.uid
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
        return this.removeRoomWithRID(room.meta.rid);
    };

    User.prototype.removeRoomWithRID = function (rid) {

        var deferred = $q.defer();

        var ref = Paths.userRoomsRef(this.meta.uid).child(rid);
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
        if(friend && friend.meta && friend.meta.uid) {
            return this.addFriendWithUID(friend.meta.uid);
        }
    };

    User.prototype.addFriendWithUID = function (uid) {
        var deferred = $q.defer();

        var ref = Paths.userFriendsRef(this.meta.uid);
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

    User.prototype.removeFriend = function (friend) {
        // This method is added to the object when the friend is
        // added initially
        friend.removeFriend();
        friend.removeFriend = null;
        this.entity.updateState(bFriendsPath);
    };

    User.prototype.blockUserWithUID = function (uid) {
        var deferred = $q.defer();

        var ref = Paths.userBlockedRef(this.meta.uid);
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

        var ref = Paths.userRoomsRef(this.meta.uid).child(rid);

        var data = {};
        data[bReadKey] = Firebase.ServerValue.TIMESTAMP;

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
        if(block && block.meta && block.meta.uid) {
            this.blockUserWithUID(block.meta.uid);
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
            this.setImage(su.meta.image);
        }
    };

    return User;

}]);
