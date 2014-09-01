/**
 * Created with JetBrains PhpStorm.
 * User: benjaminsmiley-andrews
 * Date: 08/05/2014
 * Time: 17:47
 * To change this template use File | Settings | File Templates.
 */

var CF_NETWORK_FACEBOOK  = 1;
var CF_NETWORK_TWITTER   = 2;
var CF_NETWORK_ANONYMOUS = 3;
var CF_NETWORK_GITHUB    = 4;
var CF_NETWORK_GOOGLE    = 5;
var CF_NETWORK_EMAIL    = 6;

var CF_USERS_PATH = "users";

var CF_USER_NAME = "name";
var CF_USER_PICTURE = "picture";
var CF_USER_CITY = "city";
var CF_USER_COUNTRY = "country";
var CF_USER_YEAR_OF_BIRTH = "yearOfBirth";
var CF_USER_GENDER = "gender";

var User = {

    loggedIn:    false,
    uid:         null,
    safeUID:     null,
    name:        null,
    network:     null,
    picture:     null,
    city:        null,
    country:     null,
    yearOfBirth: null,
    gender:      null,

    authenticate: function() {
        this.auth = new FirebaseSimpleLogin(FirebaseManager._firebase,function(error,user){

            if(error) {
                // Something went wrong during login!
                Campfire.debug(CF_DEBUG_QUIET,error);
            }
            else if (user) {
                console.log('User ID: ' + user.uid + ', Provider: ' + user.provider);
                self.uid = user.uid;
                self.loggedIn = true;

                safeUID = this.uid.replace(':','-');

                // TODO: why can't we use self?
                User.select();

            }
            else {
                self.uid = null;
                self.loggedIn = false;
                Campfire.showMenu();
            }
        })
    },

    loginWithPassword: function (email, password) {
        this.auth.login('password',{
            email: email,
            password: password
        });
    },

    registerWithPassword: function(email, password) {

        console.log("Will register user: "+email+", "+password);

        this.auth.createUser(email, password, function(error, user) {
            if(error) {
                console.log(error);
            }
            else {
                console.log(user);
            }
        });
    },

    login: function (network) {

        if(loggedIn) {
            return;
        }

        switch (network) {
            case CF_NETWORK_FACEBOOK:
                this.auth.login('facebook',{
                    rememberMe: true,
                    scope: 'basic_info,user_photos'
                });
                break;
            case CF_NETWORK_TWITTER:
                this.auth.login('twitter',{
                    rememberMe: true
                });
                break;
            case CF_NETWORK_GUEST:
                this.auth.login('anonymous');
                //Campfire.loginAsGuest();
                break;
        }
    },

    logout: function () {
        this.auth.logout();
        this.uid = null;
        this.loggedIn = false;
        Campfire.hideSettings();
    },

    push: function() {

    },

    select: function() {
        // Check if the user already has an account on Firebase
        FirebaseManager._firebase.child(CF_USERS_PATH).child(safeUID).once('value', function(snapshot) {

            if(!snapshot.value) {
                Campfire.showSettings();
                return;
            }

            var name = snapshot.value[CF_USER_NAME];
            if(name) {
                self.name = name;
            }
            var picture = snapshot.value[CF_USER_PICTURE];
            if(picture) {
                self.picture = picture;
            }
            var city = snapshot.value[CF_USER_CITY];
            if(city) {
                self.city = city;
            }
            var country = snapshot.value[CF_USER_COUNTRY];
            if(country) {
                self.country = country;
            }
            var yearOfBirth = snapshot.value[CF_USER_YEAR_OF_BIRTH];
            if(yearOfBirth) {
                self.yearOfBirth = yearOfBirth;
            }
            var gender = snapshot.value[CF_USER_GENDER];
            if(gender) {
                self.gender = gender;
            }

            // Update settings

        });
    },

    isLoggedIn: function() {
        return this.loggedIn;
    }
};