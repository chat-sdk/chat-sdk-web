import * as $ from 'jquery';
import * as angular from 'angular';

import { IProfileBoxScope } from '../controllers/user-profile-box';
import { IScreen } from '../services/screen';

export interface ICenterMouseY extends ng.IDirective {

}

/**
 * This is used by the profile box - to keep it centered on the mouse's y axis until we move into it
 */
class CenterMouseY implements ICenterMouseY {

    static $inject = ['$document', 'Screen'];

    constructor(
        private $document: ng.IDocumentService,
        private Screen: IScreen,
    ) { }

    link(scope: IProfileBoxScope, element: JQLite) {
        $(element).hover(() => {
            scope.hover = true;
        }, () => {
            scope.hover = false;
        });

        $(document).mousemove((e) => {
            //!element.is(':hover')
            if (scope.currentUser && !scope.hover) {
                // Keep the center of this box level with the mouse y
                element.css({bottom: (this.Screen.screenHeight - e.clientY - $(element).height() / 2) + 'px'});
            }
        });
    }

    static factory(): ng.IDirectiveFactory {
        return ($document: ng.IDocumentService, Screen: IScreen) => new CenterMouseY($document, Screen);
    }

}

angular.module('myApp.directives').directive('centerMouseY', CenterMouseY.factory());
