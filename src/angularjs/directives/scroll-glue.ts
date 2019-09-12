import * as angular from 'angular';

import { IRoomScope } from '../controllers/chat';

export interface IScroolGlue extends ng.IDirective {

}

class ScrollGlue implements IScroolGlue {

    priority = 1;
    require = ['?ngModel'];
    restrict = 'A';

    link(scope: IRoomScope, element: JQLite) {
        const el = element[0];

        let didScroll = false;

        const scrollToBottom = () => {
            el.scrollTop = el.scrollHeight;
        };

        const shouldActivateAutoScroll = () => {
            // + 1 catches off by one errors in chrome
            return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
        };

        scope.$watchCollection('room.messages', () => {
            if(scope.autoScroll){
                scrollToBottom();
            }
            if (!didScroll) {
                scrollToBottom();
            }
        });

        element.bind('scroll', () => {
            didScroll = true;
            let activate = shouldActivateAutoScroll();
            if (activate !== scope.autoScroll) {
                scope.autoScroll = activate;
            }
        });

        // If they press enter scroll down
        scope.$on('enterScrollDown' , () =>{
            scrollToBottom();
        });
    }

    static factory(): ng.IDirectiveFactory {
        return () => new ScrollGlue();
    }

}

angular.module('myApp.directives').directive('scrollGlue', ScrollGlue.factory());
