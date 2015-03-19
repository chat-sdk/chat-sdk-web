/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.user', ['firebase']);

myApp.factory('User', ['$rootScope', '$timeout', '$q', 'Entity', 'Cache', 'Defines', function ($rootScope, $timeout, $q, Entity, Cache, Defines) {

    function User (uid) {
        this.meta =  {
            uid: uid,
            name: null,
            description: null,
            city: null,
            country: null,
            image: bDefaultProfileImage
        };
        //this._id = uid
        this.entity = new Entity(bUsersPath, uid);
    }

    //User.prototype = new Entity(bUsersPath, null);
    //User.prototype.constructor = User;

    User.prototype.on = function () {
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
        ///this.pathOff(bThumbnailKey);
        this.entity.pathOff(bMetaKey);

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

        var allowInvites = this.meta.allowInvites;
        if(unORNull(allowInvites) || allowInvites == 'Everyone') {
            return true;
        }
        else if (allowInvites == 'Friends') {
            return Cache.isFriend(invitingUser);
        }
        else {
            return false;
        }
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
            if(snapshot.value) {
                var imageURL = snapshot.value['image'];
                if(imageURL) {
                    var parts = imageURL.split('http://');
                    if(parts.length > 1 && parts[1].length) {
                        this.setImage('http://' + parts[1]);
                    }
                    else {
                        this.setImage(bDefaultProfileImage);
                    }
                }
            }
        }).bind(this));
    };

    User.prototype.setImage = function (image, isData) {
        if(!image) {
            this.migrateFromOldImageSystem();
        }
        else {
            if(isData || this.image == bDefaultProfileImage) {
                this.image = image;
                this.thumbnail = image;
            }
            else {
                this.image = 'http://' + Defines.cloudImageToken + '.cloudimage.io/s/crop/100x100/' + image;
                this.thumbnail = 'http://' + Defines.cloudImageToken + '.cloudimage.io/s/crop/30x30/' + image;
            }
        }
    };

    User.prototype.isImage = function (src) {

        var deferred = $q.defer();

        var image = new Image();
        image.onerror = function() {
            deferred.reject();
        };
        image.onload = function() {
            deferred.resolve();
        };
        image.src = src;

        return deferred.promise;
    };

    User.prototype.hasImage = function () {
        return this.image && this.image != bDefaultProfileImage;
    };

    User.prototype.addRoom = function (room) {
        return this.addRoomWithRID(room.meta.rid);
    };

    User.prototype.addRoomWithRID = function (rid) {

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

//    return {
//
//
//        buildUserWithID: function (uid) {
//
//            var user = new Entity(bUsersPath, uid);
//
//            user.meta =  {
//                uid: uid,
//                name: null,
//                description: null,
//                city: null,
//                country: null,
//                image: bDefaultProfileImage
//            };
//
//            // Start listening to the Firebase location
//            user.on = function () {
//
//                return user.pathOn(bMetaKey, function (val) {
//                    if(val) {
//                        user.meta = val;
//
//                        // Update the user's thumbnail
//                        user.setImage(user.meta.image);
//
//                        // Here we want to update the
//                        // - Main box
//                        // - Every chat room that includes the user
//                        // - User settings popup
//                        $rootScope.$broadcast(bUserValueChangedNotification, user);
//                    }
//                });
//
//            };
//
//            // Stop listening to the Firebase location
//            user.off = (function () {
//                ///user.pathOff(bThumbnailKey);
//                user.pathOff(bMetaKey);
//
//            }).bind(this);
//
//            user.pushMeta = function () {
//
//                var deferred = $q.defer();
//
//                var ref = Paths.userMetaRef(user.meta.uid);
//                ref.update(user.meta, function (error) {
//                    if(!error) {
//                        deferred.resolve();
//                        user.updateState(bMetaKey);
//                    }
//                    else {
//                        deferred.reject(error);
//                    }
//                });
//
//                return deferred.promise;
//            };
//
//            user.canBeInvitedByUser = function (invitingUser) {
//
//                // This function should only ever be called on the root user
//                if(user != $rootScope.user) {
//                    console.log("Can be invited should only be called on the root user");
//                    return false;
//                }
//
//                var allowInvites = user.meta.allowInvites;
//                if(unORNull(allowInvites) || allowInvites == 'Everyone') {
//                    return true;
//                }
//                else if (allowInvites == 'Friends') {
//                    return Cache.isFriend(invitingUser);
//                }
//                else {
//                    return false;
//                }
//            };
//
//            user.updateImageURL = function (imageURL) {
//                // Compare to the old URL
//                var imageChanged = imageURL != user.meta.image;
//                if(imageChanged) {
//                    user.meta.image = imageURL;
//                    user.setImage(imageURL, false);
//                    user.pushMeta();
//                }
//            };
//
//            user.migrateFromOldImageSystem = function () {
//                var imageRef = Paths.userImageRef(user.meta.uid);
//                imageRef.once('value', function (snapshot) {
//                    if(snapshot.value) {
//                        var imageURL = snapshot.value['image'];
//                        if(imageURL) {
//                            var parts = imageURL.split('http://');
//                            if(parts.length > 1 && parts[1].length) {
//                                user.setImage('http://' + parts[1]);
//                            }
//                            else {
//                                user.setImage(bDefaultProfileImage);
//                            }
//                        }
//                    }
//                });
//            };
//
//            user.setImage = function (image, isData) {
//                if(!image) {
//                    user.migrateFromOldImageSystem();
//                }
//                else {
//                    if(isData || user.image == bDefaultProfileImage) {
//                        user.image = image;
//                        user.thumbnail = image;
//                    }
//                    else {
//                        user.image = 'http://' + Defines.cloudImageToken + '.cloudimage.io/s/crop/100x100/' + image;
//                        user.thumbnail = 'http://' + Defines.cloudImageToken + '.cloudimage.io/s/crop/30x30/' + image;
//                    }
//                }
//            };
//
//            user.isImage = function (src) {
//
//                var deferred = $q.defer();
//
//                var image = new Image();
//                image.onerror = function() {
//                    deferred.reject();
//                };
//                image.onload = function() {
//                    deferred.resolve();
//                };
//                image.src = src;
//
//                return deferred.promise;
//            };
//
//            user.hasImage = function () {
//                return user.image && user.image != bDefaultProfileImage;
//            };
//
//            user.addRoomWithRID = function (rid) {
//                var ref = Paths.userRoomsRef(user.meta.uid).child(rid);
//                ref.update({
//                    rid: rid,
//                    invitedBy: $rootScope.user.meta.uid
//                });
//                user.updateState(bRoomsPath);
//            };
//
//            user.addRoom = function (room) {
//                this.addRoomWithRID(room.meta.rid);
//            };
//
//            user.removeRoom = function (room) {
//                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
//                ref.remove();
//                user.updateState(bRoomsPath);
//            };
//
//            user.addFriendWithUID = function (uid) {
//                var deferred = $q.defer();
//
//                var ref = Paths.userFriendsRef(user.meta.uid);
//                var data = {};
//                data[uid] = {uid: uid};
//                ref.update(data, (function (error) {
//                    if(error) {
//                        deferred.reject(error);
//                    }
//                    else {
//                        deferred.resolve();
//                    }
//                }).bind(this));
//                user.updateState(bFriendsPath);
//                return deferred.promise;
//            };
//
//            user.addFriend = function (friend) {
//                if(friend && friend.meta && friend.meta.uid) {
//                    user.addFriendWithUID(friend.meta.uid);
//                }
//            };
//
//            user.removeFriend = function (friend) {
//                // This method is added to the prototype when the friend is
//                // added initially
//                friend.removeFriend();
//                friend.removeFriend = null;
//                user.updateState(bFriendsPath);
//            };
//
//            user.blockUserWithUID = function (uid) {
//                var deferred = $q.defer();
//
//                var ref = Paths.userBlockedRef(user.meta.uid);
//                var data = {};
//                data[uid] = {uid: uid};
//                ref.update(data, (function (error) {
//                    if(error) {
//                        deferred.reject(error);
//                    }
//                    else {
//                        deferred.resolve();
//                    }
//                }).bind(this));
//                user.updateState(bBlockedPath);
//                return deferred.promise;
//            };
//
//            user.blockUser = function (block) {
//                if(block && block.meta && block.meta.uid) {
//                    user.blockUserWithUID(block.meta.uid);
//                }
//            };
//
//            user.unblockUser = function (block) {
//                block.unblock();
//                block.unblock = null;
//                user.updateState(bBlockedPath);
//            };
//
//            var _superS = user.serialize;
//            user.serialize = function () {
//                return {
//                    meta: user.meta ? user.meta : {},
//                    _super: _superS()
//                    //thumbnail: user.thumbnail,
//                    //image: user.image
//                }
//            };
//
//            var _superD = user.deserialize;
//            user.deserialize = function (su) {
//                if(su) {
//                    _superD(su._super);
//                    user.meta = su.meta;
//                    //user.setThumbnail(su.thumbnail);
//                    user.setImage(su.meta.image);
//                }
//            };
//
//            return user;
//        }
//
//    };
}]);
