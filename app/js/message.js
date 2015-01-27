/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

var myApp = angular.module('myApp.message', ['firebase']);

myApp.factory('Message', ['$rootScope', '$q', '$sce','UserCache', 'User', 'Config', 'Time',
    function ($rootScope, $q, $sce, UserCache, User, Config, Time) {
    var message = {

        newMessage: function (rid, uid, text) {

            return {
                meta: {
                    rid: rid,
                    uid: uid,
                    time: Firebase.ServerValue.TIMESTAMP,
                    text: text
                }
            };
        },

        buildMessage: function (mid, meta) {

            var message = {
                meta : meta,
                mid: mid
            };

            if(meta) {
                // Our messages are on the right - other user's messages are
                // on the left
                message.side = message.meta.uid == $rootScope.user.meta.uid ? 'right' : 'left';

                message.timeString = Time.formatTimestamp(meta.time, Config.clockType);

                // Set the user
                if(message.meta.uid) {

                    // We need to set the user here
                    if(message.meta.uid == $rootScope.user.meta.uid) {
                        message.user = $rootScope.user;
                    }
                    else {
                        message.user = UserCache.getOrCreateUserWithID(message.meta.uid);
                    }
                }
            }

            message.markRead = function (uid) {

                if(!uid) {
                    uid = $rootScope.user.meta.uid;
                }

                var deferred = $q.defer();

                // Is this message already marked as read?
                if(message.readBy()) {
                    deferred.resolve();
                }
                else if(!uid) {
                    deferred.reject();
                }
                else {
//                    var ref = Paths.messageUsersRef(message.meta.rid, message.mid).child(uid);
//
//                    var data = {};
//                    data[bReadKey] = true;
//
//                    ref.set(data, function (error) {
//                        if(error) {
//                            deferred.reject(error);
//                        }
//                        else {
//                            deferred.resolve();
//                        }
//                    });
                    message.read = true;
                }

                return deferred.promise;
            };

            message.serialize = function () {
                return {
                    meta: message.meta,
                    mid: message.mid,
                    read: message.read
                }
            };

            message.deserialize = function (sm) {
                message.mid = sm.mid;
                message.meta = sm.meta;
                message.read = sm.read;
            };

            message.shouldHideUser = function (nextMessage) {
                return message.meta.uid == nextMessage.meta.uid;
            };

            message.shouldHideDate = function (nextMessage) {
                // Last message date
                var lastDate = new Date(nextMessage.meta.time);
                var newDate = new Date(message.meta.time);

                // If messages have the same day, hour and minute
                // hide the time
                return lastDate.getDay() == newDate.getDay() && lastDate.getHours() == newDate.getHours() && lastDate.getMinutes() == newDate.getMinutes();
            };

            message.readBy = function () {

                // TODO: Legacy code - to be removed after update
                var uid = $rootScope.user.meta.uid;
                if(message.meta.users) {
                    !unORNull(message.meta.users[uid]) && !unORNull(message.meta.users[uid][bReadKey]);
                }
                else {
                    return message.read;
                }
            };

            return message;
        }


    };
    return message;
}]);