import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IMessageScope } from '../controllers/chat';

export interface IOnEditMessage extends ng.IDirective {

}

class OnEditMessage implements IOnEditMessage {

  link(scope: IMessageScope, element: JQLite) {
    scope.$on(N.EditMessage, (event, mid, newText) => {
      if (mid === scope.message.meta.mid) {
        element.text(newText);
      }
    });
  }

  static factory(): ng.IDirectiveFactory {
    return () => new OnEditMessage();
  }

}

angular.module('myApp.directives').directive('onEditMessage', OnEditMessage.factory());
