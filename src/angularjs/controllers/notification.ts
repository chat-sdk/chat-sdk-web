import * as angular from 'angular';

export interface NotificationScope extends ng.IScope {
  notification: any;
  submit(): void;
}

export interface INotificationController {

}

class NotificationController implements INotificationController {

  static $inject = ['$scope'];

  constructor(
    private $scope: NotificationScope,
  ) {
    $scope.submit = this.submit.bind(this)()
  }

  submit() {
    this.$scope.notification.show = false;
  }

}

angular.module('myApp.controllers').controller('NotificationController', NotificationController);
