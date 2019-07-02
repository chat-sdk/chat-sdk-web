import * as angular from 'angular'
import * as firebase from 'firebase';
import * as moment from 'moment';

export interface ITime {

}

angular.module('myApp.services').factory('Time', ['$q', 'Paths', function ($q, Paths) {
    return {

        localTime: null,
        remoteTime: null,
        uid: null,
        working: false,

        start: function (uid) {

            var deferred = $q.defer();

            if(this.remoteTime && uid == this.uid) {
                deferred.resolve();
                return deferred.promise;
            }

            this.working = true;

            var ref = Paths.timeRef(uid);
            ref.set(firebase.database.ServerValue.TIMESTAMP, (function (error) {
                this.localTime = new Date().getTime();
                if(!error) {
                    ref.once('value', (function (snapshot) {
                        if(snapshot.val()) {
                            this.impl_setTime(snapshot.val(), uid);
                            deferred.resolve(this.remoteTime);
                        }
                        else {
                            deferred.reject();
                        }
                        this.working = false;
                    }).bind(this));
                }
                else {
                    deferred.reject(error);
                    this.working = false;
                }
            }).bind(this));

            return deferred.promise;
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

        formatTimestamp: function (timestamp, type) {
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
                var date = new Date(timestamp);
                // hours part from the timestamp
                var hours = date.getHours();
                // minutes part from the timestamp
                var minutes = "0" + date.getMinutes();
                // will display time in 10:30:23 format
                return hours + ':' + minutes.substr(minutes.length-2);
            }
        }
    }
}]);
