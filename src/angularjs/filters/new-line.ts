import * as angular from 'angular';

function NewLineFilter(): ng.IFilterFunction {
    return (input: string) => {
        let text = String(input);
        text = text.split("\r").join("<br\>");
        text = text.split("\r\n").join("<br\>");
        text = text.split("\n").join("<br\>");
        text = text.split("&#10;").join("<br\>");
        return text;
    }
}

angular.module('myApp.filters').filter('newline', NewLineFilter);
