import * as angular from 'angular'
import * as firebase from 'firebase';

import {IUser} from "./user";
import {MessageType} from "../keys/message-type";
import {MessageKeys} from "../keys/message-keys";
import {Utils} from "../services/utils";

export interface IMessage {
    hideName: boolean
    hideTime: boolean
    mid: string
    user: IUser
    meta: {}
    nextMessage: IMessage
    previousMessage: IMessage
    read: boolean
    time()
    date()
    markRead(uid?: string): void
    type(): MessageType
    sender(): IUser
    text(): string
    updateDisplay(): void
    uid(): string
}

class Message implements IMessage {

    public read = false;
    public flagged = false;
    public side: MessageSide;
    public user: IUser;
    public imageURL: string;
    public thumbnailURL: string;
    public fileURL: string;
    public timeString: string;
    public nextMessage: IMessage;
    public previousMessage: IMessage;

    hideName = false;
    hideTime = false;

    constructor (
        private $rootScope,
        private Time,
        private UserStore,
        private Config,
        private CloudImage,
        public mid: string,
        public meta: Map<string, any>
    ) {
        if (!meta) {
            this.meta = new Map();
        }

        if(meta) {

            if(!this.type()) {
                this.setType(MessageType.Text);
            }

            if(this.type() == MessageType.Image || this.type() == MessageType.File) {
                // Get the image and thumbnail URLs
                let json = meta[MessageKeys.JSONv2];

                if(json) {
                    if(this.type() == MessageType.Image) {
                        this.thumbnailURL = this.CloudImage.cloudImage(json[MessageKeys.ImageURL], 200, 200);
                        this.imageURL = json[MessageKeys.ImageURL];
                    }
                    if(this.type() == MessageType.File) {
                        this.fileURL = json[MessageKeys.FileURL];
                    }
                }
            }

            // Our messages are on the right - other user's messages are
            // on the left
            this.side = this.uid() == this.UserStore.currentUser().uid() ? MessageSide.Right : MessageSide.Left;

            this.timeString = this.Time.formatTimestamp(this.time(), this.Config.clockType);

            // Set the user
            if(this.uid()) {

                // We need to set the user here
                if(this.uid() == this.UserStore.currentUser().uid()) {
                    this.user = this.UserStore.currentUser();
                }
                else {
                    this.user = this.UserStore.getOrCreateUserWithID(this.uid());
                }
            }
        }
    }

    markRead(uid?: string): void {
        this.read = true;
    }


    serialize() {
        return {
            meta: this.meta,
            mid: this.mid,
            read: this.read,
            flagged: this.flagged,
            hideTime: this.hideTime,
            hideName: this.hideName,
            side: this.side,
        }
    }

    updateDisplay(): void {

        let hideName = this.sender().isMe();
        let hideDate = true;

        if (this.nextMessage) {
            hideName = hideName || this.uid() == this.nextMessage.uid();
        }
        if (this.previousMessage) {
            hideDate = Utils.sameMinute(this.date(), this.previousMessage.date());
        }

        this.hideName = hideName;
        this.hideTime = hideDate;

        //console.log("Message: " + this.text() + ", user: " + this.uid() + ", h: " + this.date().getHours() + " m:" + this.date().getMinutes() + " hideName: " + hideName + ", hideDate: " + hideDate);
    }

    deserialize(sm) {
        this.mid = sm.mid;
        this.meta = sm.meta;
        this.read = sm.read;
        this.flagged = sm.flagged;
        this.hideTime = sm.hideTime;
        this.hideName = sm.hideName;
        this.side = sm.side;
    }

    setTime(time) {
        this.setValue(MessageKeys.Date, time);
    }

    time() {
        return this.getValue(MessageKeys.Date);
    }

    date(): Date {
        return new Date(this.time());
    }

    setText(text) {
        this.setMetaValue(MessageKeys.Text, text);
    }

    text(): string {
        if (this.type() == MessageType.Text) {
            return this.getMetaValue(MessageKeys.Text);
        }
        else if (this.type() == MessageType.Image) {
            return "Image";
        }
        else if (this.type() == MessageType.File) {
            return "File";
        }
        else if (this.type() == MessageType.Location) {
            return "Location";
        }
        return "";
    }

    sender(): IUser {
        return this.user;
    }

    getMetaValue(key) {
        return this.getValue(MessageKeys.Meta)[key];
    }

    getValue(key) {
        return this.meta[key];
    }

    setValue(key, value) {
        this.meta[key] = value;
    }

    type(): MessageType {
        return this.getValue(MessageKeys.Type);
    }

    setType(type) {
        this.setValue(MessageKeys.Type, type);
    }

    uid(): string {
        let from = this.getValue(MessageKeys.From);
        if (!from) {
            from = this.getValue(MessageKeys.UID);
        }
        return from;
    }

    setUID(uid) {
        this.setValue(MessageKeys.From, uid);
        this.setValue(MessageKeys.UID, uid);
    }

    metaValue(key) {
        return this.getMetaValue(key);
    }

    setMetaValue(key, value) {
        this.meta[MessageKeys.Meta][key] = value;
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
}

class MessageFactory implements IMessageFactory {

    constructor() {}


    buildFileMeta (fileName: string, mimeType: string, fileURL: string): Map<string, any> {
        const map = new Map<string, any>();
        map.set(MessageKeys.Text, fileName);
        map.set(MessageKeys.MimeType, mimeType);
        map.set(MessageKeys.FileURL, fileURL);
        return map;
    }

    buildTextMeta (text: string): Map<string, any> {
        const map = new Map<string, any>();
        map.set(MessageKeys.Text, text);
        return map;
    }

    buildImageMeta (url: string, width: number, height: number): Map<string, any> {
        const map = new Map<string, any>();
        map.set(MessageKeys.ImageURL, url);
        map.set(MessageKeys.ImageWidth, width);
        map.set(MessageKeys.ImageHeight, height);
        return map;
    }

    buildMessage(from: string, to: Array<string>, type: MessageType, meta: Map<string, any>) {
        const message = {};

        message[MessageKeys.From] = from;
        message[MessageKeys.UserFirebaseID] = from;

        message[MessageKeys.To] = to;

        const metaObject = Utils.toObject(meta);

        message[MessageKeys.Meta] = metaObject;
        message[MessageKeys.JSONv2] = metaObject;

        message[MessageKeys.Date] = firebase.database.ServerValue.TIMESTAMP;
        message[MessageKeys.Type] = type;

        let read = new Map<string, any>();

        for (let i = 0; i < to.length; i++) {
            const status = {};
            status[MessageKeys.Status] = 0;
            read.set(to[i], status);
        }

        // Set my read status to read
        const status = {};
        status[MessageKeys.Status] = 2;
        read.set(from, status);

        message[MessageKeys.Read] = Utils.toObject(read);

        return message;
    }
}

angular.module('myApp.services')
    .service('Message', ['$rootScope', 'Time', 'UserStore', 'Config', 'CloudImage', function($rootScope, Time, UserStore, Config, CloudImage) {
        // we can ask for more parameters if needed
        return function messageFactory(mid: string, meta: Map<string, any>) { // return a factory instead of a new talker
            return new Message($rootScope, Time, UserStore, Config, CloudImage, mid, meta);
        }}])
    .service('MessageFactory', MessageFactory);
