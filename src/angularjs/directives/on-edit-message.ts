import * as angular from 'angular'
import {MessageScope} from "../controllers/chat";
import {N} from "../keys/notification-keys";

angular.module('myApp.directives').directive('onEditMessage', function () {
    return function (scope: MessageScope, element, attr) {
        scope.$on(N.EditMessage, (event, mid, newText) => {
            if(mid == scope.message.meta.mid) {
                element.text(newText);
            }
        });
    };
});
