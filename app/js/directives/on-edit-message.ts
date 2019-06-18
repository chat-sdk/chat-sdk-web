import * as angular from 'angular'
import {EditMessageNotification} from "../keys/notification-keys";

angular.module('myApp.directives').directive('onEditMessage', function () {
    return function (scope, element, attr) {
        scope.$on(EditMessageNotification, function (event, mid, newText) {
            if(mid == scope.message.meta.mid) {
                element.text(newText);
            }
        });
    };
});
