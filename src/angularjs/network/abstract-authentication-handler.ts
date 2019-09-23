import * as angular from 'angular';

export interface IAuthenticationHandler {
  currentUserID(): string
  setCurrentUserID(uid: string): void;
}

export class AbstractAuthenticationHandler implements IAuthenticationHandler {

  static $inject = [];

  constructor() { }

  private currentUserEntityID: string;

  currentUserID(): string {
    return this.currentUserEntityID;
  }

  setCurrentUserID(uid: string) {
    if (uid !== this.currentUserEntityID) {
      this.currentUserEntityID = uid;
    }
  }

}

angular.module('myApp.services').service('AbstractAuthenticationHandler', AbstractAuthenticationHandler);
