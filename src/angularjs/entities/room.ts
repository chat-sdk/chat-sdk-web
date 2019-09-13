import * as angular from 'angular';
import * as firebase from 'firebase';

import * as PathKeys from '../keys/path-keys';
import * as RoomNameKeys from '../keys/room-name-keys';
import * as Keys from '../keys/keys';
import * as Defines from '../keys/defines';
import { N } from '../keys/notification-keys';
import { Entity , EntityFactory, IEntity} from './entity';
import { RoomKeys } from '../keys/room-keys';
import { IMessage , IMessageFactory} from './message';
import { RoomType } from '../keys/room-type';
import { MessageKeys } from '../keys/message-keys';
import { MessageType } from '../keys/message-type';
import { Dimensions } from '../keys/dimensions';
import { IUser } from './user';
import { Utils } from '../services/utils';
import { UserStatus } from '../keys/user-status';
import { UserKeys } from '../keys/user-keys';
import { Log } from '../services/log';
import { IFirebaseReference , IPaths} from '../network/paths';
import { IRootScope } from '../interfaces/root-scope';
import { IPresence } from '../network/presence';
import { IConfig } from '../services/config';
import { ICache } from '../persistence/cache';
import { IUserStore } from '../persistence/user-store';
import { IRoomPositionManager } from '../services/room-position-manager';
import { ISoundEffects } from '../services/sound-effects';
import { IVisibility } from '../services/visibility';
import { ITime } from '../services/time';
import { ICloudImage } from '../services/cloud-image';
import { IMarquee } from '../services/marquee';
import { IEnvironment } from '../services/environment';
import { INetworkManager } from '../network/network-manager';
import { StringAnyObject } from '../interfaces/string-any-object';

export interface IRoom extends IEntity {
    name: string;
    isOpen: boolean;
    slot: number;
    height: number;
    width: number;
    offset: number;
    type: RoomType;
    dragDirection: number;
    zIndex: number;
    draggable: boolean;
    invitedBy: IUser;
    deleted: boolean;
    messages: IMessage[];
    transcript(): string;
    setOffset(offset: number): void;
    updateOffsetFromSlot(): void;
    updateType(): void;
    loadMoreMessages(numberOfMessages?: number): Promise<Array<IMessage>>;
    rid(): string;
    on(): Promise<any>;
    off(): void;
    created(): number;
    getUserStatus(user: IUser): UserStatus;
    getType(): RoomType;
    containsOnlyUsers(users: IUser[]): boolean;
    addUserUpdate(user: IUser, status: UserStatus): {};
    removeUserUpdate(user: IUser): {};
    open(slot: number, duration?: number): void;
    close(): void;
    deserialize(sr: StringAnyObject): void;
    lastMessage(): IMessage;
    lastMessageTime(): number;
}

export interface IRoomFactory {
    addUserToRoom(user: IUser, room: IRoom, status: UserStatus): Promise<any>;
    removeUserFromRoom(user: IUser, room: IRoom): Promise<any>;
    updateRoomType(rid: string, type: RoomType): void;
}

class Room extends Entity implements IRoom {

    users = {};
    usersMeta = {};
    onlineUserCount = 0;
    messages = [];
    typing = {};
    typingMessage = '';
    badge = 0;
    isOn = false;
    draggable: boolean;
    type: RoomType;

    // Layout
    offset: number; // The x offset
    dragDirection = 0; // drag direction +ve / -ve

    width = Dimensions.ChatRoomWidth;
    height = Dimensions.ChatRoomHeight;
    zIndex = null;
    active = true; // in side list or not
    minimized = false;
    loadingMoreMessages = false;
    loadingTimer = null;
    muted = false;
    invitedBy: IUser;

    // Has the room been deleted?
    deleted = false;
    // When was the room deleted?
    deletedTimestamp = null;

    isOpen = false;
    readTimestamp = 0; // When was the thread last read?

    thumbnail = this.Environment.defaultRoomPictureURL();
    showImage = false;

    // The room associated with this use
    // this is used to make sure that if a user logs out
    // the next user who logs in doesn't see their
    // inbox
    associatedUserID = null;

    // TODO: Check this
    name = '';

    slot: number;
    unreadMessages: Array<IMessage>;

    userOnlineStateChangedNotificationOff?: () => void;

    messagesAreOn: boolean;

    constructor (
        private $rootScope: IRootScope,
        private $timeout: ng.ITimeoutService,
        private $window: ng.IWindowService,
        private Presence: IPresence,
        Paths: IPaths,
        private Config: IConfig,
        private Message/*: IMessage*/,
        private MessageFactory: IMessageFactory,
        private Cache: ICache,
        private UserStore: IUserStore,
        private User: IUser,
        private RoomPositionManager: IRoomPositionManager,
        private SoundEffects: ISoundEffects,
        private Visibility: IVisibility,
        private Time: ITime,
        private CloudImage: ICloudImage,
        private Marquee: IMarquee,
        private Environment: IEnvironment,
        private RoomFactory: IRoomFactory,
        private NetworkManager: INetworkManager,
        rid: string,
        meta?: Map<string, any>,
    ) {
        super(Paths, PathKeys.RoomsPath, rid);
        if (meta) {
            this.setMeta(meta);
        }
    }

    /***********************************
     * GETTERS AND SETTERS
     */

    getRID(): string {
        return this.rid();
    }

    getUserCreated(): boolean {
        return this.metaValue(RoomKeys.UserCreated);
    }

    /***********************************
     * UPDATE METHOD
     */

    /**
     * If silent is true then this will not broadcast to update the UI.
     * Primarily this is used when deserializing
     *
     * @param silent
     */
    update(silent = false) {
        this.updateName();
        // TODO: Check
        this.setImage(this.metaValue(RoomKeys.Image));
        this.updateOnlineUserCount();
        if (!silent) {
            this.$rootScope.$broadcast(N.RoomUpdated, this);
        }
    }

    updateTyping() {

        let i = 0;
        let name = null;
        for (let key in this.typing) {
            if (this.typing.hasOwnProperty(key)) {
                if (key == this.UserStore.currentUser().uid()) {
                    continue;
                }
                name = this.typing[key];
                i++;
            }
        }

        let typing = null;
        if (i == 1) {
            typing = name + '...';
        }
        else if (i > 1) {
            typing = i + ' people typing';
        }

        this.typingMessage = typing;
    }

    updateOnlineUserCount() {
        this.onlineUserCount = this.getOnlineUserCount();
    }

    updateName() {
        // If the room already has a name
        // use it
        const name = this.metaValue(RoomKeys.Name);
        if (name && name.length) {
            this.name = name;
            return;
        }

        // Otherwise build a room based on the users' names
        this.name = '';
        for (let key in this.users) {
            if (this.users.hasOwnProperty(key)) {
                let user = this.users[key];
                if (!user.isMe() && user.getName() && user.getName().length) {
                    this.name += user.getName() + ', ';
                }
            }
        }
        if (this.name.length >= 2) {
            this.name = this.name.substring(0, this.name.length - 2);
        }

        // Private chat x users
        // Ben Smiley
        if (!this.name || !this.name.length) {
            if (this.isPublic()) {
                this.name = RoomNameKeys.RoomDefaultNamePublic;
            }
            else if (this.userCount() == 1) {
                this.name = RoomNameKeys.RoomDefaultNameEmpty;
            }
            else if (this.getType() == RoomType.Group) {
                this.name = RoomNameKeys.RoomDefaultNameGroup;
            }
            else {
                this.name = RoomNameKeys.RoomDefaultName1To1;
            }
        }
    }

    /***********************************
     * LIFECYCLE: on -> open -> closed -> off
     */

    on(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isOn && this.rid()) {
                this.isOn = true;

                let on = () => {
                    // When a user changes online state update the room
                    this.userOnlineStateChangedNotificationOff = this.$rootScope.$on(N.UserOnlineStateChanged, (event, user: IUser) => {
                        Log.notification(N.UserOnlineStateChanged, 'Room');
                        // If the user is a member of this room, update the room
                        if (this.containsUser(user)) {
                            this.update();
                        }
                    });
                    this.$rootScope.$on(N.UserValueChanged, (event, user: IUser) => {
                        if (this.containsUser(user)) {
                            this.update();
                        }
                    });


                    this.usersMetaOn();
                    this.messagesOn(this.deletedTimestamp);

                    resolve();
                };

                // First get the meta
                this.metaOn().then(() => {

                    switch (this.getType()) {
                        case RoomType.OneToOne:
                            this.deleted = false;
                            this.userDeletedDate().then((timestamp) => {
                                if (timestamp) {
                                    this.deleted = true;
                                    this.deletedTimestamp = timestamp;
                                }
                                on();
                            });
                            break;
                        case RoomType.Public:
                        case RoomType.Group:
                            on();
                            break;
                        default:
                            resolve();
                    }

                });
            } else {
                resolve();
            }
        });
    }

    open(slot: number, duration = 300): void {
        const open = () => {
            // Add the room to the UI
            this.RoomPositionManager.insertRoom(this, slot, duration);

            // Start listening to message updates
            this.messagesOn(this.deletedTimestamp);

            // Start listening to typing indicator updates
            this.typingOn();

            // Update the interface
            this.$rootScope.$broadcast(N.RoomAdded);
        };

        switch (this.getType()) {
            case RoomType.Public:
                this.join(UserStatus.Member).then(() => open(), (error) => {
                    console.log(error);
                });
                break;
            case RoomType.Group:
            case RoomType.OneToOne:
                open();
        }
    }

    /**
     * Removes the room from the display
     * and leaves the room
     */
    close(): void {

        this.typingOff();
        this.messagesOff();

        let type = this.getType();

        switch (type) {
            case RoomType.Public:
            {
                this.RoomFactory.removeUserFromRoom(this.UserStore.currentUser(), this);
            }
        }

        this.RoomPositionManager.closeRoom(this);
    }

    async leave(): Promise<any> {
        this.deleteMessages();
        this.$rootScope.$broadcast(N.RoomRemoved);
        this.deleted = true;
        await this.RoomFactory.removeUserFromRoom(this.UserStore.currentUser(), this);
        this.off();
    }

    off() {
        this.isOn = false;

        if (this.userOnlineStateChangedNotificationOff) {
            this.userOnlineStateChangedNotificationOff();
        }

        this.metaOff();
        this.usersMetaOff();
    }

    getType(): RoomType {
        let type = parseInt(this.metaValue(RoomKeys.Type));
        if (!type) {
            type = parseInt(this.metaValue(RoomKeys.Type_v4));
        }
        return type;
    }

    calculatedType(): RoomType {

        let type: RoomType = null;

        if (this.isPublic()) {
            type = RoomType.Public;
        }
        else {
            if (this.userCount() <= 1) {
                type = RoomType.Invalid;
            }
            else if (this.userCount() == 2) {
                type = RoomType.OneToOne;
            }
            else {
                type = RoomType.Group;
            }
        }

        return type;
    }

    updateType() {
        const type = this.calculatedType();
        if (type != this.getType()) {
            // One important thing is that we can't go from group -> 1to1
            if (this.getType() != RoomType.Group) {
                this.RoomFactory.updateRoomType(this.rid(), type);
            }
        }
    }

    /**
     * Message flagging
     */

    toggleMessageFlag(message: IMessage) {
        if (message.flagged) {
            return this.unflagMessage(message);
        }
        else {
            return this.flagMessage(message);
        }
    }

    async flagMessage(message: IMessage) {

        message.flagged = true;

        const ref = this.Paths.flaggedMessageRef(message.mid);

        const data = {};

        data[Keys.Creator] = this.UserStore.currentUser().uid();
        data[Keys.CreatorEntityID] = data[Keys.Creator];

        data[Keys.From] = message.metaValue(MessageKeys.UserFirebaseID);
        data[Keys.SenderEntityID] = data[Keys.From];

        data[Keys.MessageKey] = message.text();
        data[Keys.ThreadKey] = message.rid;
        data[Keys.DateKey] = firebase.database.ServerValue.TIMESTAMP;

        await ref.set(data);
        message.flagged = false;
        this.$rootScope.$broadcast(N.ChatUpdated, this);
    }

    async unflagMessage(message: IMessage) {
        message.flagged = false;

        const ref = this.Paths.flaggedMessageRef(message.mid);
        await ref.remove();
        message.flagged = true;
        this.$rootScope.$broadcast(N.ChatUpdated, this);
    }

    isPublic(): boolean {
        return this.getType() == RoomType.Public;
    }

    rid(): string {
        return this._id;
    }

    created(): number {
        return this.metaValue(RoomKeys.Created);
    }

    lastMessageExists(): boolean {
        return this.messages.length > 0;
    }

    lastMessageType(): MessageType {
        if (this.lastMessageExists()) {
            this.lastMessage().type();
        }
        return null;
    }

    lastMessage(): IMessage {
        if (this.lastMessageExists()) {
            return this.messages[this.messages.length - 1];
        }
        return null;
    }

    lastMessageUserName(): string {
        if (this.lastMessageExists()) {
            return this.lastMessage().user.getName();
        }
        return null;
    }

    lastMessageTime(): number {
        if (this.lastMessageExists()) {
            return this.lastMessage().time();
        }
        return null;
    }

    lastMessageDate(): Date {
        if (this.lastMessageExists()) {
            return this.lastMessage().date();
        }
        return null;
    }

    lastMessageText(): string {
        if (this.lastMessageExists()) {
            return this.lastMessage().text();
        }
        return null;
    }

    /**
     * Add the user to the room and add the room to the
     * user in Firebase
     * @param status
     */
    join(status: UserStatus): Promise<any> {
        return this.RoomFactory.addUserToRoom(this.UserStore.currentUser(), this, status);
    }

    setActive(active: boolean) {
        if (active) {
            this.markRead();
        }
        this.active = active;
    }

    setSizeToDefault() {
        this.width = Dimensions.ChatRoomWidth;
        this.height = Dimensions.ChatRoomHeight;
    }

    flashHeader(): boolean {
        // TODO: Implement this
        // Ideally if the chat is in the side bar then bring it
        // to the front
        // Or flash the side bar
        if (this.RoomPositionManager.roomIsOpen(this)) {
            this.$rootScope.$broadcast(N.RoomFlashHeader, this, '#555', 500, 'room-header');
            this.$rootScope.$broadcast(N.RoomFlashHeader, this, '#CCC', 500, 'room-list');
            return true;
        }
        return false;
    }

    /***********************************
     * USERS
     */

    getUserInfoWithUID(uid: string) {
        // This could be called from the UI so it's important
        // to wait until users has been populated
        if (this.usersMeta) {
            return this.usersMeta[uid];
        }
        return null;
    }

    getUserInfo(user: IUser) {
        // This could be called from the UI so it's important
        // to wait until users has been populated
        if (user && user.meta) {
            return this.getUserInfoWithUID(user.uid());
        }
        return null;
    }

    getUserStatus(user: IUser): UserStatus {
        let info = this.getUserInfo(user);
        return info ? info[UserKeys.Status] : null;
    }

    getUsers(): { [uid: string]: IUser } {
        let users = {};
        for (let key in this.users) {
            if (this.users.hasOwnProperty(key)) {
                let user = this.users[key];
                if (user.meta && this.UserStore.currentUser() && this.UserStore.currentUser().meta) {
                    if (user.uid() != this.UserStore.currentUser().uid()) {
                        users[user.uid()] = user;
                    }
                }
            }
        }
        return users;
    }

    getUserIDs(): Array<string> {
        const users = new Array<string>();
        for (let key in this.users) {
            if (this.users.hasOwnProperty(key)) {
                users.push(key);
            }
        }
        return users;
    }

    // userIsActiveWithUID(uid) {
    //     let info = this.getUserInfo(uid);
    //     return this.RoomFactory.userIsActiveWithInfo(info);
    // };

    getOwner(): IUser {
        // get the owner's ID
        let data = null;

        for (let key in this.usersMeta) {
            if (this.usersMeta.hasOwnProperty(key)) {
                data = this.usersMeta[key];
                if (data.status == UserStatus.Owner) {
                    break;
                }
            }
        }
        if (data) {
            return this.UserStore.getOrCreateUserWithID(data.uid);
        }
        return null;
    }

//        isClosed() {
//            return this.getUserStatus(this.UserStore.currentUser()) == UserStatusClosed;
//        };

    containsUser(user: IUser) {
        return this.users[user.uid()] != null;
    }

    // Update the timestamp on the user status
    // updateUserStatusTime(user): Promise<any> {
    //
    //     let data = {
    //         time: firebase.database.ServerValue.TIMESTAMP
    //     };
    //
    //     let ref = this.Paths.roomUsersRef(this.rid());
    //     return ref.child(user.uid()).update(data);
    // };

    /***********************************
     * ROOM INFORMATION
     */

    getOnlineUserCount() {
        let i = 0;
        for (let key in this.usersMeta) {
            if (this.usersMeta.hasOwnProperty(key)) {
                let user = this.usersMeta[key];
                if (this.UserStore.currentUser() && this.UserStore.currentUser().meta) {
                    if ((this.UserStore.users[user.uid].online || this.UserStore.currentUser().uid() == user.uid)) {
                        i++;
                    }
                }
            }
        }
        return i;
    }

    userCount() {
        let i = 0;
        for (let key in this.users) {
            if (this.users.hasOwnProperty(key)) {
                i++;
            }
        }
        return i;
    }

    containsOnlyUsers(users: IUser[]) {
        let usersInRoom = 0;
        const totalUsers = this.userCount();

        for (let i = 0; i < users.length; i++) {
            if (this.users[users[i].uid()]) {
                usersInRoom++;
            }
        }
        return usersInRoom == users.length && usersInRoom == totalUsers;
    }

    /***********************************
     * LAYOUT
     */

        // If the room is animating then
        // return the destination
    getOffset(): number {
        return this.offset;
    }

    getCenterX(): number {
        return this.getOffset() + this.width / 2;
    }

    getMinX(): number {
        return this.getOffset();
    }

    getMaxX(): number {
        return this.getOffset() + this.width;
    }

    updateOffsetFromSlot() {
        this.setOffset(this.RoomPositionManager.offsetForSlot(this.slot));
    }

    setOffset(offset: number) {
        this.offset = offset;
    }

    setSlot(slot: number) {
        this.slot = slot;
    }

    /***********************************
     * MESSAGES
     */

    sendImageMessage(user: IUser, url: string, width: number, height: number): Promise<any> {
        const meta = this.MessageFactory.buildImageMeta(url, width, height);
        const messageMeta = this.MessageFactory.buildMessage(user.uid(), this.getUserIDs(), MessageType.Image, meta);
        return this.sendMessage(messageMeta, user);
    }

    sendFileMessage(user: IUser, fileName: string, mimeType: string, fileURL: string): Promise<any> {
        const meta = this.MessageFactory.buildFileMeta(fileName, mimeType, fileURL);
        const messageMeta = this.MessageFactory.buildMessage(user.uid(), this.getUserIDs(), MessageType.File, meta);
        return this.sendMessage(messageMeta, user);
    }

    sendTextMessage(user: IUser, text: string): Promise<any> {
        if (!text || text.length === 0) {
            return;
        }
        const meta = this.MessageFactory.buildTextMeta(text);
        const messageMeta = this.MessageFactory.buildMessage(user.uid(), this.getUserIDs(), MessageType.Text, meta);
        return this.sendMessage(messageMeta, user);
    }

    sendMessage(messageMeta: {}, user): Promise<any> {
        let innerSendMessage = ((message, user) => {

            // Get a ref to the room
            const ref = this.Paths.roomMessagesRef(this.rid());

            // Add the message
            const newRef = ref.push() as IFirebaseReference;

            const p1 = newRef.setWithPriority(messageMeta, firebase.database.ServerValue.TIMESTAMP);

            // The user's been active so update their status
            // with the current time
            // this.updateUserStatusTime(user);

            // Avoid a clash..
            const p2 = this.updateState(PathKeys.MessagesPath);

            return Promise.all([
                p1, p2
            ]);

        });

        return innerSendMessage(messageMeta, user).catch((error) => {
            this.Presence.update().then(() => {
                return innerSendMessage(messageMeta, user);
            });
        });
    }

    addMessagesFromSerialization (sm) {
        for (let i = 0; i < sm.length; i++) {
            this.addMessageFromSerialization(sm[i]);
        }
        // Now update all the message displays

    }

    addMessageFromSerialization (sm) {
        const message = this.getMessageFromMeta(sm.mid, sm.meta);
        message.deserialize(sm);
        this.addMessageToEnd(message, true);
    }

    getMessageFromMeta (mid: string, metaValue) {
        return this.Message(mid, metaValue);
    }

    getMessagesNewerThan(date: Date = null, number: number = null): Array<IMessage> {
        const messages = new Array<IMessage>();
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            if (!date || message.date() > date) {
                messages.push(this.messages[i]);
            }
        }
        return messages;
    }

    addMessageToStart (message: IMessage, silent = true): void {
        if (this.messages.length) {
            const nextMessage = this.messages[0];
            nextMessage.previousMessage = message;
            message.nextMessage = nextMessage;
            message.updateDisplay();
            nextMessage.updateDisplay();
        }
        this.messages.unshift(message);
        this.update(silent);
    }

    addMessageToEnd (message: IMessage, silent = false): void {
        if (this.messages.length) {
            const previousMessage = this.messages[this.messages.length - 1];
            previousMessage.nextMessage = message;
            message.previousMessage = previousMessage;
            message.updateDisplay();
            previousMessage.updateDisplay();
        }
        this.updateBadgeForMessage(message);
        this.messages.push(message);

        if (message.user && !silent) {
            this.Marquee.startWithMessage(message.user.getName() + ': ' + message.text());
        }

        this.update(silent);
    }

    updateBadgeForMessage(message: IMessage): void {
        if (this.shouldIncrementUnreadMessageBadge() && !message.read && (message.time() > this.readTimestamp || !this.readTimestamp)) {

            if (!this.unreadMessages) {
                this.unreadMessages  = [];
            }

            this.unreadMessages.push(message);
        }
        else {
            // Is the room active? If it is then mark the message
            // as seen
            message.markRead();
        }
    }

    getMessagesOlderThan(date: Date = null, number: number = null): Array<IMessage> {
        const messages = new Array<IMessage>();
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            if (!date || message.date() < date) {
                messages.push(this.messages[i]);
            }
        }
        return messages;
    }

    loadLocalMessages (fromDate: Date, number: number): Array<IMessage> {
        const messages = new Array<IMessage>();

        return messages;
    }

    // Load m
    loadMessagesOlderThan (date: Date = null, number: number): Promise<Array<IMessage>> {

        let ref = this.Paths.roomMessagesRef(this.rid());
        let query = ref.orderByChild(MessageKeys.Date).limitToLast(number);

        if (date) {
            query = query.endAt(date.getTime() - 1, MessageKeys.Date);
        }

        return <Promise<Array<IMessage>>> query.once('value').then((snapshot: firebase.database.DataSnapshot) => {
            const val = snapshot.val();
            const messages = new Array<IMessage>();
            if (val) {
                Object.keys(val).forEach(key => {
                    messages.push(this.Message(key, val[key]));
                });
            }
            return messages;
        }).catch((e) => {
            console.log(e.message);
        });
    }

    loadMoreMessages(numberOfMessages: number = 10): Promise<Array<IMessage>> {

        if (this.loadingMoreMessages) {
            return Promise.resolve([]);
        }
        this.loadingMoreMessages = true;

        let date = null;
        if (this.messages.length) {
            date = this.messages[0].date();
        }

        return this.loadMessagesOlderThan(date, numberOfMessages).then(messages => {

            const len = messages.length - 1;
            for (let i = 0; i < messages.length; i++) {
                this.addMessageToStart(messages[len - i]);
            }


            // Add messages to front of global list
            // Ignore the last message - it's a duplicate
            // let lastMessage = null;
            // for (let i = messages.length - 2; i >= 0; i--) {
            //     if (this.messages.length > 0) {
            //         lastMessage = this.messages[0];
            //     }
            //     this.messages.unshift(messages[i]);
            //     if (lastMessage) {
            //         lastMessage.hideName = lastMessage.shouldHideUser(messages[i]);
            //         lastMessage.hideTime = lastMessage.shouldHideDate(messages[i]);
            //     }
            // }

            this.loadingMoreMessages = false;

            this.$rootScope.$broadcast(N.LazyLoadedMessages, this);

            return messages;
        });
    }

    sortMessages() {
        // Now we should sort all messages
        this.sortMessageArray(this.messages);
    }

    deduplicateMessages() {
        let uniqueMessages = [];

        // Deduplicate list
        let lastMID = null;
        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].mid != lastMID) {
                uniqueMessages.push(this.messages[i]);
            }
            lastMID = this.messages[i].mid;
        }

        this.messages = uniqueMessages;

    }

    deleteMessages() {
        this.messages.length = 0;
        if (this.unreadMessages) {
            this.unreadMessages.length = 0;
        }
    }

    sortMessageArray(messages) {
        messages.sort((a, b) => {
            return a.time() - b.time();
        });
    }

    markRead() {

        let messages = this.unreadMessages;

        if (messages && messages.length > 0) {

            for (let i in messages) {
                if (messages.hasOwnProperty(i)) {
                    messages[i].markRead();
                }
            }

            // Clear the messages array
            while(messages.length > 0) {
                messages.pop();
            }
        }
        this.badge = 0;
        this.sendBadgeChangedNotification();

        // Mark the date when the thread was read
        if (!this.isPublic())
            this.UserStore.currentUser().markRoomReadTime(this.rid());

    }

    updateImageURL(imageURL) {
        // Compare to the old URL
        let imageChanged = imageURL != this.metaValue(RoomKeys.Image);
        if (imageChanged) {
            this.setMetaValue(RoomKeys.Image, imageURL);
            this.setImage(imageURL, false);
            return this.pushMeta();
        }
    }

    setImage(image, isData = false) {

        this.showImage = this.getType() == RoomType.Public;

        if (!image) {
            image = this.Environment.defaultRoomPictureURL();
        }
        else {
            if (isData || image == this.Environment.defaultRoomPictureURL()) {
                this.thumbnail = image;
            }
            else {
                this.thumbnail = this.CloudImage.cloudImage(image, 30, 30);
            }
        }
    }

    pushMeta(): Promise<any> {
        const ref = this.Paths.roomMetaRef(this.rid());
        return ref.update(this.getMetaObject()).then(() => {
            return this.updateState(Keys.DetailsKey);
        });
    }

    sendBadgeChangedNotification() {
        this.$rootScope.$broadcast(N.LazyLoadedMessages, this);
    }

    transcript() : string {

        let transcript: string = '';

        for (let i in this.messages) {
            if (this.messages.hasOwnProperty(i)) {
                let m = this.messages[i];
                transcript += this.Time.formatTimestamp(m.time()) + ' ' + m.user.getName() + ': ' + m.text() + '\n';
            }
        }

        return transcript;
    }

    /***********************************
     * TYPING INDICATOR
     */

    startTyping(user): Promise<any> {
        // The user is typing...
        const ref = this.Paths.roomTypingRef(this.rid()).child(user.uid());
        const promise = ref.set({name: user.getName()});

        // If the user disconnects, tidy up by removing the typing
        // indicator
        ref.onDisconnect().remove();
        return promise;
    }

    finishTyping(user): Promise<any> {
        const ref = this.Paths.roomTypingRef(this.rid()).child(user.uid());
        return ref.remove();
    }

    /***********************************
     * SERIALIZATION
     */

    serialize(): {} {
        const superData = super.serialize();

        const m = [];
        for (let i = 0; i < this.messages.length; i++) {
            m.push(this.messages[i].serialize());
        }
        const data = {
            minimized: this.minimized,
            width: this.width,
            height: this.height,
            //offset: this.offset,
            messages: m,
            usersMeta: this.usersMeta,
            deleted: this.deleted,
            isOpen: this.isOpen,
            //badge: this.badge,
            associatedUserID: this.associatedUserID,
            offset: this.offset,
            readTimestamp: this.readTimestamp,
        };
        return {...superData, ...data};
    }

    deserialize(sr): void {
        if (sr) {
            super.deserialize(sr);
            this.minimized = sr.minimized;
            this.width = sr.width;
            this.height = sr.height;
            this.deleted = sr.deleted;
            this.isOpen = sr.isOpen;
            //this.badge = sr.badge;
            this.associatedUserID = sr.associatedUserID;
            this.offset = sr.offset;
            this.readTimestamp = sr.readTimestamp;

            //this.setUsersMeta(sr.usersMeta);

            for (let key in sr.usersMeta) {
                if (sr.usersMeta.hasOwnProperty(key)) {
                    this.addUserMeta(sr.usersMeta[key]);
                }
            }
            //this.offset = sr.offset;

            this.addMessagesFromSerialization(sr.messages);

        }
    }

    /***********************************
     * FIREBASE
     */

    /**
     * Start listening to updates in the
     * room meta data
     */
    metaOn() {
        return this.pathOn(Keys.DetailsKey, (val) => {
            if (val) {
                this.setMeta(val);
                this.update();
            }
        });
    }

    metaOff() {
        this.pathOff(Keys.DetailsKey);
    }

    addUserMeta(meta) {
        // We only display users who have been active
        // recently
        // if (this.RoomFactory.userIsActiveWithInfo(meta)) {
        this.usersMeta[meta[Keys.userUID]] = meta;

        // Add the user object
        let user = this.UserStore.getOrCreateUserWithID(meta[Keys.userUID]);
        this.users[user.uid()] = user;

        this.update(false);
        // }
    }

    removeUserMeta(meta) {
        delete this.usersMeta[meta[Keys.userUID]];
        delete this.users[meta[Keys.userUID]];
        this.update(false);
    }

    usersMetaOn() {

        let roomUsersRef = this.Paths.roomUsersRef(this.rid());

        roomUsersRef.on('child_added', (snapshot) => {
            if (snapshot.val() && snapshot.val()) {
                let meta = snapshot.val();
                meta.uid = snapshot.key;
                this.addUserMeta(meta);
            }
        });

        roomUsersRef.on('child_removed', (snapshot) => {
            if (snapshot.val()) {
                let meta = snapshot.val();
                meta.uid = snapshot.key;
                this.removeUserMeta(meta);
            }
        });
    }

    usersMetaOff() {
        this.Paths.roomUsersRef(this.rid()).off();
    }

    userDeletedDate(): Promise<number> {
        const ref = this.Paths.roomUsersRef(this.rid()).child(this.UserStore.currentUser().uid());
        return ref.once('value').then((snapshot) => {
            let val = snapshot.val();
            if (val && val.status == UserStatus.Closed) {
                return val.time;
            }
            return null;
        });
    }

    /**
     * Start listening to messages being added
     */

    updateUnreadMessageCounter(messageMeta) {
        if (this.shouldIncrementUnreadMessageBadge() && (messageMeta[MessageKeys.Date] > this.readTimestamp || !this.readTimestamp)) {
            // If this is the first badge then this.badge will
            // undefined - so set it to one
            if (!this.badge) {
                this.badge = 1;
            }
            else {
                this.badge = Math.min(this.badge + 1, 99);
            }
            this.sendBadgeChangedNotification();
        }
    }

    shouldIncrementUnreadMessageBadge() {
        return (!this.active || this.minimized || !this.RoomPositionManager.roomIsOpen(this));// && !this.isPublic();
    }

    messagesOn(timestamp) {

        // Make sure the room is valid
        if (this.messagesAreOn || !this.rid()) {
            return;
        }
        this.messagesAreOn = true;

        // Also get the messages from the room
        let ref: firebase.database.Query = this.Paths.roomMessagesRef(this.rid());

        let startDate = timestamp;
        if (Utils.unORNull(startDate)) {
            // If we already have a message then only listen for new
            // messages
            const lastMessageTime = this.lastMessageTime();
            if (lastMessageTime) {
                startDate = lastMessageTime + 1;
            }
        }
        else {
            startDate++;
        }

        if (startDate) {
            // Start 1 thousandth of a second after the last message
            // so we don't get a duplicate
            ref = ref.startAt(startDate);
        }
        ref = ref.limitToLast(this.Config.maxHistoricMessages);

        // Add listen to messages added to this thread
        ref.on('child_added', (snapshot) => {

            if (this.Cache.isBlockedUser(snapshot.val()[MessageKeys.UID])) {
                return;
            }

            const message = this.getMessageFromMeta(snapshot.key, snapshot.val());
            this.addMessageToEnd(message);

            // Trim the room to make sure the message count isn't growing
            // out of control
            this.trimMessageList();

            // Is the window visible?
            // Play the sound
            if (!this.muted) {
                if (this.Visibility.getIsHidden()) {
                    // Only make a sound for messages that were received less than
                    // 30 seconds ago
                    if (Defines.DEBUG) console.log('Now: ' + new Date().getTime() + ', Date now: ' + this.Time.now() + ', Message: ' + snapshot.val()[MessageKeys.Date]);
                    if (Defines.DEBUG) console.log('Diff: ' + Math.abs(this.Time.now() - snapshot.val().time));
                    if (Math.abs(this.Time.now() - snapshot.val()[MessageKeys.Date]) / 1000 < 30) {
                        this.SoundEffects.messageReceived();
                    }
                }
            }

        });

        ref.on('child_removed', (snapshot) => {
            if (snapshot.val()) {
                for (let i = 0; i < this.messages.length; i++) {
                    let message = this.messages[i];
                    if (message.mid == snapshot.key) {
                        this.messages.splice(i, 1);
                        break;
                    }
                }
                //this.$rootScope.$broadcast(DeleteMessageNotification, snapshot.val().meta.mid);
                this.update(false);
            }
        });

    }

    trimMessageList() {
        this.sortMessages();
        this.deduplicateMessages();

        let toRemove = this.messages.length - 100;
        if (toRemove > 0) {
            for (let j = 0; j < toRemove; j++) {
                this.messages.shift();

            }
        }
    }

    messagesOff() {

        this.messagesAreOn = false;

        // Get the room meta data
        if (this.rid()) {
            this.Paths.roomMessagesRef(this.rid()).off();
        }
    }

    typingOn() {

        // Handle typing
        let ref = this.Paths.roomTypingRef(this.rid());

        ref.on('child_added', (snapshot) => {
            this.typing[snapshot.key] = snapshot.val().name;

            this.updateTyping();

            // Send a notification to the chat room
            this.$rootScope.$broadcast(N.ChatUpdated, this);
        });

        ref.on('child_removed', (snapshot) => {
            delete this.typing[snapshot.key];

            this.updateTyping();

            // Send a notification to the chat room
            this.$rootScope.$broadcast(N.ChatUpdated, this);
        });

    }

    typingOff() {
        this.Paths.roomTypingRef(this.rid()).off();
    }

    // lastMessageOn() {
    //     let lastMessageRef = this.Paths.roomLastMessageRef(this.rid());
    //     lastMessageRef.on('value', (snapshot) => {
    //         if (snapshot.val()) {
    //
    //             this.setLastMessage(snapshot.val(), );
    //
    //             // If the message comes in then we should make sure
    //             // the room is un deleted
    //             if (!this.Cache.isBlockedUser(this.lastMessage.user.uid())) {
    //                 if (this.deleted) {
    //                     this.deleted = false;
    //                     this.$rootScope.$broadcast(N.RoomAdded, this);
    //                 }
    //             }
    //
    //             this.updateUnreadMessageCounter(this.lastMessage.meta);
    //             this.update(false);
    //
    //         }
    //     });
    // };

    // lastMessageOff() {
    //     this.Paths.roomLastMessageRef(this.rid()).off();
    // };

    /**
     * Remove a public room
     * @returns {promise}
     */
    removeFromPublicRooms(): Promise<any> {
        const ref = this.Paths.publicRoomRef(this.getRID());
        return ref.remove();
    }

    userIsMember(user) {
        let userStatus = this.getUserStatus(user);
        return userStatus == UserStatus.Member || userStatus == UserStatus.Owner;
    }

    addUserUpdate(user: IUser, status: UserStatus): {} {
        const update = {};
        const path = this.relativeFirebasePath(this.Paths.roomUsersRef(this.rid()).child(user.uid()).child(UserKeys.Status));
        update[path] = status;
        return update;
    }

    removeUserUpdate(user: IUser): {} {
        const update = {};
        let data = null;
        if (this.getType() == RoomType.OneToOne) {
            data = {};
            data[RoomKeys.Deleted] = firebase.database.ServerValue.TIMESTAMP;
            data[RoomKeys.Name] = user.getName();
        }
        update[this.relativeFirebasePath(this.usersRef().child(user.uid()))] = data;
        return update;
    }

    usersRef(): firebase.database.Reference {
        return this.Paths.roomUsersRef(this.rid());
    }


}

class RoomFactory implements IRoomFactory {

    static $inject = [
        '$rootScope',
        'Time',
        'UserStore',
        'EntityFactory',
        'Paths',
    ];

    constructor (
        private $rootScope,
        private Time,
        private UserStore,
        private EntityFactory,
        private Paths) {}

    // **********************
    // *** Static methods ***
    // **********************



    // Group chats should be handled separately to
    // private chats
    updateRoomType(rid: string, type: RoomType) {

        const ref = this.Paths.roomMetaRef(rid);
        const data = {};
        data[Keys.TypeKey] = type;

        return ref.update(data);
    }

    removeUserFromRoom (user: IUser, room: IRoom): Promise<any> {
        const updates = {...room.removeUserUpdate(user), ...user.removeRoomUpdate(room)};
        return this.Paths.firebase().update(updates);
    }

    addUserToRoom(user: IUser, room: IRoom, status: UserStatus): Promise<any> {

        const updates = {...user.addRoomUpdate(room), ...room.addUserUpdate(user, status)};

        return this.Paths.firebase().update(updates).then(() => {
            if (room.getType() == RoomType.Public) {
                user.removeOnDisconnect(PathKeys.RoomsPath + '/' + room.rid());
                room.removeOnDisconnect(PathKeys.UsersPath + '/' + user.uid())
            }
            return Promise.all([
                room.updateState(PathKeys.UsersPath),
                user.updateState(PathKeys.RoomsPath)
            ]);
        }).catch((error) => {
            console.log(error);
        });
    }

    roomMeta(rid, name, description, userCreated, invitesEnabled, type, weight) {

        const m = {};
        // TODO: Is this used?
        // m[RoomKeys.RID] = rid ? rid : null;
        m[RoomKeys.Name] = name ? name : null;
        m[RoomKeys.InvitesEnabled] = !Utils.unORNull(invitesEnabled) ? invitesEnabled : true;
        m[RoomKeys.Description] = description ? description : null;
        m[RoomKeys.UserCreated] = !Utils.unORNull(userCreated) ? userCreated : true;
        m[RoomKeys.Created] = firebase.database.ServerValue.TIMESTAMP;
        m[RoomKeys.Weight] = weight ? weight : 0;

        m[RoomKeys.Type] = type;
        m[RoomKeys.Type_v4] = type; // Deprecated

        return m;
    }

    // userIsActiveWithInfo(info) {
    //     // TODO: For the time being assume that users that
    //     // don't have this information are active
    //     if (info && info.status && info.time) {
    //         if (info.status != UserStatus.Closed) {
    //             return this.Time.secondsSince(info.time) < 60 * 60 * 24;
    //         }
    //     }
    //     return true;
    // };

}

export interface IRoomCreator {
    createRoomWithRID(rid: string, name: string, description: string, invitesEnabled: boolean, type: RoomType, userCreated: boolean, weight: number): Promise<IRoom>
    createPublicRoom(name: string, description: string, weight?): Promise<IRoom>
    createRoom(name: string, description: string, invitesEnabled: boolean, type: RoomType, weight?): Promise<IRoom>
}

class RoomCreator implements IRoomCreator {

    static $inject = ['Room', 'UserStore', 'Paths', 'RoomFactory', 'EntityFactory'];

    constructor(private Room, private UserStore, private Paths, private RoomFactory, private EntityFactory) {

    }

    createRoom(name: string, description: string, invitesEnabled: boolean, type: RoomType, weight = 0): Promise<IRoom> {
        return this.createRoomWithRID(null, name, description, invitesEnabled, type, true, weight);
    }

    createRoomWithRID(rid: string, name: string, description: string, invitesEnabled: boolean, type: RoomType, userCreated: boolean, weight: number): Promise<IRoom> {

        if (Utils.unORNull(rid)) {
            rid = this.Paths.roomsRef().push().key;
        }
        const roomMeta = this.RoomFactory.roomMeta(rid, name, description, true, invitesEnabled, type, weight);

        const room = this.Room(rid, roomMeta);

        roomMeta[RoomKeys.Creator] = this.UserStore.currentUser().uid();
        roomMeta[RoomKeys.CreatorEntityID] = roomMeta[RoomKeys.Creator];

        const roomMetaRef = this.Paths.roomMetaRef(rid);

        // Add the room to Firebase
        return roomMetaRef.set(roomMeta).then(() => {
            return this.RoomFactory.addUserToRoom(this.UserStore.currentUser(), room, UserStatus.Owner).then(() => {
                if (type == RoomType.Public) {
                    const ref = this.Paths.publicRoomRef(rid);

                    const data = {};

                    data[RoomKeys.Created] = firebase.database.ServerValue.TIMESTAMP;
                    data[RoomKeys.RID] = rid;
                    data[RoomKeys.UserCreated] = true;

                    return ref.set(data);
                }
            }).then(() => {
                const _ = this.EntityFactory.updateState(PathKeys.RoomsPath, rid, Keys.DetailsKey);
                return room;
            });
        });
    }

    createPublicRoom(name: string, description: string, weight = 0): Promise<IRoom> {
        return this.createRoom(name, description, true, RoomType.Public, weight);
    }

    createPrivateRoom(users: [IUser]): Promise<IRoom> {

        // Since we're calling create room we will be added automatically
        return this.createRoom(
            null,
            null,
            true,
            users.length == 1 ? RoomType.OneToOne : RoomType.Group
        ).then((room: IRoom) => {

            let promises = [];

            for (let i = 0; i < users.length; i++) {
                promises.push(
                    this.RoomFactory.addUserToRoom(users[i], room, UserStatus.Member)
                );
            }

            return Promise.all(promises).then(() => {
                return room;
            });
        });
    }

}

angular.module('myApp.services')
    .service('Room', [
        '$rootScope',
        '$timeout',
        '$window',
        'Presence',
        'Paths',
        'Config',
        'Message',
        'MessageFactory',
        'Cache',
        'UserStore',
        'User',
        'RoomPositionManager',
        'SoundEffects',
        'Visibility',
        'Time',
        'CloudImage',
        'Marquee',
        'Environment',
        'RoomFactory',
        'NetworkManager'
        ,function(
            $rootScope,
            $timeout,
            $window,
            Presence,
            Paths,
            Config,
            Message,
            MessageFactory,
            Cache,
            UserStore,
            User,
            RoomPositionManager,
            SoundEffects,
            Visibility,
            Time,
            CloudImage,
            Marquee,
            Environment,
            RoomFactory,
            NetworkManager
        ) {
            // we can ask for more parameters if needed
            return function roomFactory(rid: string, meta?: Map<string, any>) { // return a factory instead of a new talker
                return new Room(
                    $rootScope,
                    $timeout,
                    $window,
                    Presence,
                    Paths,
                    Config,
                    Message,
                    MessageFactory,
                    Cache,
                    UserStore,
                    User,
                    RoomPositionManager,
                    SoundEffects,
                    Visibility,
                    Time,
                    CloudImage,
                    Marquee,
                    Environment,
                    RoomFactory,
                    NetworkManager,
                    rid,
                    meta,
                );
            }}])
    .service('RoomFactory', RoomFactory)
    .service('RoomCreator', RoomCreator);

