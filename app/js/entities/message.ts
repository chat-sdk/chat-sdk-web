import * as angular from 'angular'
import * as firebase from 'firebase';

import * as MessageKeys from "../keys/message-keys";
import {IUserStore} from "../persistence/user-store";
import {IUser} from "./user";
import {IConfig} from "../services/config";
import {ITime} from "../services/time";
import {ICloudImage} from "../services/cloud-image";
import {MessageType} from "../keys/message-type";

export interface IMessage {

}

class Message implements IMessage {

    private mid: string;
    private meta = new Map<string, any>();
    private read = false;
    public flagged = false;
    public side: MessageSide;
    public user: IUser;
    public imageURL: string;
    public thumbnailURL: string;
    public fileURL: string;
    public timeString: string;

    constructor (mid: string, meta: Map<string, any>) {
        this.mid = mid;
        this.meta = meta;
    }

    markRead(uid) {
        this.read = true;
    }

    serialize() {
        return {
            meta: this.meta,
            mid: this.mid,
            read: this.read,
            flagged: this.flagged
        }
    }

    deserialize(sm) {
        this.mid = sm.mid;
        this.meta = sm.meta;
        this.read = sm.read;
        this.flagged = sm.flagged;
    }

    shouldHideUser(nextMessage) {
        return this.uid() == nextMessage.uid();
    }

    shouldHideDate(nextMessage) {
        // Last message date
        var lastDate = new Date(nextMessage.time());
        var newDate = new Date(this.time());

        // If messages have the same day, hour and minute
        // hide the time
        return lastDate.getDay() == newDate.getDay() && lastDate.getHours() == newDate.getHours() && lastDate.getMinutes() == newDate.getMinutes();
    }

    setTime(time) {
        this.setMetaValue(MessageKeys.messageTime, time);
    }

    time() {
        return this.metaValue(MessageKeys.messageTime);
    }

    setText(text) {
        this.setJSONValue(MessageKeys.messageText, text);
    }

    text() {
        return this.getJSONValue(MessageKeys.messageText);
    }

    getMetaValue(key) {
        return this.meta[key];
    }

    getJSONValue(key) {
        return this.getMetaValue(MessageKeys.messageJSONv2)[key];
    }

    setJSONValue(key, value) {
        this.getMetaValue(MessageKeys.messageJSONv2)[key] = value;
    }

    type(): MessageType {
        return this.metaValue(MessageKeys.messageType);
    }

    setType(type) {
        this.setMetaValue(MessageKeys.messageType, type);
    }

    uid() {
        return this.metaValue(MessageKeys.messageUID);
    }

    setUID(uid) {
        this.setMetaValue(MessageKeys.messageUID, uid);
    }

    metaValue(key) {
        if(this.meta) {
            return this.meta[key];
        }
        return null;
    }

    setMetaValue(key, value) {
        this.meta[key] = value;
    }

    setMID(mid) {
        this.mid = mid;
    }
}

export enum MessageSide {
    Right = 'right',
    Left = 'left'
}

export interface IMessageFactory {
    getInstance(mid: string, meta: Map<string, any>): IMessage
}

class MessageFactory implements IMessageFactory {

    $inject = ['$rootScope', '$q', '$sce','UserStore', 'User', 'Config', 'Time', 'CloudImage'];

    private CloudImage: ICloudImage;
    private $rootScope;
    private UserStore: IUserStore;
    private Config: IConfig;
    private Time: ITime;

    constructor($rootScope: ng.IScope, $q: ng.IQService, $sce: ng.ISCEService, UserStore: IUserStore, User: IUser, Config: IConfig, Time: ITime, CloudImage: ICloudImage) {
        this.CloudImage = CloudImage;
        this.$rootScope = $rootScope;
        this.UserStore = UserStore;
        this.Config = Config;
        this.Time = Time;
    }

    getInstance(mid: string, meta: Map<string, any>): IMessage {

        const message = new Message(mid, meta);

        if(meta) {

            if(!message.type()) {
                message.setType(MessageType.Text);
            }

            if(message.type() == MessageType.Image || message.type() == MessageType.File) {
                // Get the image and thumbnail URLs
                let json = meta[MessageKeys.messageJSONv2];

                if(json) {
                    if(message.type() == MessageType.Image) {
                        message.thumbnailURL = this.CloudImage.cloudImage(json[MessageKeys.messageImageURL], 200, 200);
                        message.imageURL = json[MessageKeys.messageImageURL];
                    }
                    if(message.type() == MessageType.File) {
                        message.fileURL = json[MessageKeys.messageFileURL];
                    }
                }
            }

            // Our messages are on the right - other user's messages are
            // on the left
            message.side = message.uid() == this.$rootScope.user.uid() ? MessageSide.Right : MessageSide.Left;

            message.timeString = this.Time.formatTimestamp(message.time(), this.Config.clockType);

            // Set the user
            if(message.uid()) {

                // We need to set the user here
                if(message.uid() == this.$rootScope.user.uid()) {
                    message.user = this.$rootScope.user;
                }
                else {
                    message.user = this.UserStore.getOrCreateUserWithID(message.uid());
                }
            }

            return message;
        }
    }

    buildImageMeta(rid, uid, imageURL, thumbnailURL, width, height) {

        var text = imageURL+','+imageURL+',W'+width+"&H"+height;

        var m = this.buildMeta(rid, uid, text, MessageType.Image);

        var json = {};

        json[MessageKeys.messageText] = text;
        json[MessageKeys.messageImageURL] = imageURL;
        json[MessageKeys.messageThumbnailURL] = thumbnailURL;
        json[MessageKeys.messageImageWidth] = width;
        json[MessageKeys.messageImageHeight] = height;

        m.meta[MessageKeys.messageJSONv2] = json;

        return m;
    }

    buildFileMeta(rid, uid, fileName, mimeType, fileURL) {

        var m = this.buildMeta(rid, uid, fileName, MessageType.File);

        var json = {};

        json[MessageKeys.messageText] = fileName;
        json[MessageKeys.messageMimeType] = mimeType;
        json[MessageKeys.messageFileURL] = fileURL;

        m.meta[MessageKeys.messageJSONv2] = json;

        return m;
    }

    buildMeta (rid, uid, text, type) {
        const m = {
            meta: {}
        };

        m.meta[MessageKeys.messageUID] = uid;

        const json = {};
        json[MessageKeys.messageText] = text;

        m.meta[MessageKeys.messageJSONv2] = json;
        m.meta[MessageKeys.messageType] = type;
        m.meta[MessageKeys.messageTime] = firebase.database.ServerValue.TIMESTAMP;

        return m;
    }
}

angular.module('myApp.services').service('MessageFactory', MessageFactory);