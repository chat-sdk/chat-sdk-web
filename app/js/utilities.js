'use strict';

/* Services */

var DEBUG = false;
var FIREBASE_REF_DEBUG = false;

var bRoomDefaultNameEmpty = "Empty Chat";
var bRoomDefaultName1To1 = "Private Chat";
var bRoomDefaultNameGroup = "Group Chat";
var bRoomDefaultNamePublic = "Public Chat";

var bDefaultAvatarProvider = "http://flathash.com";

// Last visited
// Show the click to chat box if the user has visited more than x hours
var bLastVisitedTimeout = bHour;

// Paths
var bUsersPath = "users";
var bUsersMetaPath = "users";
var bRoomsPath = "threads";
var bPublicRoomsPath = "public-threads";
var bMessagesPath = 'messages';
var bFlaggedPath = 'flagged';
var bTypingPath = 'typing';
var bFriendsPath = 'friends';
var bBlockedPath = 'blocked';
var bUpdatedPath = 'updated';
var bOnlineUserCountKey = 'onlineUserCount';
var bLastMessagePath = "lastMessage";
var bFlaggedMessagesPath = "flagged";
var bCreatorEntityID = "creator-entity-id";
var bDate = "date";
var bMessage = "message";
var bSenderEntityID = "sender-entity-id";

var messageUID = "user-firebase-id";
//var messageRID = "rid";
var messageType = "type";
var messagePayload = "payload";
var messageTime = "date";
var messageJSON = "JSON";
var messageUserName = "userName";
var messageUserFirebaseID = "user-firebase-id";

// JSON Keys
var messageText = "text";
var messageImageURL = "image-url";
var messageThumbnailURL = "thumbnail-url";

var messageImageWidth = "image-width";
var messageImageHeight = "image-height";

var userUID = "uid";

var roomCreated = "creation-date";
var roomRID = "rid";
var roomUserCreated = "userCreated";
var roomName = "name";
var roomInvitesEnabled = "invitesEnabled";
var roomDescription = "description";
var roomWeight = "weight";
var roomType = "type_v4";
var roomTypeV3 = "type";
var roomCreatorEntityID = bCreatorEntityID;



var bReadKey = 'read';

var bMetaKey = "meta";
var bDetailsKey = "details";
var bImageKey = "image";
var bTimeKey = "time";
var bUserCountKey = "user-count";
var bConfigKey = "config";

var bOnlineKey = "online";
var bTypeKey = "type";

var bUserName = "name";
var bUserCountryCode = "country-code";
var bUserLocation = "location";
var bUserImageURL = "pictureURL";
var bUserGender = "gender";
var bUserStatus = "status";
var bUserProfileLink = "profile-link";
var bUserHomepageLink = "homepage-link";
var bUserHomepageText = "homepage_text";
var bUserProfileHTML = "profile-html";
var bUserAllowInvites = "allow-invites";

// TODO:
var bDefaultUserPrefix = "ChatSDK";

var bUserStatusOwner = 'owner';
var bUserStatusMember = 'member';
//var bUserStatusInvited = 'invited'; // Depricated
var bUserStatusClosed = 'closed';

//var bRoomType1to1 = '1to1';
//var bRoomTypeGroup = 'group';
//var bRoomTypePublic = 'public';
//var bRoomTypeInvalid = 'invalid';

var bMinute = 60;
var bHour = bMinute * 60;
var bDay = bHour * 24;

var bRoomTypeInvalid = 0x0;
var bRoomTypeGroup = 0x1;
var bRoomType1to1 = 0x2;
var bRoomTypePublic = 0x4;

var bRoomTypePrivateV3 = 0;
var bRoomTypePublicV3 = 1;

var bUserAllowInvitesEveryone = 'Everyone';
var bUserAllowInvitesFriends = 'Friends';
var bUserAllowInvitesNobody = 'Nobody';

// Tabs
var bUsersTab = 'users';
var bRoomsTab = 'rooms';
var bFriendsTab = 'friends';
var bInboxTab = 'inbox';

var bProviderTypeCustom = 'custom';

var bProfileSettingsBox = 'profileSettingsBox';
var bLoginBox = 'loginBox';
var bMainBox = 'mainBox';
var bCreateRoomBox = 'createRoomBox';
var bErrorBox = 'errorBox';

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

var bStartSocialLoginNotification = 'bStartSocialLoginNotification';

var bRoomFlashHeaderNotification = 'bRoomFlashHeaderNotification';
var bRoomBadgeChangedNotification = 'bRoomBadgeChangedNotification';

var bOnlineUserAddedNotification = 'bOnlineUserAddedNotification';
var bOnlineUserRemovedNotification = 'bOnlineUserRemovedNotification';

var bUserBlockedNotification = 'bUserBlockedNotification';
var bUserUnblockedNotification = 'bUserUnblockedNotification';

var bFriendAddedNotification = 'bFriendAddedNotification';
var bFriendRemovedNotification = 'bFriendRemovedNotification';

var bDeleteMessageNotification = 'bDeleteMessageNotification';
var bEditMessageNotification = 'bEditMessageNotification';

var bConfigUpdatedNotification = "bConfigUpdatedNotification";

var bLoginModeSimple = "simple";
var bLoginModeSingleSignOn = "singleSignOn";
var bLoginModeToken = "token";
var bLoginModeAuthenticating = "authenticating";
var bLoginModeClickToChat = "clickToChat";

var bMessageTypeText = 0;
var bMessageTypeLocation = 1;
var bMessageTypeImage = 2;

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


var myApp = angular.module('myApp.utilities', []);

myApp.factory('Utils', [function () {

    return {
        unORNull: function (object) {
            return object === 'undefined' || object == null;
        },

        empty: function (object) {
            return this.unORNull(object) || object.length == 0;
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
                var at = a.lastMessageMeta ? a.lastMessageMeta[messageTime] : a.created();
                var bt = b.lastMessageMeta ? b.lastMessageMeta[messageTime] : b.created();

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


