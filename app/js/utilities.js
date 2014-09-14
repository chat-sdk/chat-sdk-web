'use strict';

/* Services */

var DEBUG = false;

var bPrivateChatDefaultName = "Private Chat";
var bGroupChatDefaultName = "Private Chat";

var bFirebaseRef = "https://chatcatio.firebaseio.com/"

// Paths
var bUsersPath = "users";
var bRoomsPath = "rooms";
var bPublicRoomsPath = "public-rooms";
var bMessagesPath = 'messages'
var bTypingPath = 'typing'
var bFriendsPath = 'friends'
var bBlockedPath = 'blocked'


var bReadKey = 'read';

var bMetaKey = "meta";
//var bFIDKey = "fid";
//var bAIDKey = "aid";
var bOnlineKey = "online";

var bUserStatusNone = null;
var bUserStatusOwner = 'owner';
var bUserStatusMember = 'member';
var bUserStatusInvited = 'invited';
var bUserStatusBlocked = 'blocked';

// Tabs
var bUsersTab = 'users';
var bRoomsTab = 'rooms';
var bFriendsTab = 'friends';

var bProfileSettingsBox = 'profileSettingsBox';

var bShowProfileSettingsBox = 'showProfileSettingsBox';
var bShowCreateChatBox = 'showCreateChatBox';

var bVisibilityChangedNotification = 'bVisibilityChangedNotification';

var bMakeThumbnail = 'bMakeThumbnail'

var bImageDirectory = 'server/tmp/';

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

    connectedRef: function () {
        return this.firebase().child(".info/connected");
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

    publicRoomRef: function (fid) {
        return this.publicRoomsRef().child(fid);
    },

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

var dataURLToBlob = function(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = parts[1];

        return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}
