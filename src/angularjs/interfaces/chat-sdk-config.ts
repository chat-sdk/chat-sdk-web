import { IFirebaseConfig } from './firebase-config';

export interface IChatSDKConfig {

    firebaseConfig: IFirebaseConfig;

    rootPath: string;

    facebookAppID: string;

    cloudImageToken: string;

    /**
     * This defaults to 5 minutes min 2 minutes, max 15 minutes
     */
    inactivityTimeout: number,

    /**
     * 1) 24hour - show time in 24 hour format
     */
    clockType: string;

    /**
     * Users can create public chat rooms?
     * If this is true users will be able to setup new
     * public rooms
     */
    usersCanCreatePublicRooms: boolean,

    /**
     * Allow anonymous login?
     */
    anonymousLoginEnabled: boolean,

    /**
     * Enable social login - please email us to get your domain whitelisted
     */
    socialLoginEnabled: boolean,

    /**
     * The URL to contact for single sign on
     */
    singleSignOnURL: string;

    environment: string;

    imageMessagesEnabled: boolean,

    fileMessagesEnabled: boolean,

    hideMainBox: boolean,

    /**
     * Comma separated list of paths. If set, chat will
     * only display on these paths
     */
    showOnPaths: string[],

    /**
     * If set, partials will be loaded from this URL. Otherwise
     * they will be loaded from the current url in test mode or
     * the Firebase hosting URL if live
     */
    resourceRootURL: string,

}
