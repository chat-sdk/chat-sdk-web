import * as angular from 'angular';

import { Dimensions } from '../keys/dimensions';
import { IConfig } from './config';
import { IUserStore } from '../persistence/user-store';
import { IUser } from '../entities/user';


export interface IProfileBox {
  profileHTML: string;
  style: { [key: string]: any };
  user: IUser;
  cancelTimer(): void;
  /**
   * Show the floating profile box
   * when the user's mouse leaves the box
   * we wait a small amount of time before
   * hiding the box - this gives the mouse
   * time to go from the list to inside the
   * box before the box disappears
   */
  show(uid: string, duration?: number): void;
}

export class ProfileBox implements IProfileBox {

  static $inject = ['Config', 'UserStore', '$timeout', '$sce'];

  private hideTimeoutPromise: ng.IPromise<any>;

  profileHTML: string;
  style: { [key: string]: any } = {};
  user: IUser;

  constructor(
    private Config: IConfig,
    private UserStore: IUserStore,
    private $timeout: ng.ITimeoutService,
    private $sce: ng.ISCEService,
  ) { }

  show(uid: string, duration?: number) {
    if (this.Config.disableUserInfoPopup) {
      return;
    }

    this.style = {
      right: 250 + 'px',
      width: Dimensions.ProfileBoxWidth + 'px',
      'border-top-left-radius': 4,
      'border-bottom-left-radius': 4,
      'border-top-right-radius': 0,
      'border-bottom-right-radius': 0
    };

    if (!uid) {
      if (duration === 0) {
        this.user = null;
      }
      else {
        this.hideTimeoutPromise = this.$timeout(() => {
          this.user = null;
        }, duration ? duration : 100);
      }
    }
    else {
      this.cancelTimer();
      this.user = this.UserStore.getUserWithID(uid);
      const profileHTML = this.user.getProfileHTML();
      this.profileHTML = profileHTML && this.$sce.trustAsHtml(profileHTML);
    }
  }

  cancelTimer() {
    this.$timeout.cancel(this.hideTimeoutPromise);
  }

}

angular.module('myApp.services').service('ProfileBox', ProfileBox);
