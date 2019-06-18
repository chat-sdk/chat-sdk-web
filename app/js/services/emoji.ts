import * as angular from 'angular'
import {AllEmojiNames} from "../keys/all-emojis";

angular.module('myApp.services').factory('Emojis', [function () {
        return {

            store: [],

            getEmojis: function () {
                if(!this.store.length) {
                    for(var i = 0; i < 50; i++) {
                        this.store.push(":" + AllEmojiNames[i] + ":");
                    }
                }
                return this.store;
            }
        };
}]);


