angular.module('myApp.services').factory('Utils', [function () {

    return {
        unORNull: function (object) {
            return object === 'undefined' || object == null;
        },

        empty: function (object) {
            return this.unORNull(object) || object.length === 0;
        },

        stopDefault: function(e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            else {
                window.event.returnValue = false;
            }
            return false;
        }
    }
}]);