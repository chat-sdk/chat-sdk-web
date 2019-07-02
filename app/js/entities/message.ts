import * as angular from 'angular'
import * as firebase from 'firebase';

import * as MessageType from "../keys/message-type";
import * as MessageKeys from "../keys/message-keys";
import {IUserStore} from "../persistence/user-store";
import {IUser} from "./user";
import {IConfig} from "../services/config";
import {ITime} from "../services/time";
import {ICloudImage} from "../services/cloud-image";

angular.module('myApp.services').factory('Message', ['$rootScope', '$q', '$sce','UserStore', 'User', 'Config', 'Time', 'CloudImage',
    function ($rootScope, $q, $sce, UserStore, User, Config, Time, CloudImage) {

        const bMessageSideRight = 'right';
        const bMessageSideLeft = 'left';

        function Message(mid, meta) {

            this.setMID(mid);
            this.meta = meta;

            // Which side is the message on? 'left' or 'right'?
            this.side = null;
            this.timeString = null;
            this.user = null;
            this.flagged = false;

            this.read = false;

            if(meta) {

                if(!this.type()) {
                    this.setType(MessageType.MessageTypeText);
                }

                if(this.type() == MessageType.MessageTypeImage || this.type() == MessageType.MessageTypeFile) {
                    // Get the image and thumbnail URLs
                    let json = meta[MessageKeys.messageJSONv2];

                    if(json) {
                        if(this.type() == MessageType.MessageTypeImage) {
                            this.thumbnailURL = CloudImage.cloudImage(json[MessageKeys.messageImageURL], 200, 200);
                            this.imageURL = json[MessageKeys.messageImageURL];
                        }
                        if(this.type() == MessageType.MessageTypeFile) {
                            this.fileURL = json[MessageKeys.messageFileURL];
                        }
                    }
                }

                // Our messages are on the right - other user's messages are
                // on the left
                this.side = this.uid() == $rootScope.user.uid() ? bMessageSideRight : bMessageSideLeft;

                this.timeString = Time.formatTimestamp(this.time(), Config.clockType);

                // Set the user
                if(this.uid()) {

                    // We need to set the user here
                    if(this.uid() == $rootScope.user.uid()) {
                        this.user = $rootScope.user;
                    }
                    else {
                        this.user = UserStore.getOrCreateUserWithID(this.uid());
                    }
                }
            }
        }

        Message.prototype = {

            markRead: function (uid) {
                this.read = true;
            },

            serialize: function () {
                return {
                    meta: this.meta,
                    mid: this.mid,
                    read: this.read,
                    flagged: this.flagged
                }
            },

            deserialize: function (sm) {
                this.mid = sm.mid;
                this.meta = sm.meta;
                this.read = sm.read;
                this.flagged = sm.flagged;
            },

            shouldHideUser: function (nextMessage) {
                return this.uid() == nextMessage.uid();
            },

            shouldHideDate: function (nextMessage) {
                // Last message date
                var lastDate = new Date(nextMessage.time());
                var newDate = new Date(this.time());

                // If messages have the same day, hour and minute
                // hide the time
                return lastDate.getDay() == newDate.getDay() && lastDate.getHours() == newDate.getHours() && lastDate.getMinutes() == newDate.getMinutes();
            },

            setTime: function (time) {
                this.setMetaValue(MessageKeys.messageTime, time);
            },

            time: function () {
                return this.metaValue(MessageKeys.messageTime);
            },

            setText: function (text) {
                this.setJSONValue(MessageKeys.messageText, text);
            },

            text: function() {
                return this.getJSONValue(MessageKeys.messageText);
            },

            getMetaValue: function (key) {
                return this.meta[key];
            },

            getJSONValue: function (key) {
                return this.getMetaValue(MessageKeys.messageJSONv2)[key];
            },

            setJSONValue: function (key, value) {
                this.getMetaValue(MessageKeys.messageJSONv2)[key] = value;
            },

            type: function () {
                return this.metaValue(MessageKeys.messageType);
            },

            setType: function (type) {
                this.setMetaValue(MessageKeys.messageType, type);
            },

            uid: function () {
                return this.metaValue(MessageKeys.messageUID);
            },

            setUID: function (uid) {
                this.setMetaValue(MessageKeys.messageUID, uid);
            },

            metaValue: function (key) {
                if(this.meta) {
                    return this.meta[key];
                }
                return null;
            },

            setMetaValue: function (key, value) {
                if(!this.meta) {
                    this.meta = {};
                }
                this.meta[key] = value;
            },

            setMID: function (mid) {
                this.mid = mid;
            }




        };

        // Static methods
        Message.buildImageMeta = function (rid, uid, imageURL, thumbnailURL, width, height) {

            var text = imageURL+','+imageURL+',W'+width+"&H"+height;

            var m = Message.buildMeta(rid, uid, text, MessageType.MessageTypeImage);

            var json = {};

            json[MessageKeys.messageText] = text;
            json[MessageKeys.messageImageURL] = imageURL;
            json[MessageKeys.messageThumbnailURL] = thumbnailURL;
            json[MessageKeys.messageImageWidth] = width;
            json[MessageKeys.messageImageHeight] = height;

            m.meta[MessageKeys.messageJSONv2] = json;

            return m;
        };

        Message.buildFileMeta = function (rid, uid, fileName, mimeType, fileURL) {

            var m = Message.buildMeta(rid, uid, fileName, MessageType.MessageTypeFile);

            var json = {};

            json[MessageKeys.messageText] = fileName;
            json[MessageKeys.messageMimeType] = mimeType;
            json[MessageKeys.messageFileURL] = fileURL;

            m.meta[MessageKeys.messageJSONv2] = json;

            return m;
        };

        Message.buildMeta = function (rid, uid, text, type) {
            var m = {
                meta: {}
            };

            m.meta[MessageKeys.messageUID] = uid;

            var json = {};
            json[MessageKeys.messageText] = text;

            m.meta[MessageKeys.messageJSONv2] = json;
            m.meta[MessageKeys.messageType] = type;
            m.meta[MessageKeys.messageTime] = firebase.database.ServerValue.TIMESTAMP;

            return m;
        };

        return Message;
}]);

export interface IMessage {

}

class Message implements IMessage {

    $inject = ['$rootScope', '$q', '$sce','UserStore', 'User', 'Config', 'Time', 'CloudImage'];

    constructor($rootScope: ng.IScope, $q: ng.IQService, $sce: ng.ISCEService, UserStore: IUserStore, User: IUser, Config: IConfig, Time: ITime, CloudImage: ICloudImage) {

    }
}