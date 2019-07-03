import * as angular from 'angular'
import {Emoji} from "./emoji";

export interface IUtils {
    unORNull (object): boolean
}

class Utils implements IUtils {

    unORNull(object): boolean {
        return object === 'undefined' || object == null;
    }

    empty(object): boolean {
        return this.unORNull(object) || object.length === 0;
    }

    stopDefault(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        else {
            window.event.returnValue = false;
        }
        return false;
    }
}

angular.module('myApp.services').service('Utils', Utils);