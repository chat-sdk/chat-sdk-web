import * as angular from 'angular'
import {N} from "../keys/notification-keys";
import * as $ from "jquery"

export interface IVisibility {

}

class Visibility implements IVisibility {

    static $inject = ["$rootScope"];

    isHidden = false;

    constructor (private $rootScope) {
        $(window).blur(() => {
            this.isHidden = true;
            this.changed()
        });

        $(window).focus(() => {
            this.isHidden = false;
            this.changed()
        });

    }

    changed() {
        this.$rootScope.$broadcast(N.VisibilityChanged, this.isHidden);
    }

    getIsHidden() {
        return this.isHidden;
    }
}

angular.module('myApp.services').service('Visibility', Visibility);