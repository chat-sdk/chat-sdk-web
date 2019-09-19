import * as angular from 'angular';

import { IUser } from '../entities/user';

export interface IProfileBoxScope extends ng.IScope {
    hover: any;
    currentUser: IUser;
}

export interface IUserProfileBoxController {

}

class UserProfileBoxController implements IUserProfileBoxController{

    static $inject = ['$scope'];

    constructor(private $scope: IProfileBoxScope) { }

    copyUserID() {
        // Get the ID
        const id = this.$scope.currentUser.uid();

        window.prompt('Copy to clipboard: Ctrl+C, Enter', id);
    }

}

angular.module('myApp.controllers').controller('UserProfileBoxController', UserProfileBoxController);
