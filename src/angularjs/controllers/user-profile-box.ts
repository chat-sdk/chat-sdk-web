import * as angular from 'angular'
import {IUser} from "../entities/user";

export interface IProfileBoxScope extends ng.IScope {
    hover: any,
    currentUser: any,
}

export interface IUserProfileBoxController {

}

class UserProfileBoxController implements IUserProfileBoxController{

    static $inject = ['$scope'];

    private $scope;

    constructor($scope) {
        this.$scope = $scope;
    }

    copyUserID() {

        // Get the ID
        const id = this.$scope.currentUser.uid();

        window.prompt("Copy to clipboard: Ctrl+C, Enter", id);
    };

}

angular.module('myApp.controllers').controller('UserProfileBoxController', UserProfileBoxController);