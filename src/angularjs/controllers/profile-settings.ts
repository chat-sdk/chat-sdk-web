import * as angular from 'angular';

import { ShowProfileSettingsBox } from '../keys/defines';
import { UserKeys } from '../keys/user-keys';
import { Utils } from '../services/utils';
import { NotificationType } from '../keys/notification-type';
import { IAuth } from '../network/auth';
import { IConfig } from '../services/config';
import { ISoundEffects } from '../services/sound-effects';
import { ILocalStorage } from '../persistence/local-storage';
import { IRootScope } from '../interfaces/root-scope';
import { IUser } from '../entities/user';

export interface IProfileSettingsScope extends ng.IScope {
  dirty: boolean;
  muted: boolean;
  nameChangeDummy: any;
  ref: any;
  validation: {};
  cacheCleared: boolean;
  clearCache(): void;
  done(): void;
  getUser(): IUser;
  isValidURL(): void;
  showMainBox(): void;
  toggleMuted(): void;
  validate(): boolean;
  validateLocation(): boolean;
  validateName(): boolean;
  validateProfileLink(): boolean;
  validateString(key: string, str: string): boolean;
}

export interface IProfileSettingsController {

}

class ProfileSettingsController implements IProfileSettingsController {

  static $inject = ['$scope', '$rootScope', 'Auth', 'Config', 'SoundEffects', 'LocalStorage'];

  constructor(
    private $scope: IProfileSettingsScope,
    private $rootScope: IRootScope,
    private Auth: IAuth,
    private Config: IConfig,
    private SoundEffects: ISoundEffects,
    private LocalStorage: ILocalStorage,
  ) {
    // $scope propeties
    $scope.dirty = false;
    $scope.muted = SoundEffects.muted;
    $scope.nameChangeDummy = null;
    $scope.ref = null;
    $scope.validation = {
      [UserKeys.Name]: {
        minLength: 2,
        maxLength: 50,
        valid: true
      },
      // [UserKeys.Location]: {
      //   minLength: 0,
      //   maxLength: 50,
      //   valid: true
      // },
      [UserKeys.ProfileLink]: {
        minLength: 0,
        maxLength: 100,
        valid: true
      },
    };

    // $scope methods
    $scope.clearCache = this.clearCache.bind(this);
    $scope.done = this.done.bind(this);
    $scope.isValidURL = this.isValidURL.bind(this);
    $scope.toggleMuted = this.toggleMuted.bind(this);
    $scope.validate = this.validate.bind(this);
    $scope.validateLocation = this.validateLocation.bind(this);
    $scope.validateName = this.validateName.bind(this);
    $scope.validateProfileLink = this.validateProfileLink.bind(this);
    $scope.validateString = this.validateString.bind(this);

    $scope.$watchCollection('user.meta', () => {
      $scope.dirty = true;
    });

    // When the box will be opened we need to add a listener to the user
    $scope.$on(ShowProfileSettingsBox, () => {
      console.log('Show Profile');
    });
  }

  validateLocation(): boolean {
    return true;
    // return this.$scope.validation[UserKeys.Location].valid;
  }

  validateProfileLink(): boolean {
    return this.$scope.validation[UserKeys.ProfileLink].valid;
  }

  validateName(): boolean {
    return this.$scope.validation[UserKeys.Name].valid;
  }

  toggleMuted() {
    this.$scope.muted = this.SoundEffects.toggleMuted();
  }

  clearCache() {
    if (!this.$scope.cacheCleared) {
      this.LocalStorage.clearCache();
    }
    this.$scope.cacheCleared = true;
  }

  isValidURL(url: string): boolean {// wrapped in self calling function to prevent global pollution

    // URL pattern based on rfc1738 and rfc3986
    const rgPctEncoded = '%[0-9a-fA-F]{2}';
    const rgProtocol = '(http|https):\\/\\/';

    const rgUserinfo = '([a-zA-Z0-9$\\-_.+!*\'(),;:&=]|' + rgPctEncoded + ')+' + '@';

    const rgDecOctet = '(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])'; // 0-255
    const rgIpv4address = '(' + rgDecOctet + '(\\.' + rgDecOctet + '){3}' + ')';
    const rgHostname = '([a-zA-Z0-9\\-\\u00C0-\\u017F]+\\.)+([a-zA-Z]{2,})';
    const rgPort = '[0-9]+';

    const rgHostport = '(' + rgIpv4address + '|localhost|' + rgHostname + ')(:' + rgPort + ')?';

    // chars sets
    // safe           = "$" | "-" | "_" | "." | "+"
    // extra          = "!" | "*" | "'" | "(" | ")" | ","
    // hsegment       = *[ alpha | digit | safe | extra | ";" | ":" | "@" | "&" | "=" | escape ]
    const rgPChar = 'a-zA-Z0-9$\\-_.+!*\'(),;:@&=';
    const rgSegment = '([' + rgPChar + ']|' + rgPctEncoded + ')*';

    const rgPath = rgSegment + '(\\/' + rgSegment + ')*';
    const rgQuery = '\\?' + '([' + rgPChar + '/?]|' + rgPctEncoded + ')*';
    const rgFragment = '\\#' + '([' + rgPChar + '/?]|' + rgPctEncoded + ')*';

    const rgHttpUrl = new RegExp(
      '^'
      + rgProtocol
      + '(' + rgUserinfo + ')?'
      + rgHostport
      + '(\\/'
      + '(' + rgPath + ')?'
      + '(' + rgQuery + ')?'
      + '(' + rgFragment + ')?'
      + ')?'
      + '$'
    );

    // export public function
    if (rgHttpUrl.test(url)) {
      return true;
    }
    else {
      return false;
    }
  }

  validate(): boolean {

    const user = this.$scope.getUser();

    // Validate the user
    const nameValid = this.$scope.validateString(UserKeys.Name, user.getName());

    const profileLinkValid = !this.Config.userProfileLinkEnabled || this.$scope.validateString(UserKeys.ProfileLink, user.getProfileLink());

    return nameValid && profileLinkValid;
  }

  validateString(key: string, str: string): boolean {
    let valid = true;

    if (Utils.unORNull(str)) {
      valid = false;
    }
    else if (str.length < this.$scope.validation[key].minLength) {
      valid = false;
    }
    else if (str.length > this.$scope.validation[key].maxLength) {
      valid = false;
    }

    this.$scope.validation[key].valid = valid;
    return valid;

  }

  /**
   * This is called when the user confirms changes to their user
   * profile
   */
  done() {

    // Is the name valid?
    if (this.$scope.validate()) {

      this.$scope.showMainBox();

      // Did the user update any values?
      if (this.$scope.dirty) {
        this.$scope.getUser().pushMeta();
        this.$scope.dirty = false;
      }
    }
    else {
      if (!this.$scope.validation[UserKeys.Name].valid) {
        this.$rootScope.showNotification(NotificationType.Alert, 'Validation failed', 'The name must be between ' + this.$scope.validation[UserKeys.Name].minLength + ' - ' + this.$scope.validation[UserKeys.Name].maxLength + ' characters long ', 'Ok');
      }
      // if (!this.$scope.validation[UserKeys.Location].valid) {
      //     this.$scope.showNotification(NotificationType.Alert, 'Validation failed', 'The location must be between '+this.$scope.validation[UserKeys.Location].minLength+' - '+this.$scope.validation[UserKeys.Location].maxLength+' characters long', 'Ok');
      // }
      if (!this.$scope.validation[UserKeys.ProfileLink].valid) {
        this.$rootScope.showNotification(NotificationType.Alert, 'Validation failed', 'The profile link must be a valid URL', 'Ok');
      }
    }
  }

}

angular.module('myApp.controllers').controller('ProfileSettingsController', ProfileSettingsController);
