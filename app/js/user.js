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

                if(imageData != bDefaultProfileImage && !isData) {
                    imageData = 'http://skbb48.cloudimage.io/s/crop/30x30/'+imageData;
                }

                if(imageData && imageData == user.thumbnail) {
                    deferred.resolve();
                    return deferred.promise;
                }

                user.thumbnail = imageData ? imageData : bDefaultProfileImage;

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

                if(imageData != bDefaultProfileImage && !isData) {
                    imageData = 'http://skbb48.cloudimage.io/s/crop/100x100/'+imageData;
                }

                var deferred = $q.defer();

                if(imageData && imageData == user.image) {
                    deferred.resolve();
                    return deferred.promise;
                }

                user.image = imageData ? imageData : bDefaultProfileImage;

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

            user.addRoom = function (room) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.update({
                    rid: room.meta.rid,
                    invitedBy: $rootScope.user.meta.uid
                });
                user.updateState(bRoomsPath);
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

            user.serialize = function () {
                return user.meta;
            };

            user.deserialize = function (su) {
                user.meta = su;
            };

            return user;
        }

    };
}]);
