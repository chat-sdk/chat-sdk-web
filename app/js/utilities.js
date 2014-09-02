'use strict';

/* Services */

var bPrivateChatDefaultName = "Private Chat";

// Paths
var bUsersPath = "users";
var bRoomsPath = "rooms";
var bPublicRoomsPath = "public-rooms";
var bMessagesPath = 'messages'
var bTypingPath = 'typing'
var bFriendsPath = 'friends'
var bBlockedPath = 'blocked'

var bMetaKey = "meta";
//var bFIDKey = "fid";
//var bAIDKey = "aid";
var bOnlineKey = "online";

var bUserStatusNone = null;
var bUserStatusOwner = 'owner';
var bUserStatusMember = 'member';
var bUserStatusInvited = 'invited';
var bUserStatusBlocked = 'blocked';

// Chat width
var bChatRoomWidth = 230;
var bChatRoomHeight = 300;

var bChatRoomTopMargin = 60;
var bChatRoomSpacing = 15;


var bMainBoxWidth = 250;
var bMainBoxHeight = 230;

var bRoomsListBoxWidth = 230;

var bProfileBoxWidth = 300;

var Paths = {

    cid: null,

    setCID: function (cid) {
        this.cid = cid;
    },

    firebase: function () {
        return new Firebase("https://chatcatio.firebaseio.com/" + this.cid);
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
        return this.usersRef().child(bOnlineKey);
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
    }
};

var Utilities = {

    filterByName: function (array, name) {
        if(!name || name == "") {
            return array;
        }
        else {
            // Loop over all users
            var result = {};
            var u = null;
            var t = null;
            var n = null;
            for(var id in array) {
                u = array[id];
                // Switch to lower case and remove spaces
                // to improve search results
                t = name.toLowerCase().replace(/ /g,'');
                n = u.meta.name.toLowerCase().replace(/ /g,'');
                if(n.substring(0, t.length) == t) {
                    result[id] = u;
                }
            }
            return result;
        }
    },

    saveImageFromURL: function (context, url, callback) {
        context.post('server/pull.php', {'url': url}).success(function(data, status) {
            if(callback) {
                callback(data.fileName);
            }
        }).error(function(data, status) {
            if(callback) {
                callback(null);
            }
        });
    }

};

var API = {

    getAPIDetails: function (callback) {

        // Make up some API Details
        var api = {
            cid: "xxyyzz",
            max: 30,
            rooms: [
                {
                    fid: "123123",
                    name: "Fixed 1",
                    desc: "This is fixed 1"
                }
            ]
        };

        setTimeout(callback(api),10);
   }

}


