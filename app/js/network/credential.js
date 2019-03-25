angular.module('myApp.services').factory('Credential', [
    function () {

        function Credential () {}

        Credential.prototype = {

            Email: "email",
            Facebook: "facebook",
            Twitter: "twitter",
            Google: "google",
            Github: "github",
            Anonymous: "anonymous",
            CustomToken: "custom",

            emailAndPassword: function(email, password) {
                this.email = email;
                this.password = password;
                this.type = this.Email;
                return this;
            },

            facebook: function() {
                this.type = this.Facebook;
                return this;
            },

            twitter: function() {
                this.type = this.Twitter;
                return this;
            },

            google: function() {
                this.type = this.Google;
                return this;
            },

            github: function () {
                this.type = this.Github;
                return this;
            },

            anonymous: function () {
                this.type = this.Anonymous;
                return this;
            },

            customToken: function (token) {
                this.token = token;
                this.type = this.CustomToken;
                return this;
            },

            getEmail: function () {
                return this.email;
            },

            getPassword: function () {
                return this.password;
            },

            getToken: function () {
                return this.token;
            },

            getType: function () {
                return this.type;
            }

        };

        return Credential;
    }]);