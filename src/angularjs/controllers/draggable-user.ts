import * as angular from 'angular';

interface IDraggableUserController {

}

/**
 * @deprecated
 */
class DraggableUserController implements IDraggableUserController {

  static $inject = ['$scope'];

  constructor(private $scope: ng.IScope) { }

}

angular.module('myApp.controllers').controller('DraggableUserController', DraggableUserController);
