import * as angular from 'angular'
import * as $ from 'jquery'


import {Utils} from "../services/utils";

angular.module('myApp.directives').directive('consumeEvent', [function () {
    return function (scope, elm, attrs) {
        $(elm).mousedown((e) => {
            Utils.stopDefault(e);
            return false;
        });
    };
}]);
