import * as angular from 'angular'
import {N} from "../keys/notification-keys";

export interface IVisibility {

}

angular.module('myApp.services').factory('Visibility', ['$rootScope', '$document', '$window', function ($rootScope, $document, $window) {

    let Visibility = {

        isHidden: false,
        uid: "Test",

        init: function () {
            document.addEventListener("visibilitychange", () => this.changed);
            document.addEventListener("webkitvisibilitychange", () => this.changed);
            document.addEventListener("mozvisibilitychange", () => this.changed);
            document.addEventListener("msvisibilitychange", () => this.changed);

            this.uid = new Date().getTime();

            return this;
        },

        changed: function (event) {
            this.isHidden = $document.hidden || $document.webkitHidden || $document.mozHidden || $document.msHidden;
            $rootScope.$broadcast(N.VisibilityChanged, this.isHidden);
        },

        getIsHidden: function () {
            return this.isHidden;
        }
    };

    return Visibility.init();
}]);
