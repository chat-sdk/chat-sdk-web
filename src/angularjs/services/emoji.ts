import * as angular from 'angular'
import {AllEmojiNames} from "../keys/all-emojis";

export interface IEmoji {
    getEmojis() : string[]
}

export class Emoji implements IEmoji {

    private store: string [] = [];

    getEmojis() : string[] {
        if (!this.store.length) {
            for(let i = 0; i < 50; i++) {
                this.store.push(":" + AllEmojiNames[i] + ":");
            }
        }
        return this.store;
    }

}

angular.module('myApp.services').service('Emoji', Emoji);

