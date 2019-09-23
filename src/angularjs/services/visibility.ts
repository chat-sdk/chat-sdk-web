import * as angular from 'angular';
import * as $ from 'jquery';

import { N } from '../keys/notification-keys';
import { IRootScope } from '../interfaces/root-scope';

export interface IVisibility {
  getIsHidden(): boolean;
}

class Visibility implements IVisibility {

  static $inject = ['$rootScope'];

  isHidden = false;

  constructor(private $rootScope: IRootScope) {
    $(window).blur(() => {
      this.isHidden = true;
      this.changed()
    });

    $(window).focus(() => {
      this.isHidden = false;
      this.changed()
    });

  }

  changed() {
    this.$rootScope.$broadcast(N.VisibilityChanged, this.isHidden);
  }

  getIsHidden(): boolean {
    return this.isHidden;
  }

}

angular.module('myApp.services').service('Visibility', Visibility);
