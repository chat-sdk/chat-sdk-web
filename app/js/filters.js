'use strict';

/* Filters */

var myApp = angular.module('myApp.filters', []);

myApp.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]);

myApp.filter('newline', function () {
    return function(text) {
        text = String(text);
        text = text.split("\r").join("<br\>");
        text = text.split("\r\n").join("<br\>");
        text = text.split("\n").join("<br\>");
        text = text.split("&#10;").join("<br\>");
        return text;
    };
});
