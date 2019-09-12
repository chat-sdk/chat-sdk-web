import * as angular from 'angular';
import * as $ from 'jquery';

import { IRootScope } from '../interfaces/root-scope';

export interface IDisableDrag extends ng.IDirective {

}

class DisableDrag implements IDisableDrag {

    static $inject = ['$rootScope','$document'];

    constructor(
        private $rootScope: IRootScope,
        private $document: ng.IDocumentService
    ) { }

    link(scope: ng.IScope, element: JQLite) {
        $(element).mousedown((e) => {
            this.$rootScope.disableDrag = true;
        });

        // TODO: Check this MM1
        $(document).mouseup((e) => {
            this.$rootScope.disableDrag = false;
        });

        // $document.mouseup((e) => {
        //     this.$rootScope.disableDrag = false;
        // });
    }

    static factory(): ng.IDirectiveFactory {
        return ($rootScope: IRootScope, $document: ng.IDocumentService) => new DisableDrag($rootScope, $document);
    }

}

angular.module('myApp.directives').directive('disableDrag', DisableDrag.factory());
