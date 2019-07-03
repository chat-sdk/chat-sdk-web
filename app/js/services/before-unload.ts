import * as angular from 'angular'

export interface IBeforeUnload {

}

angular.module('myApp.services').factory('BeforeUnload', ['$window', function ($window) {
    let BeforeUnload = {

        listeners: [],

        init: function () {

            let beforeUnloadHandler = (function (e) {
                let listener = null;
                for(let i = 0; i < this.listeners.length; i++) {
                    listener = this.listeners[i];
                    try {
                        listener.beforeUnload();
                    }
                    catch (e) {

                    }
                }
            }).bind(this);

            if ($window.addEventListener) {
                $window.addEventListener('beforeunload', beforeUnloadHandler);
            } else {
                $window.onbeforeunload = beforeUnloadHandler;
            }
            return this;
        },

        addListener: function (object) {
            if(this.listeners.indexOf(object) == -1 && object.beforeUnload) {
                this.listeners.push(object);
            }
        },

        removeListener: function (object) {
            let index = this.listeners.indexOf(object);
            if(index >= 0) {
                this.listeners.splice(index, 1);
            }
        }

    };
    return BeforeUnload.init();
}]);