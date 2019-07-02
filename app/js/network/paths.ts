/**
 * Created by benjaminsmiley-andrews on 24/07/17.
 */

import * as angular from 'angular'
import * as firebase from 'firebase';

import {FIREBASE_REF_DEBUG} from "../keys/defines";
import {
    BlockedPath, FlaggedPath,
    FriendsPath,
    LastMessagePath, MessagesPath, OnlineUserCountKey,
    PublicRoomsPath,
    RoomsPath, TypingPath,
    UpdatedPath, UsersMetaPath,
    UsersPath
} from "../keys/path-keys";
import {ConfigKey, DetailsKey, ImageKey, MetaKey, OnlineKey, TimeKey} from "../keys/keys";

export interface IPaths {

}

angular.module('myApp.services').factory('Paths', ['Environment', function (Environment) {

    return {

        cid: null,
        database: null,

        setCID: function (cid: string) {
            if(FIREBASE_REF_DEBUG) console.log("setCID: " + cid);
            this.cid = cid;
        },

        firebase: function () : firebase.database.Reference {
            if(firebase.apps.length == 0) {
                firebase.initializeApp(Environment.firebaseConfig());
                this.database = firebase.database();
            }
            if(FIREBASE_REF_DEBUG) console.log("firebase");
            if(this.cid) {
                return this.database.ref(this.cid);
            }
            else {
                return this.database.ref();
            }
        },

        usersRef: function () : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("usersRef");
            return this.firebase().child(UsersPath);
        },

        configRef: function () : firebase.database.Reference {
            return this.firebase().child(ConfigKey);
        },

        timeRef: function (uid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("timeRef");
            return this.firebase().child(TimeKey).child(uid);
        },

        userRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userRef");
            return this.usersRef().child(fid);
        },

        userMetaRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userMetaRef");
            return this.userRef(fid).child(MetaKey);
        },

        userImageRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userImageRef");
            return this.userRef(fid).child(ImageKey);
        },

        userStateRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userStateRef");
            return this.userRef(fid).child(UpdatedPath);
        },

        userOnlineRef: function (fid) : firebase.database.Reference {
            return this.userRef(fid).child(OnlineKey);
        },


//    userThumbnailRef: function (fid) {
//        if(DEBUG) console.log("");
//        return this.userRef(fid).child(bThumbnailKey);
//    },

        userFriendsRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userFriendsRef");
            return this.userRef(fid).child(FriendsPath);
        },

        userBlockedRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userBlockedRef");
            return this.userRef(fid).child(BlockedPath);
        },

        onlineUsersRef: function () : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("onlineUsersRef");
            return this.firebase().child(OnlineKey);
        },

        onlineUserRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("onlineUserRef");
            return this.onlineUsersRef().child(fid);
        },


        roomsRef: function () : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomsRef");
            return this.firebase().child(RoomsPath);
        },

        publicRoomsRef: function () : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("publicRoomsRef");
            return this.firebase().child(PublicRoomsPath);
        },

        publicRoomRef: function (rid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("publicRoomRef");
            return this.publicRoomsRef().child(rid);
        },

        roomRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomRef");
            return this.roomsRef().child(fid);
        },

        roomMetaRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomMetaRef");
            return this.roomRef(fid).child(DetailsKey);
        },

        roomLastMessageRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomLastMessageRef");
            return this.roomRef(fid).child(LastMessagePath);
        },

        roomStateRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomStateRef");
            return this.roomRef(fid).child(UpdatedPath);
        },

        roomMessagesRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomMessagesRef");
            return this.roomRef(fid).child(MessagesPath);
        },

        roomUsersRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomUsersRef");
            return this.roomRef(fid).child(UsersMetaPath);
        },

        roomTypingRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("roomTypingRef");
            return this.roomRef(fid).child(TypingPath);
        },

        userRoomsRef: function (fid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("userRoomsRef");
            return this.userRef(fid).child(RoomsPath);
        },

        messageUsersRef: function (rid, mid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("messageUsersRef");
            return this.messageRef(rid, mid).child(UsersPath);
        },

        messageRef: function (rid, mid) : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("messageRef");
            return this.roomMessagesRef(rid).child(mid);
        },

        onlineUserCountRef: function () : firebase.database.Reference {
            if(FIREBASE_REF_DEBUG) console.log("onlineUserCountRef");
            return this.firebase().child(OnlineUserCountKey);
        },

        flaggedMessageRef: function (tid, mid) : firebase.database.Reference {
            return this.firebase().child(FlaggedPath).child(RoomsPath).child(tid).child(MessagesPath).child(mid);
        }

    };
}]);