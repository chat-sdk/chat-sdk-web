import * as angular from 'angular'
import {IAuth} from "./auth";

export interface IAuthenticationHandler {
    currentUserID(): string
    setCurrentUserID(uid)
}

export class AbstractAuthenticationHandler implements IAuthenticationHandler {

    static $inject = [];

    constructor () {
    }

    private currentUserEntityID: string;

    currentUserID(): string {
        return this.currentUserEntityID;
    }

    setCurrentUserID(uid) {
        if (uid !== this.currentUserEntityID) {
            this.currentUserEntityID = uid;
        }
    }

}

angular.module('myApp.services').service('AbstractAuthenticationHandler', AbstractAuthenticationHandler);