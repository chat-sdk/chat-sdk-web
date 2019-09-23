import * as angular from 'angular';

import { N } from '../keys/notification-keys';
import { IRoomScope } from '../controllers/chat';
import { IConfig } from '../services/config';

export interface ICCFlash extends ng.IDirective {

}

class CCFlash implements ICCFlash {

  static $inject = ['$timeout', 'Config'];

  constructor(
    private $timeout: ng.ITimeoutService,
    private Config: IConfig
  ) { }

  link(scope: IRoomScope, element: JQLite) {
    let originalColor = element.css('background-color');
    let originalTag = element.attr('data-cc-flash');
    let animating = false;

    scope.$on(N.RoomFlashHeader, (event, room, color, period, tag) => {
      if (scope.room == room && color && period && !animating) {
        if (!tag || tag == originalTag) {
          animating = true;

          element.css('background-color', color);

          this.$timeout(() => {
            scope.$digest();
          });

          // Set another timeout
          this.$timeout(() => {
            if (tag == 'room-header') {
              originalColor = this.Config.headerColor;
            }
            element.css('background-color', originalColor);
            scope.$digest();
            animating = false;
          }, period);
        }
      }
    });
  }

  static factory(): ng.IDirectiveFactory {
    return ($timeout: ng.ITimeoutService, Config: IConfig) => new CCFlash($timeout, Config);
  }

}

angular.module('myApp.directives').directive('ccFlash', CCFlash.factory());
