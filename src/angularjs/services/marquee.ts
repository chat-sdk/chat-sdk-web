import * as angular from 'angular';

export interface IMarquee {
    startWithMessage(message: string): void;
}

class Marquee implements IMarquee {

    static $inject = ['$window', '$interval'];

    running: ng.IPromise<any> = null;
    title =  '';

    constructor(
        private $window: ng.IWindowService,
        private $interval: ng.IIntervalService,
    ) {
        this.title = $window.document.title;
        return this;
    }

    startWithMessage(message: string) {
        if (this.running) {
            this.stop();
        }
        let text = 'Chatcat Message: ' + message + '...';

        this.running = this.$interval(() => {
            // Change the page title
            this.$window.document.title = text;
            if (text.length > 0) {
                text = text.slice(1);
            }
            else {
                this.stop();
            }
        }, 80);
    }

    stop() {
        this.$interval.cancel(this.running);
        this.running = null;
        // Change the page title
        this.$window.document.title = this.title;
    }

}

angular.module('myApp.services').service('Marquee', Marquee);
