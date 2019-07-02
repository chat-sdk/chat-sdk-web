import * as angular from 'angular'
import {VisibilityChangedNotification} from "../keys/notification-keys";

export interface IVisibility {

}

angular.module('myApp.services').factory('Visibility', ['$rootScope', '$document', function ($rootScope, $document) {

    var Visibility = {

        isHidden: false,
        uid: "Test",

        init: function () {
            document.addEventListener("visibilitychange", (this.changed).bind(this));
            document.addEventListener("webkitvisibilitychange", (this.changed).bind(this));
            document.addEventListener("mozvisibilitychange", (this.changed).bind(this));
            document.addEventListener("msvisibilitychange", (this.changed).bind(this));

            this.uid = new Date().getTime();

            return this;
        },

        changed: function (event) {
            this.isHidden = $document.hidden || $document.webkitHidden || $document.mozHidden || $document.msHidden;
            $rootScope.$broadcast(VisibilityChangedNotification, this.isHidden);
        },

        getIsHidden: function () {
            return this.isHidden;
        }
    };

    return Visibility.init();
}]);
