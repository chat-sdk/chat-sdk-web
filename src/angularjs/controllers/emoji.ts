import * as angular from 'angular'


import {Emoji} from "../services/emoji";
import {IRoomScope} from "./chat";

// module app.controllers {

export interface IEmojiController {
    addEmoji(text: string): void
    getEmojis(): string[]
}

class EmojiController implements IEmojiController{

    static $inject = ['Emoji', '$scope'];

    private emoji: Emoji;
    private $scope: IRoomScope;
    private emojis: string[];

    constructor (public Emoji: Emoji, $scope: IRoomScope) {
        this.emoji = Emoji;
        this.$scope = $scope;
        this.emojis = this.getEmojis()
    }

    addEmoji(text: string): void {
        if(!this.$scope.input.text) {
            this.$scope.input.text = ""
        }
        this.$scope.input.text += text
    }

    getEmojis(): string[] {
        return this.emoji.getEmojis()
    }

}

// TODO: Finish this
class EmojiComponent implements ng.IComponentOptions {

    public bindings:any;
    public controller:any;
    public templateUrl:'emojis.html';

    constructor () {
        this.controller = EmojiController
    }

}

angular.module('myApp.controllers').controller('EmojiController', EmojiController);


