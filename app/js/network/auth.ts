import * as PathKeys from "../keys/path-keys";
import * as Dimensions from "../keys/dimensions";
import * as NotificationKeys from "../keys/notification-keys";
import * as RoomNameKeys from "../keys/room-name-keys";
import * as RoomKeys from "../keys/room-keys";
import * as RoomType from "../keys/room-type";
// import * as UserStatus from "../keys/user-status";
import * as Keys from "../keys/keys";
import * as MessageKeys from "../keys/message-keys";
import * as UserKeys from "../keys/user-keys";
import * as MessageType from "../keys/message-type";
import * as Defines from "../services/defines";
import * as LoginModeKeys from "../keys/login-mode-keys";

angular.module('myApp.services').factory('Auth', ['$rootScope','$q', '$http', '$timeout', 'Config', 'Paths', 'Credential', 'Environment', 'UserStore', 'Presence', 'StateManager', 'Time', 'Utils', 'AutoLogin', 'firebase', 'Facebook',
    function ($rootScope, $q, $http, $timeout, Config, Paths, Credential, Environment, UserStore, Presence, StateManager, Time, Utils, AutoLogin, firebase, Facebook) {
        let Auth = {

            mode: LoginModeKeys.LoginModeSimple,
            getToken: null,
            // authListener: null,
            authenticating: false,

            init: function () {


                return this;
            },

            // setAuthListener: function (listener) {
            //     this.authListener = listener;
            // },

            isAuthenticating: function () {
                return this.authenticating;
            },

            authenticate: function (credential) {

                let deferred = $q.defer();
                if (this.authenticating) {
                    deferred.reject("Already authenticating");
                    return deferred.promise;
                }
                this.authenticating = true;

                let promise = null;

                // Try to authenticate using auto login
                let autoLoginCredential = AutoLogin.getCredentials();
                if (!Utils.unORNull(autoLoginCredential)) {
                    credential = autoLoginCredential;
                    // this.logout();
                }

                if(this.isAuthenticated()) {
                    deferred.resolve({
                        user: firebase.auth().currentUser
                    });
                    promise = deferred.promise;
                }
                else if (Utils.unORNull(credential)) {
                    deferred.reject();
                    promise = deferred.promise;
                }
                else if(credential.getType() === credential.Email) {
                    promise = firebase.auth().signInWithEmailAndPassword(credential.getEmail(), credential.getPassword());
                }
                else if(credential.getType() === credential.Anonymous) {
                    promise = firebase.auth().signInAnonymously();
                }
                else if(credential.getType() === credential.CustomToken) {
                    promise = firebase.auth().signInWithCustomToken(credential.getToken());
                }
                else {

                    var scopes = null;
                    var provider = null;

                    if(credential.getType() === credential.Facebook) {
                        provider = new firebase.auth.FacebookAuthProvider();
                        scopes = "email,user_likes";
                    }
                    if(credential.getType() === credential.Github) {
                        provider = new firebase.auth.GithubAuthProvider();
                        scopes = "user,gist";
                    }
                    if(credential.getType() === credential.Google) {
                        provider = new firebase.auth.GoogleAuthProvider();
                        scopes = "email";
                    }
                    if(credential.getType() === credential.Twitter) {
                        provider = new firebase.auth.TwitterAuthProvider();
                    }

                    scopes = scopes.split(',');
                    for(let scope in scopes) {
                        if(scopes.hasOwnProperty(scope)) {
                            provider.addScope(scope);
                        }
                    }

                    promise = firebase.auth().signInWithPopup (provider);

                }

                this.authenticating = false;

                return promise.then((function (authData) {

                    Config.setConfig(Config.setByInclude, Environment.options());
                    return this.bindUser(authData.user);

                }).bind(this));
            },

            isAuthenticated: function () {
                return firebase.auth().currentUser != null;
            },

            signUp: function (email, password) {
                return firebase.auth().createUserWithEmailAndPassword(email, password);
            },

            resetPasswordByEmail: function (email) {
                return firebase.auth().sendPasswordResetEmail(email);
            },

            logout: function () {
                firebase.auth().signOut();
            },

            /**
             * Create a new AngularFire simple login object
             * this object will try to authenticate the user if
             * a session exists
             * @param authUser - the authentication user provided by Firebase
             */
            bindUser: function (authUser) {

                let deferred = $q.defer();

                // Set the user's ID
                Paths.userMetaRef(authUser.uid).update({uid: authUser.uid});

                this.bindUserWithUID(authUser.uid).then((function () {

                    let user = $rootScope.user;

                    let oldMeta = angular.copy(user.meta);

                    let setUserProperty = (function (property, value, force) {
                        if((!user.meta[property] || user.meta[property].length === 0 || force) && value && value.length > 0) {
                            user.meta[property] = value;
                            return true;
                        }
                        return false;
                    }).bind(this);

                    // Get the third party data
                    let userData = {
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
                    if(p === "facebook" || p === "twitter" || p === "google" || p === "github") {
                        if(authUser[p] && authUser[p].cachedUserProfile) {
                            userData = authUser[p].cachedUserProfile;
                        }
                    }
                    else if (p === "custom" && authUser.thirdPartyData) {
                        userData = authUser.thirdPartyData;
                    }

                    // Set the user's name
                    setUserProperty(UserKeys.UserName, userData.name);
                    setUserProperty(UserKeys.UserName, Defines.DefaultUserPrefix + Math.floor(Math.random() * 1000 + 1));

                    let imageURL = null;

                    /** SOCIAL INFORMATION **/
                    if(authUser.provider === "facebook") {

                        setUserProperty(UserKeys.UserGender, userData.gender === "male" ? "M": "F");

                        // Make an API request to Facebook to get an appropriately sized
                        // photo
                        if(!user.hasImage()) {
                            Facebook.api('http://graph.facebook.com/'+userData.id+'/picture?width=300', function(response) {
                                user.updateImageURL(response.data.url);
                            });
                        }
                    }
                    if(authUser.provider === "twitter") {

                        // We need to transform the twiter url to replace 'normal' with 'bigger'
                        // to get the 75px image instad of the 50px
                        if(userData.profile_image_url) {
                            imageURL = userData.profile_image_url.replace("normal", "bigger");
                        }

                        setUserProperty(UserKeys.UserStatus, userData.description);
                        setUserProperty(UserKeys.UserLocation, userData.location);

                    }
                    if(authUser.provider === "github") {
                        imageURL = userData.avatar_url;
                        setUserProperty(UserKeys.UserName, authUser.login);
                    }
                    if(authUser.provider === "google") {
                        imageURL = userData.picture;
                        setUserProperty(UserKeys.UserGender, userData.gender === "male" ? "M": "F");
                    }
                    if(authUser.provider === "anonymous") {

                    }
                    if(authUser.provider === "custom") {

                        setUserProperty(UserKeys.UserStatus, userData[UserKeys.UserStatus]);
                        setUserProperty(UserKeys.UserLocation, userData[UserKeys.UserLocation]);
                        setUserProperty(UserKeys.UserGender, userData[UserKeys.UserGender]);
                        setUserProperty(UserKeys.UserCountryCode, userData[UserKeys.UserCountryCode]);

                        // TODO: Deprecated
                        setUserProperty(UserKeys.UserHomepageLink, userData[UserKeys.UserHomepageLink], true);
                        setUserProperty(UserKeys.UserHomepageText, userData[UserKeys.UserHomepageText], true);

                        if(userData[UserKeys.UserProfileHTML] && userData[UserKeys.UserProfileHTML].length > 0) {
                            setUserProperty(UserKeys.UserProfileHTML, userData[UserKeys.UserProfileHTML], true);
                        }
                        else {
                            user.setProfileHTML("");
                        }

                        if(userData[UserKeys.UserImageURL]) {
                            imageURL = userData[UserKeys.UserImageURL];
                        }
                    }

                    if(!imageURL) {
                        imageURL = Defines.DefaultAvatarProvider + "/" + user.getName() + ".png";
                    }

                    // If they don't have a profile picture load it from the social network
                    if(setUserProperty(UserKeys.UserImageURL, imageURL)) {
                        user.setImageURL(imageURL);
                        user.setImage(imageURL);
                    }

                    /** LOCATION **/
                    // Get the user's city and country from their IP
                    if(!user.getCountryCode() || !user.getLocation()) {

                        $http.get('http://freegeoip.net/json/').then((function (r) {

                            var changed = false;

                            // The first time the user logs on
                            // try to guess which city and country they're from
                            changed = setUserProperty(UserKeys.UserLocation, r.data.city);
                            changed = changed || setUserProperty(UserKeys.UserCountryCode, r.data.country_code);

                            if(changed) {
                                user.pushMeta();

                                // Digest to update the interface
                                // TODO: Don't do a root digest
                                $timeout(function() {
                                    $rootScope.$digest();
                                });
                            }

                        }).bind(this), function (error) {

                        });

                    }

                    if(!angular.equals(user.meta, oldMeta)) {
                        user.pushMeta();
                    }

                    /** GRAVATAR **/

                    /** Tidy up existing rooms **/

                    // Start listening to online user list and public rooms list
                    StateManager.on();

                    // Start listening to user
                    StateManager.userOn(authUser.uid);

                    // If the user has specified a room id in the URL via a get parameter
                    // then try to join that room
                    AutoLogin.tryToJoinRoom();

                    deferred.resolve(authUser);

                }).bind(this), function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },

            bindUserWithUID: function (uid) {

                let deferred = $q.defer();

                // Create the user
                // TODO: if we do this we'll also be listening for meta updates...
                $rootScope.user = UserStore.getOrCreateUserWithID(uid, true);
                let userPromise = $rootScope.user.on();
                let timePromise = Time.start(uid);

                $q.all([userPromise, timePromise]).then(function () {
                    if (!$rootScope.user.getName()) {
                        $rootScope.user.setName("");
                    }

                    Presence.start($rootScope.user);

                    deferred.resolve();
                });

                return deferred.promise;
            }

        };

        return Auth.init();
    }
]);