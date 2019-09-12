import * as angular from 'angular';
import * as $ from 'jquery';

import { Utils } from '../services/utils';

export interface IConsumeEvent extends ng.IDirective {

}

class ConsumeEvent implements IConsumeEvent {

    link(scope: ng.IScope, element: JQLite) {
        $(element).mousedown((e) => {
            Utils.stopDefault(e);
            return false;
        });
    }

    static factory(): ng.IDirectiveFactory {
        return () => new ConsumeEvent();
    }

}

angular.module('myApp.directives').directive('consumeEvent', ConsumeEvent.factory());
