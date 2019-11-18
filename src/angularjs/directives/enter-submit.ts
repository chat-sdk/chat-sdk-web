import * as angular from 'angular';

export interface IEnterSubmit extends ng.IDirective {

}

class EnterSubmit implements IEnterSubmit {

  restrict = 'A';

  link(scope: ng.IScope, element: JQLite, attrs: ng.IAttributes) {
    element.bind('keydown', (event) => {
      const code = event.keyCode || event.which;

      if (code === 13) {
        if (!event.shiftKey) {
          event.preventDefault();
          scope.$apply(attrs.enterSubmit);

          // Scroll down on enter too
          scope.$broadcast('enterScrollDown');

        }
      }
    });
  }

  static factory(): ng.IDirectiveFactory {
    return () => new EnterSubmit();
  }

}

angular.module('myApp.directives').directive('enterSubmit', EnterSubmit.factory());
