import * as angular from 'angular'
import './filters'
import './services'
import './directives'
import './controllers'

import '../controllers/index'
import '../services/index'
import '../directives/index'
import '../filters/index'
import '../entities/index'
import '../network/index'
import '../connectors/index'
import '../persistence/index'

// Declare app level module which depends on filters, and services
export let myApp = angular.module('myApp',
    [
        'myApp.filters',
        'myApp.services',
        'myApp.directives',
        'myApp.controllers',
        require('angular-sanitize'),
    ]
).config(['$sceDelegateProvider', '$provide', ($sceDelegateProvider, $provide) => {
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

    $provide.decorator('$browser', ['$delegate', ($delegate) => {
        $delegate.onUrlChange = () => {};
        $delegate.url = () => {
            return "";
        };
        return $delegate;
    }]);
}]);

// angular.bootstrap(document.getElementById("cc-app"), ['myApp']);


