import * as angular from 'angular'
import * as firebase from 'firebase';

import * as PathKeys from "../keys/path-keys";
import {N} from "../keys/notification-keys";
import * as Keys from "../keys/keys";
import {Entity, IEntity} from "./entity";
import {userUID} from "../keys/keys";
import {UserKeys} from "../keys/user-keys";
import {UserAllowInvites} from "../keys/allow-invite-type";
import {Utils} from "../services/utils";
import {IRoom} from "./room";
import {RoomKeys} from "../keys/room-keys";
import {IRootScope} from "../controllers/app";

export interface IUser extends IEntity {
    online: boolean
    meta: Map<string, any>
    unblock: () => void

    uid(): string
    isMe(): boolean

    setName(name): void
    getName(): string
    name(value): string

    getImageURL(): string
    setImageURL(imageURL): void

    setImage(image, isData?): void

    setProfileHTML(profileHTML): void
    hasImage(): boolean
    addRoomUpdate(room: IRoom): {}
    removeRoomUpdate(room: IRoom): {}
    updateImageURL(imageURL): Promise<any>
    pushMeta(): Promise<any>
    on(): Promise<any>
    off(): void
    unblockUser(block): void
    canBeInvitedByUser(invitingUser: IUser): boolean
    allowInvitesFrom(type): boolean
    deserialize(su): void
}

class User extends Entity implements IUser {

    public meta = new Map<string, any>();
    public online: boolean;
    private image;
    unblock: () => void = null;

    constructor (
        private $rootScope: IRootScope,
        private $timeout,
        Paths,
        private CloudImage,
        private Environment,
        private NetworkManager,
        uid: string) {
        super(Paths, PathKeys.UsersPath, uid);

        this.setImageURL(Environment.defaultProfilePictureURL());
        this.setUID(uid);
        this.setAllowInvites(UserAllowInvites.Everyone);

    }

    getName() {
        return this.getMetaValue(UserKeys.Name);
    };

    setName(name): void {
        return this.setMetaValue(UserKeys.Name, name);
    };

    name(value): string {
        if (Utils.unORNull(value)) {
            return this.getName();
        } else {
            this.setName(value);
        }
    };

    getStatus() {
        return this.getMetaValue(UserKeys.Status);
    };

    setStatus(status) {
        return this.setMetaValue(UserKeys.Status, status);
    };

    // For Angular getterSetter binding
    status(value) {
        if (Utils.unORNull(value)) {
            return this.getStatus();
        } else {
            this.setStatus(value);
        }
    };

    getLocation() {
        return this.getMetaValue(UserKeys.Location);
    };

    setLocation(location) {
        return this.setMetaValue(UserKeys.Location, location);
    };

    location(value) {
        if (Utils.unORNull(value)) {
            return this.getLocation();
        } else {
            this.setLocation(value);
        }
    };

    getCountryCode() {
        return this.getMetaValue(UserKeys.CountryCode);
    };

    setCountryCode(countryCode) {
        return this.setMetaValue(UserKeys.CountryCode, countryCode);
    };

    countryCode(value) {
        if (Utils.unORNull(value)) {
            return this.getCountryCode();
        } else {
            this.setCountryCode(value);
        }
    };

    getGender() {
        return this.getMetaValue(UserKeys.Gender);
    };

    setGender(gender) {
        return this.setMetaValue(UserKeys.Gender, gender);
    };

    gender(value) {
        if (Utils.unORNull(value)) {
            return this.getGender();
        } else {
            this.setGender(value);
        }
    };

    getProfileLink() {
        return this.getMetaValue(UserKeys.ProfileLink);
    };

    setProfileLink(profileLink) {
        return this.setMetaValue(UserKeys.ProfileLink, profileLink);
    };

    profileLink(value) {
        if (Utils.unORNull(value)) {
            return this.getProfileLink();
        } else {
            this.setProfileLink(value);
        }
    };

    getHomepageLink() {
        return this.getMetaValue(UserKeys.HomepageLink);
    };

    setHomepageLink(homepageLink) {
        return this.setMetaValue(UserKeys.HomepageLink, homepageLink);
    };

    homepageLink(value) {
        if (Utils.unORNull(value)) {
            return this.getHomepageLink();
        } else {
            this.setHomepageLink(value);
        }
    };

    getHomepageText() {
        return this.getMetaValue(UserKeys.HomepageText);
    };

    setHomepageText(homepageText) {
        return this.setMetaValue(UserKeys.HomepageText, homepageText);
    };

    homepageText(value) {
        if (Utils.unORNull(value)) {
            return this.getHomepageText();
        } else {
            this.setHomepageText(value);
        }
    };

    getProfileHTML() {
        return this.getMetaValue(UserKeys.ProfileHTML);
    };

    setProfileHTML(profileHTML): void {
        return this.setMetaValue(UserKeys.ProfileHTML, profileHTML);
    };

    profileHTML(value) {
        if (Utils.unORNull(value)) {
            return this.getProfileHTML();
        } else {
            this.setProfileHTML(value);
        }
    };

    getAllowInvites() {
        return this.getMetaValue(UserKeys.AllowInvites);
    };

    setAllowInvites(allowInvites) {
        return this.setMetaValue(UserKeys.AllowInvites, allowInvites);
    };

    allowInvites(value = null) {
        if (Utils.unORNull(value)) {
            return this.getAllowInvites();
        } else {
            this.setAllowInvites(value);
        }
    };

    getImageURL(): string {
        return this.getMetaValue(UserKeys.ImageURL);
    };

    setImageURL(imageURL): void {
        this.setMetaValue(UserKeys.ImageURL, imageURL);
    };

    getThumbnail() {
        return this.CloudImage.cloudImage(this.getImageURL(), 100, 100);
    }

    imageURL(value = null) {
        if (Utils.unORNull(value)) {
            return this.getImageURL();
        } else {
            this.setImageURL(value);
        }
    };

    on(): Promise<any> {

        if(this.pathIsOn[Keys.MetaKey]) {
            return;
        }

        const ref = this.Paths.userOnlineRef(this.uid());
        ref.on('value', (snapshot) => {
            if(!Utils.unORNull(snapshot.val())) {
                this.online = snapshot.val();
                if(this.online) {
                    this.$rootScope.$broadcast(N.OnlineUserAdded);
                }
                else {
                    this.$rootScope.$broadcast(N.OnlineUserRemoved);
                }
            }
        });

        return this.pathOn(Keys.MetaKey, (val)  => {
            if(val) {
                this.setMeta(val);

                // Update the user's thumbnail
                this.setImage(this.imageURL());

                // Here we want to update the
                // - Main box
                // - Every chat room that includes the user
                // - User settings popup
                this.$rootScope.$broadcast(N.UserValueChanged, this);
            }
        });
    };

    // Stop listening to the Firebase location
    off(): void {
        this.pathOff(Keys.MetaKey);
        this.Paths.userOnlineRef(this.uid()).off();
    };

    pushMeta(): Promise<any> {
        const ref = this.Paths.userMetaRef(this.uid());
        return ref.update(this.getMetaObject()).then(() => {
            return this.updateState(Keys.MetaKey);
        }).catch((e) => {
            console.log("PushMeta");
        });
    };

    canBeInvitedByUser(invitingUser: IUser): boolean {

        // This function should only ever be called on the root user
        if(!this.isMe()) {
            console.log("Can be invited should only be called on the root user");
            return false;
        }

        if(invitingUser.isMe()) {
            return true;
        }

        let allowInvites = this.allowInvites();
        return Utils.unORNull(allowInvites) || allowInvites == UserAllowInvites.Everyone;
    };

    allowInvitesFrom(type): boolean {
        return this.allowInvites() == type;
    };

    updateImageURL(imageURL): Promise<any> {
        // Compare to the old URL
        let imageChanged = imageURL != this.imageURL();
        if(imageChanged) {
            this.setMetaValue(UserKeys.ImageURL, imageURL);
            this.setImageURL(imageURL);
            this.setImage(imageURL, false);
            return this.pushMeta();
        }
    };

    setImage(image, isData = false): void {
        if(image === undefined) {
            // TODO: Improve this
            this.image = this.Environment.defaultProfilePictureURL();
        }
        else if(isData || image == this.Environment.defaultProfilePictureURL()) {
            this.image = image;
        }
        else {
            this.image = this.CloudImage.cloudImage(image, 100, 100);
        }
    };

    isMe(): boolean {
        return this.uid() === this.NetworkManager.auth.currentUserID();
    };

    getAvatar() {
        if(Utils.unORNull(this.image)) {
            return this.Environment.defaultProfilePictureURL();
        }
        return this.image;
    };

    hasImage(): boolean {
        return this.image && this.image != this.Environment.defaultProfilePictureURL;
    };

    addRoomUpdate(room: IRoom): {} {
        const update = {};
        const path = this.relativeFirebasePath(this.roomsRef().child(room.rid()).child(RoomKeys.InvitedBy));
        update[path] = this.NetworkManager.auth.currentUserID();
        return update;
    }

    removeRoomUpdate(room: IRoom): {} {
        const update = {};
        update[this.relativeFirebasePath(this.roomsRef().child(room.rid()))] = null;
        return update;
    }

    roomsRef(): firebase.database.Reference {
        return this.Paths.userRoomsRef(this.uid());
    }

    addFriend(friend) {
        if(friend && friend.meta && friend.uid()) {
            return this.addFriendWithUID(friend.uid());
        }
    };

    addFriendWithUID(uid) {
        let ref = this.Paths.userFriendsRef(this.uid());
        let data = {};
        data[uid] = {uid: uid};

        return ref.update(data, ).then(() => {
            return this.updateState(PathKeys.FriendsPath);
        });
    };

    uid() {
        return this._id;
    };

    setUID(uid) {
        return this.setMetaValue(userUID, uid);
    };

    removeFriend(friend) {
        // This method is added to the object when the friend is
        // added initially
        friend.removeFriend();
        friend.removeFriend = null;
        this.updateState(PathKeys.FriendsPath);
    };

    blockUserWithUID(uid) {
        const ref = this.Paths.userBlockedRef(this.uid());
        const data = {};
        data[uid] = {uid: uid};

        ref.update(data).then(() => {
            return this.updateState(PathKeys.BlockedPath);
        });
    };

    markRoomReadTime(rid) {
        const ref = this.Paths.userRoomsRef(this.uid()).child(rid);
        const data = {};
        data[Keys.ReadKey] = firebase.database.ServerValue.TIMESTAMP;
        return ref.update(data);
    };

    blockUser(block) {
        if(block && block.meta && block.uid()) {
            this.blockUserWithUID(block.uid());
        }
    };

    unblockUser(block): void {
        block.unblock();
        block.unblock = null;
        const _ = this.updateState(PathKeys.BlockedPath);
    };

    serialize(): {} {
        return super.serialize();
    };

    deserialize(su): void {
        if(su) {
            super.deserialize(su._super);
            this.setImage(su.meta[UserKeys.ImageURL]);
        }
    };
}

angular.module('myApp.services')
    .service('User', ['$rootScope', '$timeout', 'Paths', 'CloudImage', 'Environment', 'NetworkManager', function($rootScope, $timeout, Paths, CloudImage, Environment, NetworkManager) {
        // we can ask for more parameters if needed
        return function messageFactory(uid: string) { // return a factory instead of a new talker
            return new User($rootScope, $timeout, Paths, CloudImage, Environment, NetworkManager, uid);
        }}]);
