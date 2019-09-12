import * as angular from 'angular'

interface IDraggableUserController {

}

/**
 * @deprecated
 */
class DraggableUserController implements IDraggableUserController {

    static $inject = ['$scope'];

}

angular.module('myApp.controllers').controller('DraggableUserController', DraggableUserController);
