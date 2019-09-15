import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IRootScope } from '../interfaces/root-scope';
import { ILocalStorage } from '../persistence/local-storage';

export interface IScreen {
    screenWidth: number;
    screenHeight: number;
}

class Screen implements IScreen {

    static $inject = ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage'];

    screenWidth = 0;
    screenHeight = 0;

    constructor(
        private $rootScope: IRootScope,
        private $timeout: ng.ITimeoutService,
        private $document: ng.IDocumentService,
        private $window: ng.IWindowService,
        private LocalStorage: ILocalStorage,
    ) {
        // Set the screen width and height
        this.updateScreenSize();

        // Monitor the window size
        angular.element($window).bind('resize', () => {
            this.updateScreenSize();
        });
    }

    // TODO: Check this
    updateScreenSize() {
        this.screenWidth = this.$window.innerWidth;//this.$document.width();
        this.screenHeight = this.$window.innerHeight;

        this.$rootScope.$broadcast(N.ScreenSizeChanged);
    }

}

angular.module('myApp.services').service('Screen', Screen);
