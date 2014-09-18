'use strict';


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', [
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).config(['$sceDelegateProvider', function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        'https://chatcatio.firebaseapp.com/partials/**',
        'https://chatcatio-test.firebaseapp.com/partials/**',
        'https://chatcat.firebaseapp.com/partials/**'
    ]);

    // The blacklist overrides the whitelist so the open redirect here is blocked.
//    $sceDelegateProvider.resourceUrlBlacklist([
//        'http://myapp.example.com/clickThru**'
//    ]);
}]);

