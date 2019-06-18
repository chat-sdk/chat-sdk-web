import * as angular from 'angular'

import '../app/controllers'
import '../app/directives'
import '../app/filters'
import '../app/services'

// Declare app level module which depends on filters, and services
export let myApp = angular.module('myApp',
    [
        'myApp.filters',
        'myApp.services',
        'myApp.directives',
        'myApp.controllers',
        require('angular-sanitize')
    ]
).config(['$sceDelegateProvider', '$provide', function($sceDelegateProvider, $provide) {
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        'https://chatcatio.firebaseapp.com/partials/**',
        'https://chatcatio-test.firebaseapp.com/partials/**',
        'https://chatcat.firebaseapp.com/partials/**',
        'http://chatcatio.firebaseapp.com/partials/**',
        'http://chatcatio-test.firebaseapp.com/partials/**',
        'http://chatcat.firebaseapp.com/partials/**',
        'http://chatcat/dist_test/partials/**',
        'http://chatcat/dist/partials/**'
        // TODO: Put this back in
        // 'https://' + ChatSDKOptions.firebaseConfig.authDomain + '/partials/**'
    ]);

    $provide.decorator('$browser', ['$delegate', function ($delegate) {
        $delegate.onUrlChange = function () {};
        $delegate.url = function () {
            return "";
        };
        return $delegate;
    }]);
}]).run(['Config', 'Environment', function (Config, Environment) {
    Config.setConfig(Config.setByInclude, Environment.options());
}]);

angular.bootstrap(document.getElementById("cc-app"), ['myApp']);


