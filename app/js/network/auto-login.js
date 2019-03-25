angular.module('myApp.services').factory('AutoLogin', [, function () {
    return {

        //// Is there a valid get token in the URL?
        //var pairs = $window.location.search.replace("?", "").split("&");
        //for(var i = 0; i < pairs.length; i++) {
        //    var values = pairs[i].split("=");
        //    if(values.length == 2) {
        //        if(values[0] == "cc_token") {
        //            this.getToken = values[1];
        //            this.mode = bLoginModeToken;
        //            break;
        //        }
        //    }
        //}
        //
        //if(!this.getToken) {
        //    // Setup the login and register URLs
        //    var ssoURL = Config.singleSignOnURL;
        //    if(ssoURL && ssoURL.length > 0) {
        //        this.mode = bLoginModeSingleSignOn;
        //    }
        //
        //}

    }
}]);