/**
 * Created by benjaminsmiley-andrews on 19/07/17.
 */
var myApp = angular.module('myApp.firebase', ['firebase']).
    value('version', '0.1');

myApp.factory('FirebaseUploadHandler', ['$q', 'firebase', function ($q, firebase) {
    return {
        uploadFile: function(file) {
            let deferred = $q.defer();

            // Create a root reference
            let storageRef = firebase.storage().ref();

            // Create a reference to 'mountains.jpg'
            let ref = storageRef.child('web/'+ this.uuid() +'.jpg');

            ref.put(file).then(function(snapshot) {
                ref.getDownloadURL().then(function(downloadURL) {
                    console.log('File available at', downloadURL);
                    deferred.resolve(downloadURL);
                });
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
