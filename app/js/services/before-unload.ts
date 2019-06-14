angular.module('myApp.services').factory('BeforeUnload', ['$window', function ($window) {
    var BeforeUnload = {

        listeners: [],

        init: function () {

            var beforeUnloadHandler = (function (e) {
                var listener = null;
                for(var i = 0; i < this.listeners.length; i++) {
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
            var index = this.listeners.indexOf(object);
            if(index >= 0) {
                this.listeners.splice(index, 1);
            }
        }

    };
    return BeforeUnload.init();
}]);