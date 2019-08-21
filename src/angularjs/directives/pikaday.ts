import * as angular from 'angular'
import * as Pikaday from 'Pikaday'

// Not used now - was used to show date of birth picker
angular.module('myApp.directives').directive('pikaday', ["$rootScope", function ($rootScope) {
    return function (scope, element, attr) {

        new Pikaday({
            field: element[0],
            firstDay: 1,
            minDate: new Date('1920-01-01'),
            maxDate: new Date(),
            defaultDate: new Date('1990-01-01'),
            onSelect: function (date) {
            }
        });

    };
}]);
