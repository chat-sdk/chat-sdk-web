import * as angular from 'angular';

export interface INotificationScope extends ng.IScope {
  notification: any;
  submit(): void;
}

export interface INotificationController {

}

class NotificationController implements INotificationController {

  static $inject = ['$scope'];

  constructor(
    private $scope: INotificationScope,
  ) {
    $scope.submit = this.submit.bind(this)()
  }

  submit() {
    this.$scope.notification.show = false;
  }

}

angular.module('myApp.controllers').controller('NotificationController', NotificationController);
