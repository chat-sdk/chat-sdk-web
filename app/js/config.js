/**
 * Created by benjaminsmiley-andrews on 26/05/15.
 */
var myApp = angular.module('myApp.config', []);

myApp.factory('Config', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

    // Priorities for setting
    var setByDefault = 0;
    var setByInclude = 1;
    var setBySingleSignOn = 2;
    var setByFirebase = 3;

    return {

        setByDefault: setByDefault,
        setByInclude: setByInclude,
        setBySingleSignOn: setBySingleSignOn,
        setByFirebase: setByFirebase,

        singleSignOnURL: null,
        singleSignOnURLSet: setByDefault,

        loginURL: null,
        loginURLSet: setByDefault,

        registerURL: null,
        registerURLSet: setByDefault,

        // How many historic messages to set by default
        maxHistoricMessages: 50,
        maxHistoricMessagesSet: setByDefault,

        // Stop the user from changing their name
        disableUserNameChange: false,
        disableUserNameChangeSet: setByDefault,

        // Stop the profile box from being displayed
        disableProfileBox: false,
        disableProfileBoxSet: setByDefault,

        // Clock type:
        // - 12hour
        // - 24hour
        clockType: '12hour',
        clockTypeSet: setByDefault,

        // Are users allowed to create their own public rooms
        usersCanCreatePublicRooms: false,
        usersCanCreatePublicRoomsSet: setByDefault,

        // The primary domain is used when the chat is needed
        // across multiple subdomains
        primaryDomain: '',
        primaryDomainSet: setByDefault,

        // Allow anonymous login?
        anonymousLoginEnabled: false,
        anonymousLoginEnabledSet: setByDefault,

        // Can the user log in using social logins
        socialLoginEnabled: true,
        socialLoginEnabledSet: setByDefault,

        // Header and tab color
        headerColor: '#0d82b3',
        headerColorSet: setByDefault,

        // After how long should the user be marked as offline
        inactivityTimeout: 5,
        inactivityTimeoutSet: setByDefault,

        // The Single sign on API to use
        singleSignOnAPILevel: 1,
        singleSignOnAPILevelSet: setByDefault,

        apiLevel: 0,
        apiLevelSet: setByDefault,

        maxConcurrent: 20,
        maxConcurrentSet: setByDefault,

        showAds: true,
        showAdsSet: setByDefault,

        whiteLabel: true,
        whiteLabelSet: setByDefault,

        singleSignOn: true,
        singleSignOnSet: setByDefault,

        registerURL: null,
        registerURLSet: setByDefault,

        loginURL: null,
        loginURLSet: setByDefault,

        // We update the config using the data provided
        // but we only update variables where the priority
        // of this setBy entity is higher than the previous
        // one
        setConfig: function (setBy, config) {

            this.setValue("inactivityTimeout", config, setBy);
            this.inactivityTimeout = Math.max(this.inactivityTimeout, 2);
            this.inactivityTimeout = Math.min(this.inactivityTimeout, 15);

            this.setValue("maxHistoricMessages", config, setBy);
            this.setValue("disableUserNameChange", config, setBy);
            this.setValue("disableProfileBox", config, setBy);
            this.setValue("clockType", config, setBy);
            this.setValue("usersCanCreatePublicRooms", config, setBy);
            this.setValue("primaryDomain", config, setBy);
            this.setValue("anonymousLoginEnabled", config, setBy);

            this.setValue("socialLoginEnabled", config, setBy);
            this.setValue("headerColor", config, setBy);
            this.setValue("singleSignOnAPILevel", config, setBy);
            this.setValue("apiLevel", config, setBy);
            this.setValue("singleSignOn", config, setBy);
            this.setValue("singleSignOnURL", config, setBy);
            this.setValue("registerURL", config, setBy);
            this.setValue("loginURL", config, setBy);

            // After we've updated the config we need to digest the
            // root scope
            $timeout(function() {
                $rootScope.$digest();
            });

            $rootScope.config = this;

        },

        setValue: function (name, data, setBy) {
            if(data[name] && this[name+"Set"] < setBy) {
                this[name] = data[name];
                this[name+"Set"] = setBy;
            }
        }

    };
}]);