/**
 * Created by benjaminsmiley-andrews on 19/07/17.
 */
var myApp = angular.module('myApp.firebase', ['firebase']).
    value('version', '0.1');

myApp.factory('FirebaseUploadHandler', ['$q', function ($q) {
    return {
        uploadFile: function(file) {
            var deferred = $q.defer();

            // Create a root reference
            var storageRef = firebase.storage().ref();

            // Create a reference to 'mountains.jpg'
            var ref = storageRef.child('web/'+ this.uuid() +'.jpg');

            ref.put(file).then(function(snapshot) {
                deferred.resolve(snapshot.downloadURL);
            });

            return deferred.promise;
        },

        uuid: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }

    };
}]);
