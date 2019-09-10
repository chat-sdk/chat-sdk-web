import * as angular from 'angular';

export interface ICCFocus extends ng.IDirective {

}

class CCFocus implements ICCFocus {

    restrict = 'A';

    link(scope: ng.IScope, element: JQLite, attr: ng.IAttributes) {
        scope.$watch(attr.ccFocus, (n, o) => {
            if (n !== 0 && n) {
                element[0].focus();
            }
        });
    }

    static factory(): ng.IDirectiveFactory {
        return () => new CCFocus()
    }

}

angular.module('myApp.directives').directive('ccFocus', CCFocus.factory());
