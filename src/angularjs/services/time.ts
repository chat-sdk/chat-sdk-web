import * as angular from 'angular'
import * as firebase from 'firebase';
import * as moment from 'moment';

export interface ITime {
    formatTimestamp (timestamp: number, type: string): string
    start(uid): Promise<any>
}

angular.module('myApp.services').factory('Time', ['$q', 'Paths', function ($q, Paths) {
    return {

        localTime: null,
        remoteTime: null,
        uid: null,
        working: false,

        start: function (uid): Promise<any> {

            if(this.remoteTime && uid == this.uid) {
                return Promise.resolve();
            }

            this.working = true;

            let ref = Paths.timeRef(uid);
            return ref.set(firebase.database.ServerValue.TIMESTAMP).then(() => {
                return ref.once('value', (snapshot) => {
                    this.working = false;
                    if(snapshot.val()) {
                        this.impl_setTime(snapshot.val(), uid);
                        return this.remoteTime;
                    }
                });
            }, (error) => {
                this.working = false;
            });
        },

        impl_setTime: function (remoteTime, uid) {
            this.remoteTime = remoteTime;
            this.uid = uid;
            this.working = false;
        },

        now: function () {
            if(this.remoteTime) {
                return new Date().getTime() - this.localTime + this.remoteTime;
            }
            return null;
        },

        secondsSince: function (time) {
            return Math.abs(this.now() - time)/1000;
        },

        formatTimestamp: function (timestamp: number, type: string): string {
            try {
                if(type == '24hour') {
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
                return hours + ':' + minutes.substr(minutes.length-2);
            }
        }
    }
}]);
