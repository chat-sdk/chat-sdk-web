angular.module('myApp.filters').filter('newline', function () {
    return function(text) {
        text = String(text);
        text = text.split("\r").join("<br\>");
        text = text.split("\r\n").join("<br\>");
        text = text.split("\n").join("<br\>");
        text = text.split("&#10;").join("<br\>");
        return text;
    };
});