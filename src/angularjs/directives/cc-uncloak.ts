import * as angular from 'angular';

export interface ICCUncloak extends ng.IDirective {

}

class CCUncloak implements ICCUncloak {

  link(scope: ng.IScope, element: JQLite) {
    element.removeAttr('style');
  }

  static factory(): ng.IDirectiveFactory {
    return () => new CCUncloak();
  }

}

angular.module('myApp.directives').directive('ccUncloak', CCUncloak.factory());
