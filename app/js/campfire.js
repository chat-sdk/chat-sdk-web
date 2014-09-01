/**
 * Campfire Constants
 */
var CF_ROOM_PERMANENT = 1;
var CF_ROOM_PUBLIC    = 2;
var CF_ROOM_PRIVATE   = 3;

var CF_ANIMATION_DURATION = 300;

var CF_DEBUG_QUIET = 1;
var CF_DEBUG_LOUD  = 2;

var CF_MENU_USERS = 1;
var CF_MENU_ROOMS = 2;

var CF_INTERFACE_STATE_LOGIN = 1;
var CF_INTERFACE_STATE_MENU = 1;
var CF_INTERFACE_STATE_SETTINGS = 1;

var CF_RESOURCES_PATH = "campfire/resources/htm/";
var CF_IMAGE_PATH = "campfire/resources/images/";

var CF_MENU_BOX = "#cf-menu-box";

/**
 * Campfire Singleton
 */
var Campfire = {
    // Configuration
    _api_key: null,
    _fb_url:  null,
    _title:   'Campfire',

    // Firebase API
    _firebase: null,

    // User vars
    //_user_logged:  false,
    _user_id:      null,
    _user_name:    null,
    _user_network: null,
    _user_picture: null,

    // Chat UI Base
    _ui_base: null,

    // Chat status
    _hndlrs:false,
    _menu:  CF_MENU_USERS,
    _users: {},
    _rooms: {},
    _chats: [],
    _cur_chat: null,

    _fade_event: null,

    /**
     * Launch Campfire
     * @param {object} Config values
     */
    launch: function(config) {


        // Verify config values were passed
        if (typeof config == 'undefined') {
            this.debug(CF_DEBUG_LOUD,'No config values were passed to initializer!');
            return;
        }

        // Make sure we have an api key
        if (typeof config.apiKey == 'undefined') {
            this.debug(CF_DEBUG_LOUD,'Missing API key!');
            return;
        } else this._api_key = config.apiKey;

        // Make sure we have a Firebaes url prefix
        if (typeof config.fbURL == 'undefined') {
            this.debug(CF_DEBUG_LOUD,'Missing Firebase URL!');
            return;
        } else this._fb_url = config.fbURL;

        // Set the optional config values
        if (config.title) this._title = config.title;

        // Check API key and get customer settings
        $.getJSON('http://localhost/campfirejs/src/server/'+this._api_key,function(data){
            if (data.status == 'error') {
                Campfire.debug(CF_DEBUG_LOUD,data.details);
                return;
            }
            // get settings
        });

        // Create the Firebase API object
        this._firebase = new Firebase('https://'+this._fb_url+'.firebaseio.com/cust-'+this._api_key);

        User.authenticate();

        // Get user session data
//        var cookieData = document.cookie;
//        if (cookieData != '') {
//
//            // Show the logging in message
//            $('.cf-social').hide();
//            $('#cf-logging-in').show();
//
//            // Iterate thru the cookie values and get the required values
//            var cookieData = cookieData.split(';');
//            for (var i in cookieData) {
//                var token = cookieData[i].trim();
//                var property = token.substr(0,token.indexOf('='));
//                var value    = token.substr(token.indexOf('=')+1);
//                switch (property) {
//                    case 'cfsess':   this._user_id      = value; break;
//                    case 'username': this._user_name    = value; break;
//                    case 'network':  this._user_network = value; break;
//                    case 'picture':  this._user_picture = value; break;
//                }
//            }
//
//            // If all the required cookie values are set, proceed to check the server for the user
//            if (this._user_id !== null && this._user_name !== null && this._user_network !== null)
//                this._firebase.child('users/'+this._user_id).once('value',function(data){
//                    if (data.val() !== null) {
//                        // Got the user! Start the chat!
//                        Campfire._user_logged = true;
//                        $('#cf-menu-id-img').attr('src',data.val().picture);
//                        var curtime = Math.floor(new Date().getTime()/1000);
//                        Campfire._firebase.child('users/'+Campfire._user_id+'/lastact').set(curtime);
//                        $('#cf-login-box').hide();
//                        Campfire.attachFbHandlers();
//                    } else {
//                        // Uh oh! The user has been cleared off the server due to inactivity
//                        // Let them log in again...
//                        $('#cf-logging-in').hide();
//                        $('.cf-social').show();
//                        document.cookie = 'cfsess=';
//                        document.cookie = 'username=';
//                        document.cookie = 'network=';
//                        document.cookie = 'picture=';
//                    }
//                });
//        }

        // Create the chat UI after the rest of the page is loaded
        $(document).ready(function(){
            Campfire.startUI();
        });
    },

    /**
     * Create the user interface elements
     */
    startUI: function() {

        // Create the base UI element
        this._ui_base = $('<div id="cf-base"/>');

        // Create the main menu
        $('<div id="cf-menu-bar" class="cf-menu-bar"/>')
            // TODO: Change this img src to non example relative
            .append('<img id="cf-menu-bar-img" src="campfire/resources/images/cf-menu.png" width="29" height="29" />')
            .append('<div id="cf-menu-bar-title">'+this._title+'</div>')
            .click(function(){Campfire.showMenu();})
            .appendTo(this._ui_base);

        $('<div id="cf-menu-box"/>')
            .append('<div id="cf-menu-tabs">\
                         <a href="#" class="cf-menu-tab cf-menu-tab-active" id="cf-menu-tab-users" onclick="Campfire.switchMenuTab(CF_MENU_USERS)">Users</a>\
                         <a href="#" class="cf-menu-tab" id="cf-menu-tab-rooms" onclick="Campfire.switchMenuTab(CF_MENU_ROOMS)">Chat Rooms</a>\
                         <a href="#" id="cf-menu-hide" title="Hide Main Menu" onclick="Campfire.hideMenu()"><img src="campfire/resources/images/cf-hide.png" width="27" height="27" /></a>\
                     </div>')
            .append('<div id="cf-menu-search">\
                         <input id="cf-menu-search-txt" placeholder="Search" />\
                         <a href="#" id="cf-menu-shutdown" title="Shutdown Chat" onclick="Campfire.shutdown()">\
                             <img src="campfire/resources/images/cf-shutdown.png" width="30" height="30" />\
                         </a>\
                     </div>')
            .append('<div id="cf-menu-list"></div>')
            .append('<div id="cf-menu-id">\
                         <img src="" width="30" height="30" id="cf-menu-id-img" />\
                         <div id="cf-menu-id-name">'+this._user_name+'</div>\
                         <a href="#" title="Settings" style="float: right" onclick="Campfire.showSettings()"><img src="campfire/resources/images/cf-settings.png" width = "30" height = "30"/></a>\
                     </div>')
            .appendTo(this._ui_base);


        // Create a profile picture
        var facebookButton = new LoginButton("Facebook", "cf-facebook.png", "Campfire.login(CF_NETWORK_FACEBOOK)");
        var twitterButton = new LoginButton("Twitter", "cf-twitter.png", CF_NETWORK_TWITTER);
        var guestButton = new LoginButton("Guest", "cf-user.png", CF_NETWORK_ANONYMOUS);
        //var gitHubButton = new LoginButton("GitHub", "cf-user.png", CF_NETWORK_GITHUB);

        // Create the login box
//        $('<div id="cf-login-box"/>')
//            .append('\
//            <div id="cf-login-header">'+this._title+' Login</div>\
//            <div id="cf-login-form">\
//                 <div id="cf-logging-in">Logging in...</div>\
//                 <a class="cf-social" href="#" title="Facebook" onclick="User.login(CF_NETWORK_FACEBOOK)" style="margin-left: 40px;"><img class="cf-profile-pic"  src="campfire/resources/images/cf-facebook.png" width="40" height="40" /></a>\
//                 '+twitterButton.html()+'\
//                 '+guestButton.html()+'\
//            </div>\
//            ')
//            .appendTo(this._ui_base);

        $('<span id="cf-profile-login-box-here"/>').appendTo(this._ui_base);



        $('<span id="cf-profile-settings-box-here"/>').appendTo(this._ui_base);


        // Create the chat box

        // Create the profile fade in / fade out box
        $('<div id="cf-profile-box"/>').append('\
            <img src="" width="50" height="50" id="cf-profile-img" /><div id="cf-profile-user"></div> \
            <div class="cf-profile-lbl">Network</div><div class="cf-profile-val" id="cf-profile-network"></div>\
            <div class="cf-profile-lbl" id="cf-profile-gender-lbl">Gender</div><div class="cf-profile-val" id="cf-profile-gender"></div>\
            <div class="cf-profile-lbl">Location</div><div class="cf-profile-val" id="cf-profile-location"></div>\
        ').mouseenter(function(){
            clearTimeout(Campfire._fade_event);
        }).mouseleave(function(){
            Campfire._fade_event = setTimeout(function(){
                $('#cf-profile-box').fadeOut(250);
            },250);
        }).appendTo(this._ui_base);

        // Attach the UI to the DOM
        this._ui_base.appendTo('body');

        // Add the profile settings pane
//        $.get("campfire/resources/htm/profile-settings.html", function(data) {
//            $(data).insertAfter($('#cf-profile-settings-box-here'));
//        });

        LoginBox.loadHTML(function(data) {
            $(data).insertAfter("#cf-profile-login-box-here");

            LoginBox.loadSubHTML(function() {

            });
        });

        // First load the main settings page
        ProfileSettings.loadHTML(function(data) {

            // Then add the settings page to the main element
            $(data).insertAfter($('#cf-profile-settings-box-here'));

            // Then load the sub html elemetns
            ProfileSettings.loadSubHTML(function() {
                ProfileSettings.setName("test");
                ProfileSettings.setDescription("desc");
                ProfileSettings.setGender("F");
                ProfileSettings.setYOB("1980");
                ProfileSettings.setCity("London");
                ProfileSettings.setCountry("GB");
                //ProfileSettings.setImage(CF_IMAGE_PATH+"cf-user.png");
            });
        });


//        $("#cf-profile-settings-box-here").blurjs({
//            source: 'body',
//            radius: 100
//        });

        $("#cf-logout-button").click(function () {
            alert("logout");
        });

        // User/room search feature
        $('#cf-menu-search-txt').keyup(function(e){
            // Get the query string
            var query = ($('#cf-menu-search-txt').val()).toLowerCase();

            // What mode is the menu in?
            if (Campfire._menu === CF_MENU_USERS) {
                if (query.length === 0)
                    Campfire.listUsers();
                else {
                    $('#cf-menu-list').html('');
                    for (var i in Campfire._users)
                        if (Campfire._users[i].name.toLowerCase().indexOf(query) !== -1)
                            Campfire.addUserToList(i);
                }
            } else {
                if (query.length === 0)
                    Campfire.listRooms();
                else {
                    $('#cf-menu-list').html('');
                    for (var i in Campfire._rooms)
                        if (Campfire._rooms[i].name.toLowerCase().indexOf(query) !== -1)
                            Campfire.addRoomToList(i);
                }
            }
        });

        // Set shutdown event
        $('#cf-menu-shutdown').click(function(){
            $('#cf-base').hide();
        });
    },

    setInterfaceState: function(state) {

        var loginBox = $(CF_LOGIN_BOX);

        if(state == CF_INTERFACE_STATE_LOGIN) {

        }
        if(state == CF_INTERFACE_STATE_MENU) {

        }
        if(state == CF_INTERFACE_STATE_SETTINGS) {

        }
    },

    /**
     * Show the user settings panel
     */
    showSettings: function() {
        $("#cf-profile-settings-box").show();
        //$("#cf-menu-box").hide();
        this.hideMenu();
    },

    hideSettings: function() {
        $("#cf-profile-settings-box").hide();
        this.showMenu();
//        $("#cf-menu-box").hide();
    },

    /**
     * Attach base event handlers to Firebase object
     */
    attachFbHandlers: function() {
        // Only attach listeners once
        if (this._hndlrs === true)
            return;
        else
            this._hndlrs = true;

        // User entered the chat
        this._firebase.child('users').on('child_added',function(data){

            // Add user to the storage array
            Campfire._users[data.name()] = data.val();

            // Add the user to the menu list
            if (Campfire._menu === CF_MENU_USERS)
                Campfire.addUserToList(data.name());
        });

        // User left the chat
        this._firebase.child('users').on('child_removed',function(data){

            // Remove the user from the storage array
            delete Campfire._users[data.name()];

            // Remove the user from the menu list
            if (Campfire._menu === CF_MENU_USERS)
                Campfire.removeUserFromList(data.name());
        });

        // Chat room was added to Firebase
        this._firebase.child('rooms').on('child_added',function(data){

            // Add the chat room to the storage array
            Campfire._rooms[data.name()] = data.val();

            // Is someone trying to chat with us?
            if (data.val().members.indexOf(Campfire._user_id) !== -1) {
                Campfire.openRoom(data.name());
            }

            // Add the chat room to the menu list
            if (Campfire._menu === CF_MENU_ROOMS)
                Campfire.addRoomToList(data.name());
        });

        // Chat room was removed from Firebase
        this._firebase.child('rooms').on('child_removed',function(data){

            // Remove the room from the storage array
            delete Campfire._rooms[data.name()];

            // Close the chat window if its open
            if (Campfire._chats.indexOf(data.name()) !== -1)
                Campfire.closeRoom(data.name());

            // Remove the room from the menu list
            if (Campfire._menu === CF_MENU_ROOMS)
                Campfire.removeRoomFromList(data.name());
        });
    },

    /**
     * Show the login modal and handle response
     */
    login: function(network) {
        // Create the simple login model
        var auth = new FirebaseSimpleLogin(this._firebase,function(error,user){
            // Handle login response
            if (error) {
                // Something went wrong during login!
                Campfire.debug(CF_DEBUG_QUIET,error);
            } else if (user) {
                // User has logged in!
                // Reformat the unique user id (cant have colon)
                var uid = user.uid;
                uid = uid.replace(':','-');
                var displayName = user.displayName;
                var nameHasSpace = displayName.indexOf(' ');
                if (nameHasSpace !== -1) {
                    displayName = displayName.substr(0,nameHasSpace) + ' ' + displayName.substr(nameHasSpace+1,1);
                }
                var gender;
                var location;
                var picture;
                var curtime = Math.floor(new Date().getTime()/1000);

                switch (user.provider) {
                    case 'facebook':
                        gender = user.thirdPartyUserData.gender;
                        location = user.thirdPartyUserData.location.name;
                        picture = 'campfire/resources/images/cf-user.png';
                        break;
                    case 'twitter':
                        gender = null;
                        location = user.thirdPartyUserData.location;
                        picture = user.thirdPartyUserData.profile_image_url_https ? user.thirdPartyUserData.profile_image_url_https : 'campfire/resources/images/cf-user.png';
                        break;
                }

                // Set some cookie values
                document.cookie = 'cfsess='+uid;
                document.cookie = 'network='+user.provider;
                document.cookie = 'username='+displayName;
                document.cookie = 'picture='+picture;

                // Set the user values
                Campfire._user_id = uid;
                Campfire._user_network = user.provider;
                Campfire._user_name = displayName;
                Campfire._user_picture = picture;
                Campfire._user_logged = true;

                // Add user to Firebase user list.. this will trigger update on other users
                Campfire._firebase.child('users').child(uid).set({
                    name: displayName,
                    gender: gender,
                    location: location,
                    picture: picture,
                    lastact: curtime,
                    network: {
                        id: user.id,
                        provider: user.provider
                    }
                });

                // Hide the login box, show the main menu
                $('#cf-login-box').hide();
                $('#cf-menu-id-img').attr('src',picture);
                $('#cf-menu-id-name').html(displayName);
                $('#cf-menu-box').show();

                // Attach root Firebase listeners
                Campfire.attachFbHandlers();
            }
        });

        switch (network) {
            case CF_NETWORK_FACEBOOK:
                auth.login('facebook',{
                    rememberMe: true,
                    scope: 'basic_info,user_photos'
                });
                break;
            case CF_NETWORK_TWITTER:
                auth.login('twitter',{
                rememberMe: true
                });
                break;
            case CF_NETWORK_ANONYMOUS:
                Campfire.loginAsGuest();
                break;
        }
    },

    loginAsGuest: function() {
        var id = this.genRoomID();
        var uid = 'guest-'+id;
        var displayName = 'Guest '+Math.floor(Math.random()*10000);
        var gender = null;
        var location = 'USA';
        var picture = 'campfire/resources/images/cf-user.png';
        var curtime = Math.floor(new Date().getTime()/1000);

        // Set some cookie values
        document.cookie = 'cfsess='+uid;
        document.cookie = 'network=guest';
        document.cookie = 'username='+displayName;

        // Set the user values
        Campfire._user_id = uid;
        Campfire._user_network = 'guest';
        Campfire._user_name = displayName;
        Campfire._user_logged = true;
        Campfire._user_picture = picture;

        // Add user to Firebase user list.. this will trigger update on other users
        Campfire._firebase.child('users').child(uid).set({
            name: displayName,
            gender: gender,
            location: location,
            picture: picture,
            lastact: curtime,
            network: {
                id: id,
                provider: 'guest'
            }
        });

        // Hide the login box, show the main menu
        $('#cf-login-box').hide();
        $('#cf-menu-id-img').attr('src',picture);
        $('#cf-menu-id-name').html(displayName);
        $('#cf-menu-box').show();

        // Attach root Firebase listeners
        Campfire.attachFbHandlers();
    },

    /**
     * Display a list of all the current users
     */
    listUsers: function() {
        $('#cf-menu-list').html('');
        for (var i in this._users)
            this.addUserToList(i);
    },

    /**
     * Add a user to the menu list
     * @param string Unique user id
     */
    addUserToList: function(user_id) {
        if (user_id == this._user_id)
            return;
        var user = this._users[user_id];
        $('#cf-menu-list').append('\
            <div class="cf-menu-list-item" id="cf-menu-list-item-'+user_id+'">\
                <img src="'+user.picture+'" width="25" height="25" id="cf-menu-list-item-img-'+user_id+'" />\
                <div>'+user.name+'</div>\
                <a href="#" onclick="Campfire.openRoom(\''+user_id+'\')">chat</a>\
            </div>\
        ');
        $('#cf-menu-list-item-img-'+user_id).mouseenter(function(){
            var user_id = ($(this).attr('id')).substr(22);
            var user = Campfire._users[user_id];

            $('#cf-profile-img').attr('src',user.picture);
            $('#cf-profile-user').html(user.name);
            if (user.gender) {
                $('#cf-profile-gender-lbl').show();
                $('#cf-profile-gender').html(user.gender).show();
            } else {
                $('#cf-profile-gender-lbl').hide();
                $('#cf-profile-gender').hide();
            }
            $('#cf-profile-location').html(user.location);
            $('#cf-profile-network').html(user.network.provider);

            clearTimeout(Campfire._fade_event);
            $('#cf-profile-box').fadeIn(250);
        }).mouseleave(function(){
            Campfire._fade_event = setTimeout(function(){
                $('#cf-profile-box').fadeOut(250);
            },250);
        });
    },

    /**
     * Remove a user from the menu list
     * @param string Unique user id
     */
    removeUserFromList: function(user_id) {
        $('#cf-menu-list-item-'+user_id).remove();
    },

    /**
     * Display a list of all the current chat rooms
     */
    listRooms: function() {
        $('#cf-menu-list').html('');
        for (var i in this._rooms)
            this.addRoomToList(i);
    },

    /**
     * Add a chat room to the menu list
     * @param string Unique room id
     */
    addRoomToList: function(room_id) {
        var room = this._rooms[room_id];
        if (room.type === CF_ROOM_PRIVATE) {
            return;
        } else {
            $('#cf-menu-list').append('\
                <div class="cf-menu-list-item" id="cf-menu-list-item-'+room_id+'">\
                    <img src="campfire/resources/images/cf-chat.png" width="25" height="25" />\
                    <div>'+room.name+'</div>\
                    <a href="#" onclick="Campfire.openRoom(\''+room_id+'\')">join</a>\
                </div>\
            ');
        }
    },

    /**
     * Remove a chat room from the menu list
     * @param string Unique room id
     */
    removeRoomFromList: function(room_id) {
        $('#cf-menu-list-item-'+user_id).remove();
    },

    /**
     * Open a chat room
     * @param string Room ID
     */
    openRoom: function(room_id) {
        var room_name;
        // Check if we're opening an existing chat
        if (typeof this._rooms[room_id] != 'undefined') {
            // Opening an existing chat room
            this._chats.push(room_id);
            room_name = this._rooms[room_id].name;
        } else {
            // Opening a new, private, user-to-user chat
            var user_id = room_id;
            room_name = this._user_name + ' & ' + this._users[user_id].name;
            room_id = this.genRoomID();
            this._firebase.child('rooms').child(room_id).set({
                name: room_name,
                type: CF_ROOM_PRIVATE,
                members: [
                    this._user_id,
                    user_id
                ]
            });
            return;
        }

        // How far left should the chat box be?
        var offset = 210 + (130 * (this._chats.length - 1));

        // Create the chat bar
        $('<div class="cf-chat-bar" id="cf-chat-bar-'+room_id+'" style="right:'+offset+'px"/>')
            .append('\
                <img onclick="Campfire.showRoom(\''+room_id+'\')" src="campfire/resources/images/cf-chat.png" width="29" height="29" />\
                <div onclick="Campfire.showRoom(\''+room_id+'\')">'+room_name+'</div>\
                <a href="#" title="Close Room" onclick="Campfire.closeRoom(\''+room_id+'\')"><img src="campfire/resources/images/cf-chat-close.png" width="29" height="29" class="cf-chat-bar-close" /></a>\
            ')
            .appendTo(this._ui_base);

        // Create the chat box
        $('<div class="cf-chat-box" id="cf-chat-box-'+room_id+'" style="right:'+offset+'px"/>')
            .append('\
                <div class="cf-chat-box-header">'+room_name+'<a href="#" title="Hide Chat" onclick="Campfire.hideRoom(\''+room_id+'\')"><img src="campfire/resources/images/cf-hide.png" width="30" height="30" /></a></div>\
                <div class="cf-chat-box-msgs" id="cf-chat-box-msgs-'+room_id+'"></div>\
                <div class="cf-chat-box-msg"><textarea class="cf-chat-box-msg-txt" id="cf-chat-box-msg-txt-'+room_id+'" placeholder="Message Text"></textarea></div>\
            ')
            .appendTo(this._ui_base);

        // Attach the message listener
        this._firebase.child('rooms/'+room_id+'/msgs').on('child_added',function(data){
            // We need to determine which chat this message is coming from
            var room_id = data.ref().toString().match(/rooms\/(.*)\/msgs/gi);
            room_id = room_id[0].substr(6);
            room_id = room_id.substr(0,room_id.length-5);
            var msg = data.val();

            // Is this message to or from the user
            if (msg.user == Campfire._user_id) {
                // From the user
                $('#cf-chat-box-msgs-'+room_id).append('\
                    <div class="cf-chat-box-msgs-msg">\
                        <div class="cf-chat-box-msgs-msg-user" style="float:right;">\
                            <img src="'+Campfire._users[msg.user].picture+'" width="40" height="40" />\
                            <div>'+Campfire._users[msg.user].name+'</div>\
                        </div>\
                        <div class="cf-chat-box-msgs-msg-txt" style="float:right;">\
                            <div class="top" style="background-image:url(\'campfire/resources/images/cf-chat-bubble-blue-top.png\');"></div>\
                            <div class="mid" style="background-image:url(\'campfire/resources/images/cf-chat-bubble-blue-mid.png\');">'+msg.txt+'</div>\
                            <div class="bot" style="background-image:url(\'campfire/resources/images/cf-chat-bubble-blue-bot.png\');"></div>\
                        </div>\
                    </div>\
                ');
            } else {
                // To the user
                $('#cf-chat-box-msgs-'+room_id).append('\
                    <div class="cf-chat-box-msgs-msg">\
                        <div class="cf-chat-box-msgs-msg-user" style="float:left;">\
                            <img src="'+msg.picture+'" width="40" height="40" />\
                            <div>'+msg.name+'</div>\
                        </div>\
                        <div class="cf-chat-box-msgs-msg-txt" style="float:left;">\
                            <div class="top" style="background-image:url(\'campfire/resources/images/cf-chat-bubble-green-top.png\');"></div>\
                            <div class="mid" style="background-image:url(\'campfire/resources/images/cf-chat-bubble-green-mid.png\');">'+msg.txt+'</div>\
                            <div class="bot" style="background-image:url(\'campfire/resources/images/cf-chat-bubble-green-bot.png\');"></div>\
                        </div>\
                    </div>\
                ');
            }

            $('#cf-chat-box-msgs-'+room_id).animate({
                scrollTop: $('#cf-chat-box-msgs-'+room_id)[0].scrollHeight
            });
        });

        // Message text box key press handler
        $('#cf-chat-box-msg-txt-'+room_id).keyup(function(e){
            if (e.keyCode == 13) {
                var room_id = ($(this).attr('id')).substr(20);
                var msg = $(this).val();
                $(this).val('');
                msg = msg.substr(0,msg.length-1);
                sent = Math.floor(new Date().getTime()/1000);
                Campfire._firebase.child('rooms/'+room_id+'/msgs').push({
                    txt: msg,
                    sent: sent,
                    user: Campfire._user_id,
                    name: Campfire._user_name,
                    picture: Campfire._user_picture
                });
            }
        });

        // Close chat window button
        $('.cf-chat-bar-close').mouseenter(function(){
            $(this).attr('src','campfire/resources/images/cf-chat-close-active.png');
        }).mouseleave(function(){
            $(this).attr('src','campfire/resources/images/cf-chat-close.png');
        });

        // Trigger the chat window to open
        $('#cf-chat-bar-'+room_id+' div').click();
        this.hideMenu();
    },

    /**
     * Close chat room
     * @param string Room ID
     */
    closeRoom: function(room_id) {

        // Remove the chat from the list
        for (var i in this._chats) {
            if (this._chats[i] == room_id) {
                this._chats.splice(i,1);
                break;
            }
        }

        // Get the chat x offset
        var parentOffset = parseInt($('#cf-chat-bar-'+room_id).css('right'));

        // Hide the chat bar and box
        $('#cf-chat-bar-'+room_id).remove();
        $('#cf-chat-box-'+room_id).remove();

        // Slide the other chat windows down
        for (var i in this._chats) {
            var chatOffset = parseInt($('#cf-chat-bar-'+this._chats[i]).css('right'));
            if (chatOffset > parentOffset) {
                $('#cf-chat-bar-'+this._chats[i]).animate({'right':(chatOffset-135)+'px'});
                $('#cf-chat-box-'+this._chats[i]).animate({'right':(chatOffset-135)+'px'});
            }
        }

        // Check if this is a private chat
        if (this._rooms[room_id].type == CF_ROOM_PRIVATE) {
            // Remove the chat from Firebase - this will close the chat for the other user as well
            // NOTE: doing this will actually trigger the child_removed room handler.. which means
            // this whole method gets called again for the person who closes the room. But oh well :/
            this._firebase.child('rooms/'+room_id).remove();
        }
    },

    /**
     * Show a chat room window
     * @param string Room ID
     */
    showRoom: function(room_id) {

        // Don't bother showing the room if its already open
        if (this._cur_chat == room_id)
            return;
        else if (this._cur_chat !== null)
            this.hideRoom();

        // Highlight the chat bar and show the window
        $('#cf-chat-bar-'+room_id).addClass('cf-chat-bar-active');
        $('#cf-chat-box-'+room_id).show();

        // Set the current chat room
        this._cur_chat = room_id;
    },

    /**
     * Hide a chat room
     */
    hideRoom: function() {

        // Dehighlight the bar and hide the window
        $('#cf-chat-bar-'+this._cur_chat).removeClass('cf-chat-bar-active');
        $('#cf-chat-box-'+this._cur_chat).hide();

        // Set the room id to null
        this._cur_chat = null;
    },

    /**
     * Show the main menu
     */
    showMenu: function() {
        $('#cf-menu-bar').addClass('cf-menu-bar-active');
        $('#cf-menu-bar-img').attr('src','campfire/resources/images/cf-menu-active.png');

        if (User.isLoggedIn() == false) {
            $('#cf-login-box').show();
        }
        else {
            $('#cf-menu-box').show();
            alert ('HERE');
        }
    },

    /**
     * Hide the main menu
     */
    hideMenu: function() {
        $('#cf-menu-bar').removeClass('cf-menu-bar-active');
        $('#cf-menu-bar-img').attr('src','campfire/resources/images/cf-menu.png');
        $('#cf-menu-box').hide();
    },

    /**
     * Switch the current menu tab
     * @param int Menu tab
     */
    switchMenuTab: function(tab) {
        if (tab === CF_MENU_USERS) {
            if (this._menu == CF_MENU_USERS) return;
            else this._menu = CF_MENU_USERS;
            $('#cf-menu-tab-rooms').removeClass('cf-menu-tab-active');
            $('#cf-menu-tab-users').addClass('cf-menu-tab-active');
            this.listUsers();
        } else if (tab === CF_MENU_ROOMS) {
            if (this._menu == CF_MENU_ROOMS) return;
            else this._menu = CF_MENU_ROOMS;
            $('#cf-menu-tab-users').removeClass('cf-menu-tab-active');
            $('#cf-menu-tab-rooms').addClass('cf-menu-tab-active');
            this.listRooms();
        }
    },

    /**
     * Send a debug message
     * @param int    Error level
     * @param string Error message
     */
    debug: function(lvl,msg) {
        if (lvl === CF_DEBUG_LOUD)
            alert(msg);
        else
            console.log(msg);
    },

    /**
     * Generate a unique user ID
     * @returns {string} User ID
     */
    genRoomID: function() {
        s4 = function() {
            return Math.floor((1+Math.random())*0x10000).toString(16).substr(1);
        };
        return s4()+s4()+s4();
    }
};