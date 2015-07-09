/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.message', ['firebase']);

myApp.factory('Message', ['$rootScope', '$q', '$sce','UserStore', 'User', 'Config', 'Time', 'CloudImage',
    function ($rootScope, $q, $sce, UserStore, User, Config, Time, CloudImage) {

        var bMessageSideRight = 'right';
        var bMessageSideLeft = 'left';

        function Message(mid, meta) {

            this.mid = mid;
            this.meta = meta;

            // Which side is the message on? 'left' or 'right'?
            this.side = null;
            this.timeString = null;
            this.user = null;

            this.read = false;

            if(meta) {

                if(!meta.type) {
                    meta.type = bMessageTypeText;
                }

                if(meta.type == bMessageTypeImage) {
                    // Get the image and thumbnail URLs
                    var parts = meta.text.split(',');
                    if(parts.length >= 3) {
                        var url = parts[0];
                        this.thumbnailURL = CloudImage.cloudImage(url, 200, 200);
                        this.imageURL = url;
                    }
                }

                // Our messages are on the right - other user's messages are
                // on the left
                this.side = this.meta.uid == $rootScope.user.meta.uid ? bMessageSideRight : bMessageSideLeft;

                this.timeString = Time.formatTimestamp(meta.time, Config.clockType);

                // Set the user
                if(this.meta.uid) {

                    // We need to set the user here
                    if(this.meta.uid == $rootScope.user.meta.uid) {
                        this.user = $rootScope.user;
                    }
                    else {
                        this.user = UserStore.getOrCreateUserWithID(this.meta.uid);
                    }
                }
            }
        }

        Message.prototype = {

            markRead: function (uid) {
                this.read = true;
            },

            serialize: function () {
                return {
                    meta: this.meta,
                    mid: this.mid,
                    read: this.read
                }
            },

            deserialize: function (sm) {
                this.mid = sm.mid;
                this.meta = sm.meta;
                this.read = sm.read;
            },

            shouldHideUser: function (nextMessage) {
                return this.meta.uid == nextMessage.meta.uid;
            },

            shouldHideDate: function (nextMessage) {
                // Last message date
                var lastDate = new Date(nextMessage.meta.time);
                var newDate = new Date(this.meta.time);

                // If messages have the same day, hour and minute
                // hide the time
                return lastDate.getDay() == newDate.getDay() && lastDate.getHours() == newDate.getHours() && lastDate.getMinutes() == newDate.getMinutes();
            }

        };

        // Static methods

        Message.buildMeta = function (rid, uid, text, type) {
            return {
                meta: {
                    rid: rid,
                    uid: uid,
                    time: Firebase.ServerValue.TIMESTAMP,
                    text: text,
                    type: type
                }
            };
        };

        return Message;
}]);