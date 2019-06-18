import * as angular from 'angular'
angular.module('myApp.services').factory('Partials', ['$http', '$templateCache', 'Environment', function ($http, $templateCache, Environment) {
    return {
        load: function () {
            $http.get(Environment.partialsURL() + 'chat-room.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'chat-room-embed.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'chat-settings.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'countries-select.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'create-room-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'emojis.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'login-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'main-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'notification.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'profile-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'profile-settings-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'room-description.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'room-list.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'room-list-box.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'user-list.html', {cache:$templateCache});
            $http.get(Environment.partialsURL() + 'year-of-birth-select.html', {cache:$templateCache});
        }
    };
}]);