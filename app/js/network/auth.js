angular.module('myApp.services').factory('Auth', ['$rootScope','$q', '$http', '$timeout', 'Config', 'Paths', 'Credential', 'Environment', 'UserStore', 'Presence', 'StateManager', 'Time',
    function ($rootScope, $q, $http, $timeout, Config, Paths, Credential, Environment, UserStore, Presence, StateManager, Time) {
        let Auth = {

            mode: LoginModeSimple,
            getToken: null,
            authListener: null,

            init: function () {


                return this;
            },

            // setAuthListener: function (callback) {
            //     this.authListener = callback;
            // },
            //
            // modeIs: function (mode) {
            //     return this.mode == mode;
            // },


            authenticate: function (credential) {
                let deferred = $q.defer();

                let handleSuccess = function (authData) {
                    Config.setConfig(Config.setByInclude, Environment.options());
                    deferred.resolve(authData);
                };

                let handleError = function (error) {
                    deferred.reject(error);
                };

                if(this.isAuthenticated()) {
                    handleSuccess(firebase.auth().currentUser);
                    return deferred.promise;
                }

                if(credential.getType() == credential.Email) {
                    firebase.auth().signInWithEmailAndPassword(credential.getEmail(), credential.getPassword()).then(handleSuccess).catch(handleError);
                }
                else if(credential.getType() == credential.Anonymous) {
                    firebase.auth().signInAnonymously().then(handleSuccess).catch(handleError);
                }
                else if(credential.getType() == credential.CustomToken) {
                    firebase.auth().signInWithCustomToken(credential.getToken()).then(handleSuccess).catch(handleError);
                }
                else {

                    var scopes = null;
                    var provider = null;

                    if(credential.getType() == credential.Facebook) {
                        provider = new firebase.auth.FacebookAuthProvider();
                        scopes = "email,user_likes";
                    }
                    if(credential.getType() == credential.Github) {
                        provider = new firebase.auth.GithubAuthProvider();
                        scopes = "user,gist";
                    }
                    if(credential.getType() == credential.Google) {
                        provider = new firebase.auth.GoogleAuthProvider();
                        scopes = "email";
                    }
                    if(credential.getType() == credential.Twitter) {
                        provider = new firebase.auth.TwitterAuthProvider();
                    }

                    scopes = scopes.split(',');
                    for(var scope in scopes) {
                        if(scopes.hasOwnProperty(scope)) {
                            provider.addScope(scope);
                        }
                    }

                    firebase.auth().signInWithPopup (provider).then(handleSuccess).catch(handleError);


                    // Used to log in using a remote partial i.e. if you wanted to log in using one social account
                    // across multiple domains

                    //$rootScope.$broadcast(StartSocialLoginNotification, {
                    //    action: credential.getType(),
                    //    config: bFirebaseConfig,
                    //    scope: scope,
                    //    remember: "sessionOnly"
                    //}, function (data) {
                    //    if(data.authData) {
                    //        firebase.auth().signInWithCustomToken(data.authData.token).then(handleSuccess).catch(handleError);
                    //    }
                    //    else {
                    //        deferred.reject("Social login failed");
                    //    }
                    //});
                }

                return deferred.promise;
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

                var deferred = $q.defer();

                // Set the user's ID
                Paths.userMetaRef(authUser.uid).update({uid: authUser.uid});

                this.bindUserWithUID(authUser.uid).then((function () {

                    var user = $rootScope.user;

                    var oldMeta = angular.copy(user.meta);

                    var setUserProperty = (function (property, value, force) {
                        if((!user.meta[property] || user.meta[property].length == 0 || force) && value && value.length > 0) {
                            user.meta[property] = value;
                            return true;
                        }
                        return false;
                    }).bind(this);

                    // Get the third party data
                    var userData = {name: null};

                    var p = authUser.provider;
                    if(p == "facebook" || p == "twitter" || p == "google" || p == "github") {
                        if(authUser[p] && authUser[p].cachedUserProfile) {
                            userData = authUser[p].cachedUserProfile;
                        }
                    }
                    else if (p == "custom" && authUser.thirdPartyData) {
                        userData = authUser.thirdPartyData;
                    }
//                else {
//                    userData = {name: null}
//                }

                    // Set the user's name
                    setUserProperty(UserName, userData.name);
                    setUserProperty(UserName, DefaultUserPrefix + Math.floor(Math.random() * 1000 + 1));

                    var imageURL = null;

                    /** SOCIAL INFORMATION **/
                    if(authUser.provider === "facebook") {

                        setUserProperty(UserGender, userData.gender === "male" ? "M": "F");

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

                        setUserProperty(UserStatus, userData.description);
                        setUserProperty(UserLocation, userData.location);

                    }
                    if(authUser.provider === "github") {
                        imageURL = userData.avatar_url;
                        setUserProperty(UserName, authUser.login);
                    }
                    if(authUser.provider === "google") {
                        imageURL = userData.picture;
                        setUserProperty(UserGender, userData.gender === "male" ? "M": "F");
                    }
                    if(authUser.provider === "anonymous") {

                    }
                    if(authUser.provider === "custom") {

                        setUserProperty(UserStatus, userData[UserStatus]);
                        setUserProperty(UserLocation, userData[UserLocation]);
                        setUserProperty(UserGender, userData[UserGender]);
                        setUserProperty(UserCountryCode, userData[UserCountryCode]);
                        // TODO: Depricated
                        setUserProperty(UserHomepageLink, userData[UserHomepageLink], true);
                        setUserProperty(UserHomepageText, userData[UserHomepageText], true);

                        if(userData[UserProfileHTML] && userData[UserProfileHTML].length > 0) {
                            setUserProperty(UserProfileHTML, userData[UserProfileHTML], true);
                        }
                        else {
                            user.setProfileHTML("");
                        }

                        if(userData[UserImageURL]) {
                            imageURL = userData[UserImageURL];
                        }
                    }

                    if(!imageURL) {
                        imageURL = DefaultAvatarProvider + "/" + user.getName() + ".png";
                    }

                    // If they don't have a profile picture load it from the social network
                    if(setUserProperty(UserImageURL, imageURL)) {
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
                            changed = setUserProperty(UserLocation, r.data.city);
                            changed = changed || setUserProperty(UserCountryCode, r.data.country_code);

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

                    /** Create static rooms **/
                    //this.addStaticRooms();

                    // Start listening to online user list and public rooms list
                    StateManager.on();

                    // Start listening to user
                    StateManager.userOn(authUser.uid);

                    deferred.resolve();

                }).bind(this), function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },

            bindUserWithUID: function (uid) {

                var deferred = $q.defer();

                // Create the user
                // TODO: if we do this we'll also be listening for meta updates...
                $rootScope.user = UserStore.getOrCreateUserWithID(uid, true);
                var userPromise = $rootScope.user.on();
                var timePromise = Time.start(uid);

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