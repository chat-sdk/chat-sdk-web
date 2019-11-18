import * as angular from 'angular';
import * as firebase from 'firebase';

import { N } from '../keys/notification-keys';
import { Utils } from '../services/utils';
import { LoginMode } from '../keys/login-mode-keys';
import { NotificationType } from '../keys/notification-type';
import { IRootScope } from '../interfaces/root-scope';
import { IFriendsConnector } from '../connectors/friend-connector';
import { ICache } from '../persistence/cache';
import { IPresence } from '../network/presence';
import { ISingleSignOn } from '../network/single-sign-on';
import { IOnlineConnector } from '../connectors/online-connector';
import { IPaths } from '../network/paths';
import { ILocalStorage } from '../persistence/local-storage';
import { IStateManager } from '../services/state-manager';
import { IRoomPositionManager } from '../services/room-position-manager';
import { IConfig } from '../services/config';
import { IAuth } from '../network/auth';
import { ICredential } from '../network/credential';
import { IAutoLogin } from '../network/auto-login';

export interface ILoginScope extends ng.IScope {
  email: string;
  errorMessage: string;
  password: string;
  rememberMe: boolean;
  showError: boolean;
  authenticate(credential: ICredential): void;
  forgotPassword(email: string): void;
  getLoginMode(): LoginMode;
  handleAuthData(authData): void;
  handleLoginComplete(userData, firstLogin: boolean): void;
  handleLoginError(error: any): void;
  hideNotification(): void;
  login(credential: ICredential): void;
  loginWithAnonymous(): void;
  loginWithFacebook(): void;
  loginWithGithub(): void;
  loginWithGoogle(): void;
  loginWithPassword(): void;
  loginWithTwitter(): void;
  setError(message: string): void;
  showLoginBox(mode?: string): void;
  showMainBox(): void;
  showNotification(type: NotificationType, title: string, message?: string, button?: string): void;
  showProfileSettingsBox(): void;
  signUp(email: string, password: string): void;
  startChatting(): void;
}

export interface ILoginController {

}

class LoginController implements LoginController {

  static $inject = ['$rootScope', '$scope', '$timeout', 'FriendsConnector', 'Cache', 'Presence', 'SingleSignOn', 'OnlineConnector', 'Paths', 'LocalStorage', 'StateManager', 'RoomPositionManager', 'Config', 'Auth', 'Credential', 'AutoLogin'];

  /**
   * Initialize the login controller
   * Add listeners to AngularFire login, logout and error broadcasts
   * Setup the auth variable and try to authenticate
   */
  constructor(
    private $rootScope: IRootScope,
    private $scope: ILoginScope,
    private $timeout: ng.ITimeoutService,
    private FriendsConnector: IFriendsConnector,
    private Cache: ICache,
    private Presence: IPresence,
    private SingleSignOn: ISingleSignOn,
    private OnlineConnector: IOnlineConnector,
    private Paths: IPaths,
    private LocalStorage: ILocalStorage,
    private StateManager: IStateManager,
    private RoomPositionManager: IRoomPositionManager,
    private Config: IConfig,
    private Auth: IAuth,
    private Credential: ICredential,
    private AutoLogin: IAutoLogin,
  ) {
    // $scope properties
    $scope.rememberMe = true;

    // $scope methods
    $scope.authenticate = this.authenticate.bind(this);
    $scope.forgotPassword = this.forgotPassword.bind(this);
    $scope.getLoginMode = this.getLoginMode.bind(this);
    $scope.handleAuthData = this.handleAuthData.bind(this);
    $scope.handleLoginComplete = this.handleLoginComplete.bind(this);
    $scope.handleLoginError = this.handleLoginError.bind(this);
    $scope.login = this.login.bind(this);
    $scope.loginWithAnonymous = this.loginWithAnonymous.bind(this);
    $scope.loginWithFacebook = this.loginWithFacebook.bind(this);
    $scope.loginWithGithub = this.loginWithGithub.bind(this);
    $scope.loginWithGoogle = this.loginWithGoogle.bind(this);
    $scope.loginWithPassword = this.loginWithPassword.bind(this);
    $scope.loginWithTwitter = this.loginWithTwitter.bind(this);
    $scope.setError = this.setError.bind(this);
    $scope.signUp = this.signUp.bind(this);
    $scope.startChatting = this.startChatting.bind(this);

    $scope.showLoginBox(LoginMode.Authenticating);

    if (AutoLogin.autoLoginEnabled()) {
      const _ = firebase.auth().signOut();
    }

    firebase.auth().onAuthStateChanged((authData) => {
      if (!Auth.isAuthenticating()) {
        this.authenticate.bind(this)(null);
      }
    });
  }

  startChatting() {
    this.LocalStorage.setLastVisited();
    this.authenticate(null);
  }

  async authenticate(credential: ICredential) {
    this.$scope.showLoginBox(LoginMode.Authenticating);

    try {
      const authUser = await this.Auth.authenticate(credential);
      this.handleAuthData(authUser);
    }
    catch (error) {
      if (!Utils.unORNull(error)) {
        this.handleLoginError(error);
      }
      else {
        this.$scope.showLoginBox(this.getLoginMode());
      }
    }
  }

  getLoginMode(): LoginMode {
    let loginMode = LoginMode.Simple;
    const lastVisited = this.LocalStorage.getLastVisited();

    // We don't want to load the messenger straightaway to save bandwidth.
    // This will check when they last accessed the chat. If it was less than the timeout time ago,
    // then the click to chat box will be displayed. Clicking that will reset the timer
    if (Utils.unORNull(lastVisited) || (new Date().getTime() - lastVisited) / 1000 > this.Config.clickToChatTimeout && this.Config.clickToChatTimeout > 0) {
      loginMode = LoginMode.ClickToChat;
    }
    return loginMode;
  }

  handleAuthData(authData) {
    this.$rootScope.loginMode = this.Auth.mode;

    console.log(authData);

    this.$rootScope.auth = authData;
    if (authData) {
      this.handleLoginComplete(authData, false);
    }
    else {
      this.$scope.showLoginBox();
    }
  }

  setError(message: string) {
    this.$scope.showError = !Utils.unORNull(message);
    this.$scope.errorMessage = message;
  }

  loginWithPassword() {
    this.login(this.Credential.emailAndPassword(this.$scope.email, this.$scope.password));
  }

  loginWithFacebook() {
    this.login(this.Credential.facebook());
  }

  loginWithTwitter() {
    this.login(this.Credential.twitter());
  }

  loginWithGoogle() {
    this.login(this.Credential.google());
  }

  loginWithGithub() {
    this.login(this.Credential.github());
  }

  loginWithAnonymous() {
    this.login(this.Credential.anonymous());
  }

  /**
   * Log the user in using the appropriate login method
   * @param method - the login method: facebook, twitter etc...
   * @param options - hash of options: remember me etc...
   */
  async login(credential: ICredential) {

    // TODO: Move this to a service!
    // Re-establish a connection with Firebase
    this.Presence.goOnline();

    // Reset any error messages
    this.$scope.showError = false;

    // Hide the overlay
    this.$scope.showNotification(NotificationType.Waiting, 'Logging in', 'For social login make sure to enable popups!');

    try {
      const authData = await this.Auth.authenticate(credential);
      this.handleAuthData(authData);
    }
    catch (error) {
      this.$scope.hideNotification();
      this.handleLoginError(error);

      this.$timeout(() => {
        this.$scope.$digest();
      });
    }
  }

  async forgotPassword(email: string) {
    try {
      await this.Auth.resetPasswordByEmail(email);
      this.$scope.showNotification(NotificationType.Alert, 'Email sent', 'Instructions have been sent. Please check your Junk folder!', 'ok');
      this.setError(null);
    }
    catch (error) {
      this.handleLoginError(error);
    }
  }

  /**
   * Create a new account
   * @param email - user's email
   * @param password - user's password
   */
  async signUp(email: string, password: string) {

    // Re-establish connection with Firebase
    this.Presence.goOnline();

    this.$scope.showError = false;

    this.$scope.showNotification(NotificationType.Waiting, 'Registering...');

    // First create the super

    try {
      await this.Auth.signUp(email, password);
      this.$scope.email = email;
      this.$scope.password = password;
      this.loginWithPassword();
    }
    catch (error) {
      this.handleLoginError(error);
    }
  }

  /**
   * Bind the user to Firebase
   * Using the user's authentcation information create
   * a three way binding to the user property
   * @param userData - User object from Firebase authentication
   * @param firstLogin - Has the user just signed up?
   */
  handleLoginComplete(userData, firstLogin: boolean) {

    // Write a record to the firebase to record this API key
    this.$scope.showNotification(NotificationType.Waiting, 'Opening Chat...');

    // Load friends from config
    if (this.Config.friends) {
      this.FriendsConnector.addFriendsFromConfig(this.Config.friends);
    }

    // This allows us to clear the cache remotely
    this.LocalStorage.clearCacheWithTimestamp(this.Config.clearCacheTimestamp);

    // We have the user's ID so we can get the user's object
    if (firstLogin) {
      this.$scope.showProfileSettingsBox();
    }
    else {
      this.$scope.showMainBox();
    }

    this.$rootScope.$broadcast(N.LoginComplete);
    this.$scope.hideNotification();

  }

  /**
   * Handle a login error
   * Show a red warning box in the UI with the
   * error message
   * @param error - error returned from Firebase
   */
  handleLoginError(error: any) {

    // The login failed - display a message to the user
    this.$scope.hideNotification();

    let message = error.message || 'An unknown error occurred';

    if (error.code === 'AUTHENTICATION_DISABLED') {
      message = 'This authentication method is currently disabled.';
    }
    if (error.code === 'EMAIL_TAKEN') {
      message = 'Email address unavailable.';
    }
    if (error.code === 'INVALID_EMAIL') {
      message = 'Please enter a valid email.';
    }
    if (error.code === 'INVALID_ORIGIN') {
      message = 'Login is not available from this domain.';
    }
    if (error.code === 'INVALID_PASSWORD') {
      message = 'Please enter a valid password.';
    }
    if (error.code === 'INVALID_USER') {
      message = 'Invalid email or password.';
    }
    if (error.code === 'INVALID_USER') {
      message = 'Invalid email or password.';
    }
    if (error.code === 'ALREADY_AUTHENTICATING') {
      message = 'Already Authenticating';
    }

    this.setError(message);
    console.error(message);
  }

}

angular.module('myApp.controllers').controller('LoginController', LoginController);
