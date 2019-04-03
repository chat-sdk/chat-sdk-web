angular.module('myApp.controllers').controller('LoginController', ['$rootScope', '$scope', '$timeout', 'FriendsConnector', 'Cache', 'Presence', 'SingleSignOn','OnlineConnector', 'Utils', 'Paths', 'LocalStorage', 'StateManager', 'RoomPositionManager', 'Config', 'Auth', 'Credential', 'AutoLogin',
    function($rootScope, $scope, $timeout, FriendsConnector, Cache, Presence, SingleSignOn, OnlineConnector, Utils, Paths, LocalStorage, StateManager, RoomPositionManager, Config, Auth, Credential, AutoLogin) {

        /**
         * Initialize the login controller
         * Add listeners to AngularFire login, logout and error broadcasts
         * Setup the auth variable and try to authenticate
         */
        $scope.init = function () {

            $scope.rememberMe = true;

            $scope.showLoginBox(LoginModeAuthenticating);

            firebase.auth().onAuthStateChanged(function() {
                $scope.authenticate(null);
            });

        };

        $scope.startChatting = function() {
            LocalStorage.setLastVisited();
            $scope.authenticate(null);
        };

        $scope.authenticate = function (credential) {
            $scope.showLoginBox(LoginModeAuthenticating);

            let loginMode = LoginModeSimple;
            let lastVisited = LocalStorage.getLastVisited();

            // We don't want to load the messenger straightaway to save bandwidth.
            // This will check when they last accessed the chat. If it was less than the timeout time ago,
            // then the click to chat box will be displayed. Clicking that will reset the timer
            if(Utils.unORNull(lastVisited) || (new Date().getTime() - lastVisited)/1000 > Config.clickToChatTimeout && Config.clickToChatTimeout > 0) {
                loginMode = LoginModeClickToChat;
            }

            Auth.authenticate(credential).then((function (authUser) {
                $scope.handleAuthData(authUser);
            }).bind(this)).catch((function (error) {
                if (!Utils.unORNull(error)) {
                    $scope.handleLoginError(error);
                } else {
                    $scope.showLoginBox(loginMode);
                }
            }).bind(this));
        };

        $scope.handleAuthData = function (authData) {
            $rootScope.loginMode = Auth.mode;

            console.log(authData);

            $rootScope.auth = authData;
            if(authData) {
                $scope.handleLoginComplete(authData, false);
            }
            else {
                $scope.showLoginBox();
            }
        };

        $scope.setError = function (message) {
            $scope.showError = !Utils.unORNull(message);
            $scope.errorMessage = message;
        };

        $scope.loginWithPassword = function () {
            $scope.login(new Credential().emailAndPassword($scope.email, $scope.password));
        };

        $scope.loginWithFacebook = function () {
            $scope.login(new Credential().facebook());
        };

        $scope.loginWithTwitter = function () {
            $scope.login(new Credential().twitter());
        };

        $scope.loginWithGoogle = function () {
            $scope.login(new Credential().google());
        };

        $scope.loginWithGithub = function () {
            $scope.login(new Credential().github());
        };

        $scope.loginWithAnonymous = function () {
            $scope.login(new Credential().anonymous());
        };

        /**
         * Log the user in using the appropriate login method
         * @param method - the login method: facebook, twitter etc...
         * @param options - hash of options: remember me etc...
         */
        $scope.login = function (credential) {

            // TODO: Move this to a service!
            // Re-establish a connection with Firebase
            Presence.goOnline();

            // Reset any error messages
            $scope.showError = false;

            // Hide the overlay
            $scope.showNotification(NotificationTypeWaiting, "Logging in", "For social login make sure to enable popups!");

            Auth.authenticate(credential).then(function (authData) {
                $scope.handleAuthData(authData);
            }).catch(function (error) {
                $scope.hideNotification();
                $scope.handleLoginError(error);

                $timeout(function(){
                    $scope.$digest();
                });
            });
        };

        $scope.forgotPassword  = function (email) {

            Auth.resetPasswordByEmail(email).then(function () {
                $scope.showNotification(NotificationTypeAlert, "Email sent",
                    "Instructions have been sent. Please check your Junk folder!", "ok");
                $scope.setError(null);
            }).catch(function (error) {
                $scope.handleLoginError(error);
            });
        };

        /**
         * Create a new account
         * @param email - user's email
         * @param password - user's password
         */
        $scope.signUp = function (email, password) {

            // Re-establish connection with Firebase
            Presence.goOnline();

            $scope.showError = false;

            $scope.showNotification(NotificationTypeWaiting, "Registering...");

            // First create the super

            Auth.signUp(email, password).then((function () {
                $scope.email = email;
                $scope.password = password;
                $scope.loginWithPassword();
            }).bind(this)).catch((function (error) {
                $scope.handleLoginError(error);
            }).bind(this));

        };

        /**
         * Bind the user to Firebase
         * Using the user's authentcation information create
         * a three way binding to the user property
         * @param userData - User object from Firebase authentication
         * @param firstLogin - Has the user just signed up?
         */

        $scope.handleLoginComplete = function (userData, firstLogin) {

            // Write a record to the firebase to record this API key
            $scope.showNotification(NotificationTypeWaiting, "Opening Chat...");

            // Load friends from config
            if(Config.friends) {
                FriendsConnector.addFriendsFromConfig(Config.friends);
            }

            // This allows us to clear the cache remotely
            LocalStorage.clearCacheWithTimestamp(Config.clearCacheTimestamp);

            // We have the user's ID so we can get the user's object
            if(firstLogin) {
                $scope.showProfileSettingsBox();
            }
            else {
                $scope.showMainBox();
            }

            $rootScope.$broadcast(LoginCompleteNotification);
            $scope.hideNotification();

        };

        /**
         * Handle a login error
         * Show a red warning box in the UI with the
         * error message
         * @param error - error returned from Firebase
         */
        $scope.handleLoginError = function (error) {

            // The login failed - display a message to the user
            $scope.hideNotification();

            var message = "An unknown error occurred";

            if (error.code == 'AUTHENTICATION_DISABLED') {
                message = "This authentication method is currently disabled.";
            }
            if (error.code == 'EMAIL_TAKEN') {
                message = "Email address unavailable.";
            }
            if (error.code == 'INVALID_EMAIL') {
                message = "Please enter a valid email.";
            }
            if (error.code == 'INVALID_ORIGIN') {
                message = "Login is not available from this domain.";
            }
            if (error.code == 'INVALID_PASSWORD') {
                message = "Please enter a valid password.";
            }
            if (error.code == 'INVALID_USER') {
                message = "Invalid email or password.";
            }
            if (error.code == 'INVALID_USER') {
                message = "Invalid email or password.";
            }

            $scope.setError(message);

        };

        $scope.init();

    }]);
