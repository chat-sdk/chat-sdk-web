import * as angular from 'angular';

export interface IOnFileChange extends ng.IDirective {

}

class OnFileChange implements IOnFileChange {

  restrict = 'A';

  link(scope: ng.IScope, element: JQLite, attrs: ng.IAttributes) {
    element.bind('change', () => {
      scope.$eval(attrs.onFileChange);
    });
  }

  static factory(): ng.IDirectiveFactory {
    return () => new OnFileChange();
  }

}

angular.module('myApp.directives').directive('onFileChange', OnFileChange.factory());
