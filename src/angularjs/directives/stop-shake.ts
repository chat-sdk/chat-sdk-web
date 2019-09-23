import * as angular from 'angular';
import * as $ from 'jquery';
import { IRootScope } from '../interfaces/root-scope';

export interface IStopShake extends ng.IDirective {

}

/**
 * #54
 * This directive is used for scrollbars when the component can
 * also be dragged horizontally. If the user has shaky hands then
 * the chat will shake while they're scrolling. To prevent this
 * we add a listener to hear when they're scrolling.
 */
class StopShake implements IStopShake {

  $inject = ['$rootScope'/*, '$document'*/];

  constructor(
    private $rootScope: IRootScope,
    // private $document: ng.IDocumentService,
  ) { }

  link(scope: ng.IScope, element: JQLite) {
    $(element).scroll(() => {
      this.$rootScope.disableDrag = true;
    });

    // Allow dragging again on mouse up
    $(document).mouseup((e) => {
      this.$rootScope.disableDrag = false;
    });
  }

  static factory(): ng.IDirectiveFactory {
    return ($rootScope: IRootScope, $document: ng.IDocumentService) => new StopShake($rootScope);
  }

}

angular.module('myApp.directives').directive('stopShake', StopShake.factory());
