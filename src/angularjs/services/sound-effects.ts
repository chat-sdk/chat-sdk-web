import * as angular from 'angular';
import { Howl, Howler } from 'howler';

export interface ISoundEffects {
    messageReceived(): void;
}

angular.module('myApp.services').factory('SoundEffects', ['LocalStorage', 'Environment', function (LocalStorage, Environment) {
    return {

        messageReceivedSoundNumber: 1,
        muted: LocalStorage.isMuted(),

        messageReceived: function () {
            if(this.muted) {
                return;
            }
            if(this.messageReceivedSoundNumber == 1) {
                this.alert1();
            }
        },

        alert1: function () {
            let sound = new Howl({
                src: [Environment.audioURL() + 'alert_1.mp3']
            });
            sound.play();
        },

        toggleMuted: function () {
            this.muted = !this.muted;
            LocalStorage.setMuted(this.muted);
            return this.muted;
        }
    };
}]);