import * as firebase from 'firebase';
import * as angular from 'angular';

import * as Defines from '../keys/defines';
import * as LoginModeKeys from '../keys/login-mode-keys';
import { UserKeys } from '../keys/user-keys';
import { Utils } from '../services/utils';
import { IPresence } from './presence';
import { IUserStore } from '../persistence/user-store';
import { IEnvironment } from '../services/environment';
import { IStateManager } from '../services/state-manager';
import { IConfig, SetBy } from '../services/config';
import { IPaths } from './paths';
import { ITime } from '../services/time';
import { IAutoLogin } from './auto-login';
import { INetworkManager } from './network-manager';
import { IRootScope } from '../interfaces/root-scope';
import { ICredential } from './credential';
import { IAuthUser, IAuthUserData } from '../interfaces/auth-user';

export interface IAuth {
    logout(): Promise<void>
}

class Auth implements IAuth {

    static $inject = ['$rootScope', 'Config', 'Paths', 'Environment', 'UserStore', 'Presence', 'StateManager', 'Time', 'AutoLogin', 'NetworkManager'];

    constructor(
        private $rootScope: IRootScope,
        private Config: IConfig,
        private Paths: IPaths,
        private Environment: IEnvironment,
        private UserStore: IUserStore,
        private Presence: IPresence,
        private StateManager: IStateManager,
        private Time: ITime,
        private AutoLogin: IAutoLogin,
        private NetworkManager: INetworkManager,
    ) { }

    mode = LoginModeKeys.LoginMode.Simple;
    getToken = null;
    authenticating = false;

    isAuthenticating(): boolean {
        return this.authenticating;
    }

    authenticate(credential: ICredential): Promise<any> {

        return new Promise((resolve, reject) => {
            if (this.authenticating) {
                reject({code: 'ALREADY_AUTHENTICATING'});
                return;
            }

            // Try to authenticate using auto login
            let autoLoginCredential = this.AutoLogin.getCredentials();
            if (!Utils.unORNull(autoLoginCredential)) {
                credential = autoLoginCredential;
                // this.logout();
            }

            if (this.isAuthenticated()) {
                resolve({
                    user: firebase.auth().currentUser
                });
                return;
            }
            if (Utils.unORNull(credential)) {
                reject();
                return;
            }

            this.authenticating = true;

            if (credential.getType() === credential.Email) {
                resolve(firebase.auth().signInWithEmailAndPassword(credential.getEmail(), credential.getPassword()));
            }
            else if (credential.getType() === credential.Anonymous) {
                resolve(firebase.auth().signInAnonymously());
            }
            else if (credential.getType() === credential.CustomToken) {
                resolve(firebase.auth().signInWithCustomToken(credential.getToken()));
            }
            else {

                let scopes = null;
                let provider = null;

                if (credential.getType() === credential.Facebook) {
                    provider = new firebase.auth.FacebookAuthProvider();
                    scopes = 'email,user_likes';
                }
                if (credential.getType() === credential.Github) {
                    provider = new firebase.auth.GithubAuthProvider();
                    scopes = 'user,gist';
                }
                if (credential.getType() === credential.Google) {
                    provider = new firebase.auth.GoogleAuthProvider();
                    scopes = 'email';
                }
                if (credential.getType() === credential.Twitter) {
                    provider = new firebase.auth.TwitterAuthProvider();
                }

                scopes = scopes.split(',');
                for (let scope in scopes) {
                    if (scopes.hasOwnProperty(scope)) {
                        provider.addScope(scope);
                    }
                }

                resolve(firebase.auth().signInWithPopup(provider));
            }
        }).then((authData: firebase.auth.UserCredential) => {
            this.authenticating = false;
            this.Config.setConfig(SetBy.Include, this.Environment.config());
            return this.bindUser(authData.user);
        }).catch((error) => {
            this.authenticating = false;
        });
    }

    isAuthenticated(): boolean {
        return firebase.auth().currentUser != null;
    }

    signUp(email: string, password: string): Promise<firebase.auth.UserCredential> {
        return firebase.auth().createUserWithEmailAndPassword(email, password);
    }

    resetPasswordByEmail(email: string): Promise<void> {
        return firebase.auth().sendPasswordResetEmail(email);
    }

    logout(): Promise<void> {
        return firebase.auth().signOut();
    }

    /**
     * Create a new AngularFire simple login object
     * this object will try to authenticate the user if
     * a session exists
     * @param authUser - the authentication user provided by Firebase
     */
    async bindUser(authUser: IAuthUser) {
        await this.bindUserWithUID(authUser.uid);
        let user = this.UserStore.currentUser();
        let oldMeta = angular.copy(user.meta);
        let setUserProperty = (property_1, value, force?) => {
            if ((!user.meta[property_1] || user.meta[property_1].length === 0 || force) && value && value.length > 0) {
                user.meta[property_1] = value;
                return true;
            }
            return false;
        };
        // Get the third party data
        let userData: IAuthUserData = {
            id: null,
            name: null,
            gender: null,
            profile_image_url: null,
            description: null,
            location: null,
            avatar_url: null,
            picture: null
        };
        let p = authUser.provider;
        if (p === 'facebook' || p === 'twitter' || p === 'google' || p === 'github') {
            if (authUser[p] && authUser[p].cachedUserProfile) {
                userData = authUser[p].cachedUserProfile;
            }
        }
        else if (p === 'custom' && authUser.thirdPartyData) {
            userData = authUser.thirdPartyData;
        }
        // Set the user's name
        setUserProperty(UserKeys.Name, userData.name);
        setUserProperty(UserKeys.Name, Defines.DefaultUserPrefix + Math.floor(Math.random() * 1000 + 1));
        let imageURL = null;
        /** SOCIAL INFORMATION **/
        if (authUser.provider === 'facebook') {
            setUserProperty(UserKeys.Gender, userData.gender === 'male' ? 'M' : 'F');
            // Make an API request to Facebook to get an appropriately sized
            // photo
            if (!user.hasImage()) {
                const _ = user.updateImageURL('http://graph.facebook.com/' + userData.id + '/picture?width=300');
            }
        }
        if (authUser.provider === 'twitter') {
            // We need to transform the twiter url to replace 'normal' with 'bigger'
            // to get the 75px image instad of the 50px
            if (userData.profile_image_url) {
                imageURL = userData.profile_image_url.replace('normal', 'bigger');
            }
            setUserProperty(UserKeys.Status, userData.description);
            setUserProperty(UserKeys.Location, userData.location);
        }
        if (authUser.provider === 'github') {
            imageURL = userData.avatar_url;
            setUserProperty(UserKeys.Name, authUser.login);
        }
        if (authUser.provider === 'google') {
            imageURL = userData.picture;
            setUserProperty(UserKeys.Gender, userData.gender === 'male' ? 'M' : 'F');
        }
        if (authUser.provider === 'anonymous') {
        }
        if (authUser.provider === 'custom') {
            setUserProperty(UserKeys.Status, userData[UserKeys.Status]);
            setUserProperty(UserKeys.Location, userData[UserKeys.Location]);
            setUserProperty(UserKeys.Gender, userData[UserKeys.Gender]);
            setUserProperty(UserKeys.CountryCode, userData[UserKeys.CountryCode]);
            // TODO: Deprecated
            setUserProperty(UserKeys.HomepageLink, userData[UserKeys.HomepageLink], true);
            setUserProperty(UserKeys.HomepageText, userData[UserKeys.HomepageText], true);
            if (userData[UserKeys.ProfileHTML] && userData[UserKeys.ProfileHTML].length > 0) {
                setUserProperty(UserKeys.ProfileHTML, userData[UserKeys.ProfileHTML], true);
            }
            else {
                user.setProfileHTML('');
            }
            if (userData[UserKeys.ImageURL]) {
                imageURL = userData[UserKeys.ImageURL];
            }
        }
        if (!user.getName() || user.getName().length == 0) {
            user.setName(this.Config.defaultUserName + Math.floor(Math.random() * 1000));
        }
        if (!imageURL) {
            imageURL = Defines.DefaultAvatarProvider + '/' + user.getName() + '.png';
        }
        // If they don't have a profile picture load it from the social network
        if (setUserProperty(UserKeys.ImageURL, imageURL)) {
            user.setImageURL(imageURL);
            user.setImage(imageURL);
        }
        let promise = Promise.resolve();
        if (!angular.equals(user.meta, oldMeta)) {
            promise = user.pushMeta();
        }
        promise.then(() => {
            this.Presence.start(this.UserStore.currentUser());
        }).catch((e) => {
            console.log(e.message);
        });
        // Start listening to online user list and public rooms list
        this.StateManager.on();
        // Start listening to user
        try {
            this.StateManager.userOn(authUser.uid);
        }
        catch (e_1) {
            console.log(e_1.message);
        }
        // If the user has specified a room id in the URL via a get parameter
        // then try to join that room
        this.AutoLogin.tryToJoinRoom();
        return authUser;
    }

    async bindUserWithUID(uid: string): Promise<any> {
        // Create the user
        // TODO: if we do this we'll also be listening for meta updates...
        this.NetworkManager.auth.setCurrentUserID(uid);
        this.$rootScope.user = this.UserStore.currentUser();

        let userPromise = this.UserStore.currentUser().on();
        let timePromise = this.Time.start(uid);

        try {
            return Promise.all([
                userPromise,
                timePromise
            ]);
        }
        catch (e) {
            console.error(e.message);
        }
    }

}

angular.module('myApp.services').service('Auth', Auth);
