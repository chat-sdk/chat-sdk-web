import * as $ from 'jquery';
import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IPaths } from '../network/paths';
import { IRootScope } from '../interfaces/root-scope';

export interface ISocialIFrame extends ng.IDirective {

}

class SocialIFrame implements ISocialIFrame {

    $inject = ['$rootScope', /*'$document',*/ '$window'/*, 'Paths'*/];

    constructor(
        private $rootScope: IRootScope,
        // private $document: ng.IDocumentService,
        private $window: ng.IWindowService,
        // private Paths: IPaths
    ) { }

    link(scope: ng.IScope, element: JQLite) {
        this.$rootScope.$on(N.StartSocialLogin, (event, data, callback) => {

            //element.load(function () {

//                let data = {
//                    action: 'github',
//                    path: this.Paths.firebase().toString()
//                };

            // Add the event listener
            let eventMethod = this.$window.addEventListener ? 'addEventListener' : 'attachEvent';
            let eventer = this.$window[eventMethod];
            let messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

            eventer(messageEvent, (e) => {
                if (e.data) {
                    let data = JSON.parse(e.data);
                    if (data.provider == 'chatcat') {
                        callback(data);
                    }
                }
//                    else {
//                        callback(null);
//                    }
            });

            //TODO Check this
            ($(element).get(0) as any).contentWindow.postMessage(JSON.stringify(data), '*');
            //});
        });
    }

    static factory(): ng.IDirectiveFactory {
        return ($rootScope: IRootScope, $document: ng.IDocumentService, $window: ng.IWindowService, Paths: IPaths) => new SocialIFrame($rootScope, $window);
    }

}

angular.module('myApp.directives').directive('socialIframe', SocialIFrame.factory());
