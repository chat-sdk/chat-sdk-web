import * as angular from 'angular';

function InterpolateFilter(version: string): ng.IFilterFunction {
    return (input: string) => {
        return String(input).replace(/\%VERSION\%/mg, version);
    }
}

module InterpolateFilter {
    export const $inject = ['version'];
}

angular.module('myApp.filters').filter('interpolate', InterpolateFilter);
