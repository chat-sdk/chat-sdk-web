angular.module('myApp.services').factory('WebStorage', ['$window', function ($window) {
    'use strict';
    var WebStorage = {

        ls: null,
        key: 'cc_web_storage_',
        store: {},
        cacheCleared: false,

        init: function () {
            var localStorage = this.localStorage();
            if(!localStorage) {
                return;
            }

            // Load the items from the store
            var key = null;
            for (var i = 0, k; i < localStorage.length; i++) {
                key = localStorage.key(i);
                if(key.slice(0, this.key.length) === this.key) {
                    this.store[key.slice(this.key.length)] = angular.fromJson(localStorage.getItem(key));
                }
            }

            return this;
        },

        sync: function () {
            angular.forEach(this.store, (function (value, key) {
                if(angular.isDefined(value) && key.length && '$' !== key[0]) {
                    try {
                        this.localStorage().setItem(this.key + key, angular.toJson(value));
                    }
                    catch(e) {
                        // TODO: Handle this
                        console.log("Warning! Storage error " + e.description);
                    }
                }
            }).bind(this));
        },

        setProperty: function (key, value) {
            if(key && key.length && key[0] !== '$') {
                this.store[key] = value;
            }
        },

        getProperty: function (key) {
            return this.store[key];
        },

        localStorage: function () {
            if(!this.ls) {
                this.ls = $window['localStorage'];
            }
            return this.ls;
        },

        localStorageSupported: function () {
            return this.localStorage() != null;
        }


    };
    return WebStorage.init();
}]);