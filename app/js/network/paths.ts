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
import {IEnvironment} from "../services/environment";

export interface IPaths {
    configRef() : firebase.database.Reference
    publicRoomsRef () : firebase.database.Reference
}

class Paths implements IPaths {

    static $inject = ['Environment'];

    cid: string = null;
    database: firebase.database.Database;
    Environment: IEnvironment;

    constructor (Environment: IEnvironment) {
        this.Environment = Environment;
    }

    setCID (cid: string) {
        if(FIREBASE_REF_DEBUG) console.log("setCID: " + cid);
        this.cid = cid;
    }

    firebase () : firebase.database.Reference {
        if(firebase.apps.length == 0) {
            firebase.initializeApp(this.Environment.firebaseConfig());
            this.database = firebase.database();
        }
        if(FIREBASE_REF_DEBUG) console.log("firebase");
        if(this.cid) {
            return this.database.ref(this.cid);
        }
        else {
            return this.database.ref();
        }
    }

    usersRef () : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("usersRef");
        return this.firebase().child(UsersPath);
    }

    configRef () : firebase.database.Reference {
        return this.firebase().child(ConfigKey);
    }

    timeRef (uid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("timeRef");
        return this.firebase().child(TimeKey).child(uid);
    }

    userRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userRef");
        return this.usersRef().child(fid);
    }

    userMetaRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userMetaRef");
        return this.userRef(fid).child(MetaKey);
    }

    userImageRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userImageRef");
        return this.userRef(fid).child(ImageKey);
    }

    userStateRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userStateRef");
        return this.userRef(fid).child(UpdatedPath);
    }

    userOnlineRef (fid) : firebase.database.Reference {
        return this.userRef(fid).child(OnlineKey);
    }


//    userThumbnailRef (fid) {
//        if(DEBUG) console.log("");
//        return this.userRef(fid).child(bThumbnailKey);
//    }

    userFriendsRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userFriendsRef");
        return this.userRef(fid).child(FriendsPath);
    }

    userBlockedRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userBlockedRef");
        return this.userRef(fid).child(BlockedPath);
    }

    onlineUsersRef () : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("onlineUsersRef");
        return this.firebase().child(OnlineKey);
    }

    onlineUserRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("onlineUserRef");
        return this.onlineUsersRef().child(fid);
    }


    roomsRef () : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomsRef");
        return this.firebase().child(RoomsPath);
    }

    publicRoomsRef () : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("publicRoomsRef");
        return this.firebase().child(PublicRoomsPath);
    }

    publicRoomRef (rid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("publicRoomRef");
        return this.publicRoomsRef().child(rid);
    }

    roomRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomRef");
        return this.roomsRef().child(fid);
    }

    roomMetaRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomMetaRef");
        return this.roomRef(fid).child(DetailsKey);
    }

    roomLastMessageRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomLastMessageRef");
        return this.roomRef(fid).child(LastMessagePath);
    }

    roomStateRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomStateRef");
        return this.roomRef(fid).child(UpdatedPath);
    }

    roomMessagesRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomMessagesRef");
        return this.roomRef(fid).child(MessagesPath);
    }

    roomUsersRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomUsersRef");
        return this.roomRef(fid).child(UsersMetaPath);
    }

    roomTypingRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("roomTypingRef");
        return this.roomRef(fid).child(TypingPath);
    }

    userRoomsRef (fid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("userRoomsRef");
        return this.userRef(fid).child(RoomsPath);
    }

    messageUsersRef (rid, mid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("messageUsersRef");
        return this.messageRef(rid, mid).child(UsersPath);
    }

    messageRef (rid, mid) : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("messageRef");
        return this.roomMessagesRef(rid).child(mid);
    }

    onlineUserCountRef () : firebase.database.Reference {
        if(FIREBASE_REF_DEBUG) console.log("onlineUserCountRef");
        return this.firebase().child(OnlineUserCountKey);
    }

    flaggedMessageRef (tid, mid) : firebase.database.Reference {
        return this.firebase().child(FlaggedPath).child(RoomsPath).child(tid).child(MessagesPath).child(mid);
    }
}

angular.module('myApp.services').service('Paths', Paths);