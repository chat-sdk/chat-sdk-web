/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.user', ['firebase']);

myApp.factory('User', ['$rootScope', '$timeout', '$q', 'Entity', function ($rootScope, $timeout, $q, Entity) {
    return {

//        getOrCreateUserWithID: function(uid) {
//            var user = Cache.getUserWithID(uid);
//            if(!user) {
//                user = this.buildUserWithID(uid);
//                Cache.addUser(user);
//            }
//            user.on();
//            return user;
//        },

        // Create a new template object
        // This is mainly useful to have the data
        // structure clearly defined
//        newUser: function (uid) {
//
//            var user = Entity.newEntity(bUsersPath, uid);
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
//            user.serialize = function () {
//                return user.meta;
//            };
//
//            user.deserialize = function (su) {
//                user.meta = su;
//            };
//
//
//            return user;
//        },

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
            user.on = (function () {

                user.pathOn(bMetaKey, function (val) {
                    if(val) {

                        // TODO: iss201 - Shim while we're moving user image
                        if(val.image) {
                            user.setImage(val.image);
                        }

                        // Here we want to update the
                        // - Main box
                        // - Every chat room that includes the user
                        // - User settings popup
                        $rootScope.$broadcast(bUserValueChangedNotification, user);
                    }
                });

                user.pathOn(bThumbnailKey, function (val) {
                    if(val) {
                        user.setThumbnail(val[bThumbnailKey]);
                    }
                    else {
                        user.setThumbnail(bDefaultProfileImage);
                    }
                });
//
                return;

                if(user.isOn) {
                    return;
                }
                user.isOn = true;

                user.metaOn();
                //user.thumbnailOn();

            }).bind(this);

            user.metaOn = function () {
                if(user.isMetaOn) {
                    return;
                }
                user.isMetaOn = true;

                var ref = Paths.userMetaRef(uid);

                // Add a method to listen for updates to this user
                ref.on('value',(function(snapshot) {

                    user.meta = snapshot.val();

                    // TODO: iss201 - Shim while we're moving user image
                    if(snapshot.val().image) {
                        user.setImage(snapshot.val().image);
                    }

                    // Here we want to update the
                    // - Main box
                    // - Every chat room that includes the user
                    // - User settings popup
                    $rootScope.$broadcast(bUserValueChangedNotification, user);

                }).bind(this));
            };

            user.metaOff = function () {
                user.isMetaOn = false;

                var ref = Paths.userMetaRef(uid);
                ref.off('value');
            };

            // Stop listening to the Firebase location
            user.off = (function () {
                user.isOn = false;
                user.metaOff();
            }).bind(this);

            user.imageOn = function () {

                if(user.isImageOn) {
                    return;
                }
                user.isImageOn = true;

                var ref = Paths.userImageRef(user.meta.uid);
                ref.on('value', function (snapshot) {
                    if(snapshot && snapshot.val()) {
                        user.setImage(snapshot.val()[bImageKey]);
                    }
                });
            };

            user.imageOff = function () {
                user.isImageOn = false;
                var ref = Paths.userImageRef(user.meta.uid);
                ref.off('value');
            };

            user.thumbnailOn = function () {

                if(user.isThumbnailOn) {
                    return;
                }
                user.isThumbnailOn = true;

                var ref = Paths.userThumbnailRef(user.meta.uid);
                ref.on('value', function (snapshot) {
                    if(snapshot && snapshot.val()) {
                        user.setThumbnail(snapshot.val()[bThumbnailKey]);
                    }
                    else {
                        user.setThumbnail(bDefaultProfileImage);
                    }
                });
            };

            user.updateRooms = function () {
            };

            user.thumbnailOff = function () {
                user.isThumbnailOn = false;
                var ref = Paths.userThumbnailRef(user.meta.uid);
                ref.off('value');
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
                    // TODO: iss201 Shim
                    if(user.meta.image) {
                        return user.meta.image;
                    }
                    else {
                        return bDefaultProfileImage;
                    }
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
            };

            user.removeRoom = function (room) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.remove();
            };

            user.addFriend = function (friend) {
                var ref = Paths.userFriendsRef(user.meta.uid);
                ref = ref.push();
                ref.set({uid: friend.meta.uid});
            };

            user.removeFriend = function (friend) {
                friend.removeFriend();
                friend.removeFriend = null;
            };

            user.blockUser = function (block) {
                var ref = Paths.userBlockedRef(user.meta.uid);

                var data = {};
                data[block.meta.uid] = {uid: block.meta.uid};
                ref.set(data);

            };

            user.unblockUser = function (block) {
                block.unblock();
                block.unblock = null;
            };

            user.updateRoomSlot = function (room, slot) {
                var ref = Paths.userRoomsRef(user.meta.uid).child(room.meta.rid);
                ref.update({slot: slot});
            };

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
