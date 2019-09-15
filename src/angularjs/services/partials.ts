import * as angular from 'angular';

import { IEnvironment } from './environment';

export interface IPartials {

}

class Partials implements IPartials {

    static $inject = ['$http', '$templateCache', 'Environment'];

    constructor(
        private $http: ng.IHttpService,
        private $templateCache: ng.ITemplateCacheService,
        private Environment: IEnvironment,
    ) { }

    load() {
        const $http = this.$http;
        const Environment = this.Environment;
        const $templateCache = this.$templateCache;

        $http.get(Environment.partialsURL() + 'chat-room.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'chat-room-embed.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'chat-settings.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'countries-select.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'create-room-box.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'emojis.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'login-box.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'main-box.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'notification.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'profile-box.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'profile-settings-box.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'room-description.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'room-list.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'room-list-box.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'user-list.html', { cache: $templateCache });
        $http.get(Environment.partialsURL() + 'year-of-birth-select.html', { cache: $templateCache });
    }

}

angular.module('myApp.services').service('Partials', Partials);
