'use strict';

/* Filters */

var myApp = angular.module('myApp.filters', []);

myApp.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]);

