import * as angular from 'angular';
import * as pikaday from 'pikaday';

import { IRootScope } from '../interfaces/root-scope';

interface IPikaday extends ng.IDirective {

}

/**
 * Not used now - was used to show date of birth picker
 * @deprecated
 */
class Pikaday implements IPikaday {

  static $inject = ['$rootScope'];

  constructor(
    private $rootScope: IRootScope,
  ) { }

  link(scope: ng.IScope, element: JQLite) {
    new pikaday({
      field: element[0],
      firstDay: 1,
      minDate: new Date('1920-01-01'),
      maxDate: new Date(),
      defaultDate: new Date('1990-01-01'),
      onSelect: function (date: Date) {
      }
    });
  }

  static factory(): ng.IDirectiveFactory {
    return ($rootScope: IRootScope) => new Pikaday($rootScope);
  }

}

angular.module('myApp.directives').directive('pikaday', Pikaday.factory());
