import * as angular from 'angular';

import { IUser } from '../entities/user';
import { IUserStore } from '../persistence/user-store';
import { IProfileBox } from '../services/profile-box.service';
import { IBlocking } from '../services/blocking.service';
import { IContact } from '../services/contact.service';
import { IThread } from '../services/thread.service';

class ProfileBoxController {

  static $inject = ['ProfileBox', 'UserStore', 'Blocking', 'Contact', 'Thread'];

  dragging: boolean;

  constructor(
    private ProfileBox: IProfileBox,
    private UserStore: IUserStore,
    private Blocking: IBlocking,
    private Contact: IContact,
    private Thread: IThread,
  ) { }

  get style(): { [key: string]: any } {
    return this.ProfileBox.style;
  }

  get profileHTML(): string {
    return this.ProfileBox.profileHTML;
  }

  get user(): IUser {
    return this.ProfileBox.user;
  }

  get friendsEnabled(): boolean {
    return this.Contact.friendsEnabled;
  }

  get me(): IUser {
    return this.UserStore.currentUser();
  }

  copyUserID() {
    const uid = this.user && this.user.uid();
    window.prompt('Copy to clipboard: Ctrl+C, Enter', uid);
  }

  startChat() {
    this.Thread.openPrivateRoom(this.me, this.user);
  }

  addRemoveFriend() {
    this.Contact.toggleFriend(this.user);
  }

  isFriend(): boolean {
    return this.Contact.isFriend(this.user);
  }

  blockUnblockUser() {
    this.Blocking.toggle(this.user);
  }

  isBlocked(): boolean {
    return this.Blocking.isBlocked(this.user);
  }

  onMouseEnter() {
    this.ProfileBox.cancelTimer();
  }

  onMouseLeave() {
    this.ProfileBox.show(null, 0);
  }

}

angular.module('myApp.components').component('profileBox', {
  templateUrl: '/assets/partials/profile-box.html',
  controller: ProfileBoxController,
  controllerAs: 'ctrl',
  bindings: {
    dragging: '<'
  }
});
