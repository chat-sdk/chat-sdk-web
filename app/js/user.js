/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.user', ['firebase']);

myApp.factory('User', ['$rootScope', '$timeout', '$q', 'Entity', 'Cache', function ($rootScope, $timeout, $q, Entity, Cache) {
    return {

        buildUserWithID: function (uid) {

            var user = Entity.newEntity(bUsersPath, uid);

            user.meta =  {
                uid: uid,
                name: null,
                description: null,
                city: null,
                country: null,
                image: bDefaultProfileImage
            };

            // Start listening to the Firebase location
            user.on = function () {

                var metaPromise = user.pathOn(bMetaKey, function (val) {
                    if(val) {
                        user.meta = val;
                        // Here we want to update the
                        // - Main box
                        // - Every chat room that includes the user
                        // - User settings popup
                        $rootScope.$broadcast(bUserValueChangedNotification, user);
                    }
                });

                var thumbnailPromise = user.pathOn(bThumbnailKey, function (val) {
                    if(val) {
                        user.setThumbnail(val[bThumbnailKey]);
                    }
                    else {
                        user.setThumbnail(bDefaultProfileImage);
                    }
                });

                return $q.all([metaPromise, thumbnailPromise]);
            };

            // Stop listening to the Firebase location
            user.off = (function () {
                user.pathOff(bThumbnailKey);
                user.pathOff(bMetaKey);

            }).bind(this);

            user.imageOn = function () {

                return user.pathOn(bImageKey, function (val) {
                    if(val) {
                        user.setImage(val[bImageKey]);
                    }
                });
            };

            user.imageOff = function () {
                user.pathOff(bImageKey);
            };

            user.setThumbnail = function (imageData, push, isData) {
                var deferred = $q.defer();

                if(!imageData) {
                    imageData = bDefaultProfileImage;
                }

                if(imageData != bDefaultProfileImage && !isData) {
                    var prefix = 'http://skbb48.cloudimage.io/s/crop/30x30/';
                    if(imageData.length < prefix.length || imageData.slice(0, prefix.length) !== prefix) {
                        imageData = prefix+imageData;
                    }
                }

                if(imageData == user.thumbnail) {
                    deferred.resolve();
                    return deferred.promise;
                }

                user.thumbnail = imageData;

                // Don't try to update users are that aren't
                // the authenticated user
                if(user != $rootScope.user || !push) {
                    deferred.resolve();
                    return deferred.promise;
                }

                var data = {};
                data[bThumbnailKey] = user.thumbnail;

                // Set the image on Firebase
                var ref = Paths.userThumbnailRef(user.meta.uid);
                ref.set(data, function (error) {
                    if(!error) {
                        deferred.resolve();
                        user.updateState(bThumbnailKey);
                    }
                    else {
                        deferred.reject(error);
                    }
                });

                return deferred.promise;
            };

            user.pushMeta = function () {

                var deferred = $q.defer();

                var ref = Paths.userMetaRef(user.meta.uid);
                ref.update(user.meta, function (error) {
                    if(!error) {
                        deferred.resolve();
                        user.updateState(bMetaKey);
                    }
                    else {
                        deferred.reject(error);
                    }
                });

                return deferred.promise;
            };

            user.canBeInvitedByUser = function (invitingUser) {

                // This function should only ever be called on the root user
                if(user != $rootScope.user) {
                    console.log("Can be invited should only be called on the root user");
                    return false;
                }

                var allowInvites = user.meta.allowInvites;
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

            user.setImage = function (imageData, push, isData) {

                if(!imageData) {
                    imageData = bDefaultProfileImage;
                }

                if(imageData != bDefaultProfileImage && !isData) {
                    var prefix = 'http://skbb48.cloudimage.io/s/crop/100x100/';
                    if(imageData.length < prefix.length || imageData.slice(0, prefix.length) !== prefix) {
                        imageData = prefix+imageData;
                    }
                }

                var deferred = $q.defer();

                if(imageData == user.image) {
                    deferred.resolve();
                    return deferred.promise;
                }

                user.image = imageData;

                // Set the image on Firebase
                var ref = Paths.userImageRef(user.meta.uid);

                // Don't try to update users are that aren't
                // the authenticated user
                if(user != $rootScope.user || !push) {
                    deferred.resolve();
                    return deferred.promise;
                }

                var data = {};
                data[bImageKey] = user.image;

                ref.set(data, function (error) {
                    if(!error) {
                        deferred.resolve();
                        user.updateState(bImageKey);
                    }
                    else {
                        deferred.reject(error);
                    }
                });

                return deferred.promise;
            };

            user.isImage = function (src) {

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

            user.hasImage = function () {
                return user.image && user.image != bDefaultProfileImage;
            };

            user.hasThumbnail = function () {
                return user.thumbnail && user.thumbnail != bDefaultProfileImage;
            };

            user.getImage = function () {
                if(user.hasImage()) {
                    return user.image;
                }
                else {
                    return bDefaultProfileImage;
                }
            };

            user.getThumbnail = function () {
                if(user.hasThumbnail()) {
                    return user.thumbnail;
                }
                else {
                    return user.getImage();
                }
            };

            user.addRoomWithRID = function (rid) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(rid);
                ref.update({
                    rid: rid,
                    invitedBy: $rootScope.user.meta.uid
                });
                user.updateState(bRoomsPath);
            };

            user.addRoom = function (room) {
                this.addRoomWithRID(room.meta.rid);
            };

            user.removeRoom = function (room) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.remove();
                user.updateState(bRoomsPath);
            };

            user.addFriend = function (friend) {
                var ref = Paths.userFriendsRef(user.meta.uid);
                ref = ref.push();
                ref.set({uid: friend.meta.uid});
                user.updateState(bFriendsPath);
            };

            user.removeFriend = function (friend) {
                // This method is added to the prototype when the friend is
                // added initially
                friend.removeFriend();
                friend.removeFriend = null;
                user.updateState(bFriendsPath);
            };

            user.blockUser = function (block) {
                var ref = Paths.userBlockedRef(user.meta.uid);

                var data = {};
                data[block.meta.uid] = {uid: block.meta.uid};
                ref.set(data);
                user.updateState(bBlockedPath);
            };

            user.unblockUser = function (block) {
                block.unblock();
                block.unblock = null;
                user.updateState(bBlockedPath);
            };

//            user.updateRoomSlot = function (room, slot) {
//                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
//                ref.update({slot: slot});
//            };

            var _superS = user.serialize;
            user.serialize = function () {
                return {
                    meta: user.meta ? user.meta : {},
                    _super: _superS(),
                    thumbnail: user.thumbnail,
                    image: user.image
                }
            };

            var _superD = user.deserialize;
            user.deserialize = function (su) {
                if(su) {
                    _superD(su._super);
                    user.meta = su.meta;
                    user.setThumbnail(su.thumbnail);
                    user.setImage(su.image);
                }
            };

            return user;
        }

    };
}]);
