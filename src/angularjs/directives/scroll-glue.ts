import * as angular from 'angular'


import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('scrollGlue', function(){
    return {
        priority: 1,
        require: ['?ngModel'],
        restrict: 'A',
        link: function(scope: IRoomScope, $el, attrs, ctrls){
            const el = $el[0];

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

            $el.bind('scroll', () => {
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
    };
});