/**
 * Created by benjaminsmiley-andrews on 24/07/17.
 */
angular.module('myApp.services').factory('Paths', ['Environment', function (Environment) {

    return {

        cid: null,
        initialized: false,
        database: null,

        setCID: function (cid) {
            if(FIREBASE_REF_DEBUG) console.log("setCID: " + cid);
            this.cid = cid;
        },

        firebase: function () {
            if(!this.initialized) {
                firebase.initializeApp(Environment.firebaseConfig());
                this.database = firebase.database();
                this.initialized = true;
            }
            if(FIREBASE_REF_DEBUG) console.log("firebase");
            if(this.cid) {
                return this.database.ref(this.cid);
            }
            else {
                return this.database.ref();
            }
        },

        usersRef: function () {
            if(FIREBASE_REF_DEBUG) console.log("usersRef");
            return this.firebase().child(bUsersPath);
        },

        configRef: function () {
            return this.firebase().child(bConfigKey);
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
            return this.userRef(fid).child(bUpdatedPath);
        },

        userOnlineRef: function (fid) {
            return this.userRef(fid).child(bOnlineKey);
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
            return this.roomRef(fid).child(bDetailsKey);
        },

        roomLastMessageRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomLastMessageRef");
            return this.roomRef(fid).child(bLastMessagePath);
        },

        roomStateRef: function (fid) {
            if(FIREBASE_REF_DEBUG) console.log("roomStateRef");
            return this.roomRef(fid).child(bUpdatedPath);
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
        },

        flaggedMessageRef: function (tid, mid) {
            return this.firebase().child(bFlaggedPath).child(bRoomsPath).child(tid).child(bMessagesPath).child(mid);
        }

    };
}]);