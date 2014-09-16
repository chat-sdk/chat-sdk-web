'use strict';

/* Services */

var DEBUG = false;
var PROD = false;

var bGroupChatDefaultName = "Private Chat";

var bFirebaseRef = "https://chatcatio.firebaseio.com/";

// Paths
var bUsersPath = "users";
var bRoomsPath = "rooms";
var bPublicRoomsPath = "public-rooms";
var bMessagesPath = 'messages';
var bTypingPath = 'typing';
var bFriendsPath = 'friends';
var bBlockedPath = 'blocked';


var bReadKey = 'read';

var bMetaKey = "meta";
var bOnlineKey = "online";

var bUserStatusOwner = 'owner';
var bUserStatusMember = 'member';
var bUserStatusInvited = 'invited';

// Tabs
var bUsersTab = 'users';
var bRoomsTab = 'rooms';
var bFriendsTab = 'friends';

var bProfileSettingsBox = 'profileSettingsBox';

var bShowProfileSettingsBox = 'showProfileSettingsBox';
var bShowCreateChatBox = 'showCreateChatBox';

var bVisibilityChangedNotification = 'bVisibilityChangedNotification';

var bImageDirectory = 'https://chatcatio.firebaseapp.com/server/tmp/';

// Chat width
var bChatRoomWidth = 230;
var bChatRoomHeight = 300;

var bChatRoomTopMargin = 60;
var bChatRoomSpacing = 15;

var bMainBoxWidth = 250;
var bMainBoxHeight = 230;

var bRoomListBoxWidth = 200;
var bRoomListBoxHeight = 300;

var bProfileBoxWidth = 300;

var Paths = {

    cid: null,

    setCID: function (cid) {
        this.cid = cid;
    },

    firebase: function () {
        return new Firebase(bFirebaseRef + this.cid);
    },

    usersRef: function () {
        return this.firebase().child(bUsersPath);
    },

    userRef: function (fid) {
        return this.usersRef().child(fid);
    },

    userMetaRef: function (fid) {
        return this.userRef(fid).child(bMetaKey);
    },

    userFriendsRef: function (fid) {
        return this.userMetaRef(fid).child(bFriendsPath);
    },

    userBlockedRef: function (fid) {
        return this.userMetaRef(fid).child(bBlockedPath);
    },

    onlineUsersRef: function () {
        return this.firebase().child(bOnlineKey);
    },

    onlineUserRef: function (fid) {
        return this.onlineUsersRef().child(fid);
    },

    roomsRef: function () {
        return this.firebase().child(bRoomsPath);
    },

    publicRoomsRef: function () {
        return this.firebase().child(bPublicRoomsPath);
    },

//    publicRoomRef: function (fid) {
//        return this.publicRoomsRef().child(fid);
//    },

    roomRef: function (fid) {
        return this.roomsRef().child(fid);
    },

    roomMetaRef: function (fid) {
        return this.roomRef(fid).child(bMetaKey);
    },

    roomMessagesRef: function (fid) {
        return this.roomRef(fid).child(bMessagesPath);
    },

    roomUsersRef: function (fid) {
        return this.roomMetaRef(fid).child(bUsersPath);
    },

    roomTypingRef: function (fid) {
        return this.roomMetaRef(fid).child(bTypingPath);
    },

    userRoomsRef: function (fid) {
        return this.userRef(fid).child(bRoomsPath);
    },

    messageUsersRef: function (rid, mid) {
        return this.messageRef(rid, mid).child(bUsersPath);
    },

    messageRef: function (rid, mid) {
        return this.roomMessagesRef(rid).child(mid);
    }
};

function unORNull (object) {
    return object === 'undefined' || object == null;
}