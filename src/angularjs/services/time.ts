import * as angular from 'angular';
import * as firebase from 'firebase';
import * as moment from 'moment';

import { IPaths } from '../network/paths';

export interface ITime {
  formatTimestamp(timestamp: number, type?: string): string;
  now(): number;
  start(uid: string): Promise<any>;
}

class Time implements ITime {

  static $inject = ['$q', 'Paths'];

  localTime = null;
  remoteTime = null;
  uid: string = null;
  working = false;

  constructor(
    private $q: ng.IQService,
    private Paths: IPaths,
  ) { }

  async start(uid: string): Promise<any> {

    if (this.remoteTime && uid == this.uid) {
      return Promise.resolve();
    }

    this.working = true;

    let ref = this.Paths.timeRef(uid);
    try {
      await ref.set(firebase.database.ServerValue.TIMESTAMP);
      return ref.once('value', (snapshot) => {
        this.working = false;
        if (snapshot.val()) {
          this.impl_setTime(snapshot.val(), uid);
          return this.remoteTime;
        }
      });
    }
    catch (error) {
      this.working = false;
    }
  }

  impl_setTime(remoteTime: number, uid: string) {
    this.remoteTime = remoteTime;
    this.uid = uid;
    this.working = false;
  }

  now(): number {
    if (this.remoteTime) {
      return new Date().getTime() - this.localTime + this.remoteTime;
    }
    return null;
  }

  secondsSince(time: number): number {
    return Math.abs(this.now() - time) / 1000;
  }

  formatTimestamp(timestamp: number, type?: string): string {
    try {
      if (type == '24hour') {
        return moment(timestamp).format('HH:mm');
      }
      else {
        return moment(timestamp).format('h:mm a');
      }
    }
    // In some cases (maktab.pk) a javascript conflict seems to stop moment working
    // TODO: Investigate this
    catch (e) {
      const date = new Date(timestamp);
      // hours part from the timestamp
      const hours = date.getHours();
      // minutes part from the timestamp
      const minutes = "0" + date.getMinutes();
      // will display time in 10:30:23 format
      return hours + ':' + minutes.substr(minutes.length - 2);
    }
  }

}

angular.module('myApp.services').service('Time', Time);
