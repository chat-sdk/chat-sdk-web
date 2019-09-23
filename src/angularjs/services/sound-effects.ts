import * as angular from 'angular';
import { Howl } from 'howler';

import { ILocalStorage } from '../persistence/local-storage';
import { IEnvironment } from './environment';

export interface ISoundEffects {
  muted: boolean;
  messageReceived(): void;
  toggleMuted(): boolean;
}

class SoundEffects implements ISoundEffects {

  static $inject = ['LocalStorage', 'Environment'];

  messageReceivedSoundNumber = 1;
  muted = this.LocalStorage.isMuted();

  constructor(
    private LocalStorage: ILocalStorage,
    private Environment: IEnvironment,
  ) { }

  messageReceived() {
    if (this.muted) {
      return;
    }
    if (this.messageReceivedSoundNumber == 1) {
      this.alert1();
    }
  }

  alert1() {
    let sound = new Howl({
      src: [this.Environment.audioURL() + 'alert_1.mp3']
    });
    sound.play();
  }

  toggleMuted() {
    this.muted = !this.muted;
    this.LocalStorage.setMuted(this.muted);
    return this.muted;
  }

}

angular.module('myApp.services').service('SoundEffects', SoundEffects);
