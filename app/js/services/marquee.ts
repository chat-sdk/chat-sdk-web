import * as angular from 'angular'

export interface IMarquee {

}

angular.module('myApp.services').factory('Marquee', ['$window', '$interval', function ($window, $interval) {
    var Marquee = {

        running: null,
        title: "",

        init: function () {
            this.title = $window.document.title;
            return this;
        },

        startWithMessage: function (message) {
            if(this.running) {
                this.stop();
            }
            var text = "Chatcat Message: " + message + "...";

            this.running = $interval((function () {
                // Change the page title
                $window.document.title = text;
                if(text.length > 0) {
                    text = text.slice(1);
                }
                else {
                    this.stop();
                }
            }).bind(this), 80);
        },

        stop: function () {
            $interval.cancel(this.running);
            this.running = null;
            // Change the page title
            $window.document.title = this.title;
        }

    };
    return Marquee.init();
}]);