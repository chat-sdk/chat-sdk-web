import * as angular from 'angular';
import * as Defines from '../keys/defines'
import { N } from '../keys/notification-keys';
import { IPaths } from '../network/paths';
import { Utils } from './utils';
import { IEnvironment } from './environment';
import { IRootScope } from '../interfaces/root-scope';

export interface IConfig {
    clockType: string;
    defaultUserName: string;
    headerColor: string;
    publicRoomsEnabled: boolean;
    onlineUsersEnabled: boolean;
    friendsEnabled: boolean;
    maxHistoricMessages: number;
    inactivityTimeout: number;
    setConfig(setBy: SetBy, config: Map<string, any>): void;
}

export enum SetBy {
    Default = 0,
    ControlPanel = 10,
    Include = 20,
    SingleSignOn = 30,
    Admin = 40,
}

class Config implements IConfig {

    static $inject = ['$rootScope', '$timeout', 'Paths'];

    singleSignOnURL = null;
    singleSignOnURLSet = SetBy.Default;

    loginURL = null;
    loginURLSet = SetBy.Default;

    registerURL = null;
    registerURLSet = SetBy.Default;

    // How many historic messages to set by default
    maxHistoricMessages = 50;
    maxHistoricMessagesSet = SetBy.Default;

    // Stop the user from changing their name
    disableUserNameChange = false;
    disableUserNameChangeSet = SetBy.Default;

    // Stop the profile box from being displayed
    disableProfileBox = false;
    disableProfileBoxSet = SetBy.Default;

    // Clock type:
    // - 12hour
    // - 24hour
    clockType = '12hour';
    clockTypeSet = SetBy.Default;

    // Are users allowed to create their own public rooms
    usersCanCreatePublicRooms = false;
    usersCanCreatePublicRoomsSet = SetBy.Default;

    // The primary domain is used when the chat is needed
    // across multiple subdomains
    primaryDomain = '';
    primaryDomainSet = SetBy.Default;

    // Allow anonymous login?
    anonymousLoginEnabled = false;
    anonymousLoginEnabledSet = SetBy.Default;

    // Can the user log in using social logins
    socialLoginEnabled = true;
    socialLoginEnabledSet = SetBy.Default;

    // Header and tab color
    headerColor = '#0d82b3';
    headerColorSet = SetBy.Default;

    // After how long should the user be marked as offline
    inactivityTimeout = 5;
    inactivityTimeoutSet = SetBy.Default;

    // The Single sign on API to use
    singleSignOnAPILevel = 1;
    singleSignOnAPILevelSet = SetBy.Default;

    singleSignOn = true;
    singleSignOnSet = SetBy.Admin;

    onlineUsersEnabled = true;
    onlineUsersEnabledSet = SetBy.Default;

    publicRoomsEnabled = true;
    publicRoomsEnabledSet = SetBy.Default;

    friendsEnabled = true;
    friendsEnabledSet = SetBy.Default;

    friends = [];
    friendsSet = SetBy.Default;

    fileMessagesEnabled = false;
    fileMessagesEnabledSet = SetBy.Default;

    imageMessagesEnabled = false;
    imageMessagesEnabledSet = SetBy.Default;

    marginRight = 0;
    marginRightSet = SetBy.Default;

    clearCacheTimestamp = null;
    clearCacheTimestampSet = SetBy.Default;

    disableUserInfoPopup = false;
    disableUserInfoPopupSet = SetBy.Default;

    clickToChatTimeout = Defines.LastVisitedTimeout;
    clickToChatTimeoutSet = SetBy.Default;

    userProfileLinkEnabled = false;
    userProfileLinkEnabledSet = SetBy.Default;

    defaultUserName = 'ChatSDK';
    defaultUserNameSet = SetBy.Default;

    constructor(
        private $rootScope: IRootScope,
        private $timeout: ng.ITimeoutService,
        private Paths: IPaths,
    ) { }

    // We update the config using the data provided
    // but we only update variables where the priority
    // of this setBy entity is higher than the previous
    // one
    setConfig(setBy: SetBy, config: Map<string, any>) {

        this.setValue('inactivityTimeout', config, setBy);
        this.inactivityTimeout = Math.max(this.inactivityTimeout, 2);
        this.inactivityTimeout = Math.min(this.inactivityTimeout, 15);

        this.setValue('maxHistoricMessages', config, setBy);
        this.setValue('disableUserNameChange', config, setBy);
        this.setValue('disableProfileBox', config, setBy);
        this.setValue('clockType', config, setBy);
        this.setValue('usersCanCreatePublicRooms', config, setBy);
        this.setValue('primaryDomain', config, setBy);
        this.setValue('anonymousLoginEnabled', config, setBy);

        this.setValue('socialLoginEnabled', config, setBy);
        this.setValue('headerColor', config, setBy);
        this.setValue('singleSignOnAPILevel', config, setBy);
        this.setValue('apiLevel', config, setBy);
        this.setValue('singleSignOn', config, setBy);
        this.setValue('singleSignOnURL', config, setBy);
        this.setValue('registerURL', config, setBy);
        this.setValue('loginURL', config, setBy);

        this.setValue('onlineUsersEnabled', config, setBy);
        this.setValue('publicRoomsEnabled', config, setBy);
        this.setValue('friendsEnabled', config, setBy);
        this.setValue('clearCacheTimestamp', config, setBy);
        this.setValue('fileMessagesEnabled', config, setBy);
        this.setValue('imageMessagesEnabled', config, setBy);
        this.setValue('marginRight', config, setBy);

        this.setValue('friends', config, setBy);

        this.setValue('clickToChatTimeout', config, setBy);
        this.setValue('userProfileLinkEnabled', config, setBy);
        this.setValue('defaultUserName', config, setBy);

        this.$rootScope.config = this;

        this.$rootScope.$broadcast(N.ConfigUpdated);

        this.$timeout(() => {
            this.$rootScope.$digest()
        });

    }

    setValue(name: string, data: any, setBy: SetBy) {
        if (data && !Utils.unORNull(data[name]) && this[name+'Set'] <= setBy) {
            this[name] = data[name];
            this[name+'Set'] = setBy;
        }
    }

    startConfigListener(): Promise<any> {
        return new Promise((resolve, reject) => {
            const ref = this.Paths.configRef();
            ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
                this.setConfig(SetBy.ControlPanel, snapshot.val());
                resolve();
            });
        });
    }

}

angular.module('myApp.services').service('Config', Config)
    // Check this
    .run(['Config', 'Environment', (Config: IConfig, Environment: IEnvironment) => {
    Config.setConfig(SetBy.Include, Environment.config());
}]);
