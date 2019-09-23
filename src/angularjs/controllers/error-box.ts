import * as angular from 'angular';

export interface IErrorBoxController {

}

class ErrorBoxController implements IErrorBoxController {

  static $inject = ['$scope'];

  constructor(private $scope: ng.IScope) { }

}

angular.module('myApp.controllers').controller('ErrorBoxController', ErrorBoxController);
