'use strict';

/* Services */

var DEBUG = false;
var FIREBASE_REF_DEBUG = false;

var bRoomDefaultNameEmpty = "Empty Chat";
var bRoomDefaultName1To1 = "Private Chat";
var bRoomDefaultNameGroup = "Group Chat";
var bRoomDefaultNamePublic = "Public Chat";


//
// Used to load partials
//

//var ccProtocol = (("https:" == document.location.protocol) ? "https://" : "http://");

// Are we testing locally?
var bRootURL = '';
var bPartialURL = '';
var bFirebase = 'chatcat';

// If we are then set the root URL to nothing
if(document.location.origin === "http://chatcat") {
      bRootURL = '';
      bPartialURL = 'partials/';
//    bFirebase = 'chatcatio-test';
}
// Are we testing on the wordpress plugin?
else if(document.location.origin === "http://ccwp") {
    bRootURL = '//chatcat/dist/';
    bPartialURL = bRootURL + 'partials/';
//    bFirebase = 'chatcatio-test';
}
//// We're live so we need to use the full remote URL
else {
    bRootURL = '//chatcat.firebaseapp.com/';
    bPartialURL = 'https://chatcat.firebaseapp.com/partials/';
    //bFirebase = 'chatcat';
}

var bFirebaseRef = '//' + bFirebase + '.firebaseio.com/';

var bImagesURL = bRootURL + 'img/';
var bAudioURL = bRootURL + 'audio/';
var bDefaultProfileImage = bImagesURL + 'cc-100-profile-pic.png';

var bPullURL = "//chat.deluge.co/server/pull.php";
//var bResizeURL = "http://chat.deluge.co/server/tmp/resize.php";

var bDefaultAvatarProvider = "http://flathash.com";

// Paths
var bUsersPath = "users";
var bUsersMetaPath = "usersMeta";
var bRoomsPath = "rooms";
var bPublicRoomsPath = "public-rooms";
var bMessagesPath = 'messages';
var bTypingPath = 'typing';
var bFriendsPath = 'friends';
var bBlockedPath = 'blocked';
var bStatePath = 'state';
var bOnlineUserCountKey = 'onlineUserCount';
var bLastMessagePath = "lastMessage";
var bStatsPath = "stats";

var bReadKey = 'read';

var bMetaKey = "meta";
var bImageKey = "image";
var bTimeKey = "time";
var bUserCountKey = "user-count";

var bOnlineKey = "online";
var bTypeKey = "type";

var bUserStatusOwner = 'owner';
var bUserStatusMember = 'member';
//var bUserStatusInvited = 'invited'; // Depricated
var bUserStatusClosed = 'closed';

var bRoomType1to1 = '1to1';
var bRoomTypeGroup = 'group';
var bRoomTypePublic = 'public';
var bRoomTypeInvalid = 'invalid';

var bUserAllowInvitesEveryone = 'Everyone';
var bUserAllowInvitesFriends = 'Friends';
var bUserAllowInvitesNobody = 'Nobody';

// Tabs
var bUsersTab = 'users';
var bRoomsTab = 'rooms';
var bFriendsTab = 'friends';

var bProviderTypeCustom = 'custom';

var bProfileSettingsBox = 'profileSettingsBox';

var bShowProfileSettingsBox = 'showProfileSettingsBox';
var bShowCreateChatBox = 'showCreateChatBox';

var bVisibilityChangedNotification = 'bVisibilityChangedNotification';

var bPublicRoomAddedNotification = 'bPublicRoomAddedNotification';
var bPublicRoomRemovedNotification = 'bPublicRoomRemovedNotification';

var bRoomAddedNotification = 'bRoomAddedNotification';
var bRoomRemovedNotification = 'bRoomRemovedNotification';

var bRoomOpenedNotification = 'bRoomOpenedNotification';
var bRoomClosedNotification = 'bRoomClosedNotification';

var bAnimateRoomNotification = 'bAnimateRoomNotification';

var bRoomUpdatedNotification = 'bRoomUpdatedNotification';
var bRoomPositionUpdatedNotification = 'bRoomPositionUpdatedNotification';
var bRoomSizeUpdatedNotification = 'bRoomSizeUpdatedNotification';
var bUpdateRoomActiveStatusNotification = 'bUpdateRoomActiveStatusNotification';

var bLazyLoadedMessagesNotification = 'bLazyLoadedMessagesNotification';

var bChatUpdatedNotification = 'bChatUpdatedNotification';

var bUserOnlineStateChangedNotification = 'bUserOnlineStateChangedNotification';
var bUserValueChangedNotification = 'bUserValueChangedNotification';

var bScreenSizeChangedNotification = 'bScreenSizeChangedNotification';

var bLoginCompleteNotification = 'bLoginCompleteNotification';
var bLogoutNotification = 'bLogoutNotification';

var bRoomFlashHeaderNotification = 'bRoomFlashHeaderNotification';
var bRoomBadgeChangedNotification = 'bRoomBadgeChangedNotification';

var bOnlineUserAddedNotification = 'bOnlineUserAddedNotification';
var bOnlineUserRemovedNotification = 'bOnlineUserRemovedNotification';

var bUserBlockedNotification = 'bUserBlockedNotification';
var bUserUnblockedNotification = 'bUserUnblockedNotification';

var bFriendAddedNotification = 'bFriendAddedNotification';
var bFriendRemovedNotification = 'bFriendRemovedNotification';

// Chat width
var bChatRoomWidth = 230;
var bChatRoomHeight = 300;

var bChatRoomTopMargin = 60;
var bChatRoomSpacing = 15;

var bMainBoxWidth = 250;
var bMainBoxHeight = 300;

var bRoomListBoxWidth = 200;
var bRoomListBoxHeight = 300;

var bProfileBoxWidth = 300;

var bMinute = 60;
var bHour = bMinute * 60;
var bDay = bHour * 24;

//Firebase.enableLogging(true);

var myApp = angular.module('myApp.utilities', []);

myApp.factory('Paths', [function () {

    return {

        cid: null,

        setCID: function (cid) {
            if(FIREBASE_REF_DEBUG) console.log("setCID: " + cid);
            this.cid = cid;
        },

        firebase: function () {
            if(FIREBASE_REF_DEBUG) console.log("firebase");
            if(this.cid) {
                return new Firebase(bFirebaseRef + this.cid);
            }
            else {
                return new Firebase(bFirebaseRef);
            }
        },

        statsRef: function () {
            return new Firebase(bFirebaseRef).child(bStatsPath).child(this.cid);
        },

        usersRef: function () {
            if(FIREBASE_REF_DEBUG) console.log("usersRef");
            return this.firebase().child(bUsersPath);
        },

        timeRef: function (uid) {
            if(FIREBASE_REF_DEBUG) console.log("timeRef");
            return this.firebase().child(bTimeKey).child(uid);
        },

        userRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userRef");
            return this.usersRef().child(fid);
        },

        userMetaRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userMetaRef");
            return this.userRef(fid).child(bMetaKey);
        },

        userImageRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userImageRef");
            return this.userRef(fid).child(bImageKey);
        },

        userStateRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userStateRef");
            return this.userRef(fid).child(bStatePath);
        },

//    userThumbnailRef: function (fid) {
//        if(DEBUG) console.log("");
//        return this.userRef(fid).child(bThumbnailKey);
//    },

        userFriendsRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userFriendsRef");
            return this.userRef(fid).child(bFriendsPath);
        },

        userBlockedRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userBlockedRef");
            return this.userRef(fid).child(bBlockedPath);
        },

        onlineUsersRef: function () {
            if(FIREBASE_REF_DEBUG) console.log("onlineUsersRef");
            return this.firebase().child(bOnlineKey);
        },

        onlineUserRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("onlineUserRef");
            return this.onlineUsersRef().child(fid);
        },

        roomsRef: function () {
            if(FIREBASE_REF_DEBUG) console.log("roomsRef");
            return this.firebase().child(bRoomsPath);
        },

        publicRoomsRef: function () {
            if(FIREBASE_REF_DEBUG) console.log("publicRoomsRef");
            return this.firebase().child(bPublicRoomsPath);
        },

        publicRoomRef: function (rid) {
            if(FIREBASE_REF_DEBUG) console.log("publicRoomRef");
            return this.publicRoomsRef().child(rid);
        },

        roomRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomRef");
            return this.roomsRef().child(fid);
        },

        roomMetaRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomMetaRef");
            return this.roomRef(fid).child(bMetaKey);
        },

        roomLastMessageRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomLastMessageRef");
            return this.roomRef(fid).child(bLastMessagePath);
        },

        roomStateRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomStateRef");
            return this.roomRef(fid).child(bStatePath);
        },

        roomMessagesRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomMessagesRef");
            return this.roomRef(fid).child(bMessagesPath);
        },

        roomUsersRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomUsersRef");
            return this.roomRef(fid).child(bUsersMetaPath);
        },

        roomTypingRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomTypingRef");
            return this.roomRef(fid).child(bTypingPath);
        },

        userRoomsRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("userRoomsRef");
            return this.userRef(fid).child(bRoomsPath);
        },

        messageUsersRef: function (rid, mid) {
            if(FIREBASE_REF_DEBUG) console.log("messageUsersRef");
            return this.messageRef(rid, mid).child(bUsersPath);
        },

        messageRef: function (rid, mid) {
            if(FIREBASE_REF_DEBUG) console.log("messageRef");
            return this.roomMessagesRef(rid).child(mid);
        },

        onlineUserCountRef: function () {
            if(FIREBASE_REF_DEBUG) console.log("onlineUserCountRef");
            return this.firebase().child(bOnlineUserCountKey);
        }

    };
}]);

myApp.factory('Utils', [function () {

    return {

        unORNull: function (object) {
            return object === 'undefined' || object == null;
        },

        timeSince: function (timestamp) {
            if(this.unORNull(timestamp)) {
                return -1;
            }
            else {
                var date = new Date(timestamp);
                var time = 0;
                if (!date.now) {
                    time = date.getTime();
                }
                else {
                    time = date.now();
                }
                return time * 1000;
            }
        }
    }

}]);

myApp.factory('ArrayUtils', [function () {

    return {

        getRoomsWithUsers: function (rooms, users) {

            var roomsWithUsers = [];
            for(var i = 0; i < rooms.length; i++) {
                var room = rooms[i];
                if(room.containsOnlyUsers(users)) {
                    if((users.length == 2 && room.type() == bRoomType1to1) || (users.length != 2 && room.type() == bRoomTypeGroup)) {
                        roomsWithUsers.push(room);
                    }
                }
            }
            return roomsWithUsers;
        },

        roomsSortedByMostRecent: function (rooms) {
            rooms.sort(function (a, b) {
                var at = a.lastMessageMeta ? a.lastMessageMeta.time : a.meta.created;
                var bt = b.lastMessageMeta ? b.lastMessageMeta.time : b.meta.created;

                return bt - at;
            });
            return rooms;
        },

        indexOf: function (array, id, getID) {
            for(var i = 0; i < array.length; i++) {
                if(id == getID(array[i])) {
                    return i;
                }
            }
        },

        removeItem: function (array, id, getID) {
            if(array.length == 0) {
                return;
            }
            var i = this.indexOf(array, id, getID);
            array.splice(i, 1);
        },

        getItem: function (array, id, getID) {
            if(array.length == 0) {
                return null;
            }
            var i = this.indexOf(array, id, getID);
            return array[i];
        },

        contains: function (array, obj) {
            for(var i = 0; i < array.length; i++) {
                if(obj == array[i]) {
                    return true;
                }
            }
            return false;
        },

        remove: function (array, obj) {
            for(var i = 0; i < array.length; i++) {
                if(obj == array[i]) {
                    array.splice(i, 1);
                    break;
                }
            }
        },

        filterByKey: function (array, key, getKey) {
            if(!key || key.length == 0 || key === "") {
                return array;
            }
            else {
                // Loop over all users
                var result = [];
                var elm, t1, t2;
                for(var i = 0; i < array.length; i++) {

                    elm = array[i];
                    // Switch to lower case and remove spaces
                    // to improve search results
                    t1 = key.toLowerCase().replace(/ /g,'');
                    t2 = getKey(elm).toLowerCase().replace(/ /g,'');
                    if(t2.substring(0, t1.length) == t1) {
                        result.push(elm);
                    }
                }
                return result;
            }
        },

        objectToArray: function (object) {
            var array = [];
            for(var key in object) {
                if(object.hasOwnProperty(key)) {
                    array.push(object[key]);
                }
            }
            return array;
        }
    }
}]);


