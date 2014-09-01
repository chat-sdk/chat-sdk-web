'use strict';


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]);

myApp.config(['$routeProvider', function($routeProvider) {
  //$routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'MyCtrl1'});
  //$routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
  //$routeProvider.otherwise({redirectTo: '/view1'});
}]);

//myApp.run(function () {
//    App.init({
//        apiKey: '3cbfd37002',
//        fbURL: 'messg',
//        title: 'Ben'
//    });
//});


