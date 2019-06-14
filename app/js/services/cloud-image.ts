angular.module('myApp.services').factory('CloudImage', ['Environment',function (Environment) {
    return {
        // Cloud Image
        cloudImageToken: Environment.cloudImageToken(),

        cloudImage: function(url, w, h) {
            return 'http://' + this.cloudImageToken + '.cloudimg.io/s/crop/'+w+'x'+h+'/' + url;
        }

    };
}]);
