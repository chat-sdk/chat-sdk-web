/**
 * Created by benjaminsmiley-andrews on 26/05/15.
 */
var myApp = angular.module('myApp.config', []);

myApp.factory('Config', ['$rootScope', '$timeout', '$q', 'Paths', 'Utils', function ($rootScope, $timeout, $q, Paths, Utils) {

    // Priorities for setting
    var setByDefault = 0;
    var setByControlPanel = 10;
    var setByInclude = 20;
    var setBySingleSignOn = 30;
    var setByAdmin = 40;

    return {

        setByDefault: setByDefault,
        setByInclude: setByInclude,
        setBySingleSignOn: setBySingleSignOn,
        //setByFirebase: setByFirebase,
        setByControlPanel: setByControlPanel,
        setByAdmin: setByAdmin,

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

        apiLevel: 1,
        apiLevelSet: setByDefault,

        // TODO: check this
        maxConcurrent: 20,
        maxConcurrentSet: setByAdmin,

        showAds: true,
        showAdsSet: setByAdmin,

        whiteLabel: true,
        whiteLabelSet: setByAdmin,

        singleSignOn: true,
        singleSignOnSet: setByAdmin,

        onlineUsersEnabled: true,
        onlineUsersEnabledSet: setByDefault,

        publicRoomsEnabled: true,
        publicRoomsEnabledSet: setByDefault,

        friendsEnabled: true,
        friendsEnabledSet: setByDefault,

        friends: [],
        friendsSet: setByDefault,

        imageMessagesEnabled: false,
        imageMessagesEnabledSet: setByDefault,

        marginRight: 0,
        marginRightSet: setByDefault,

        clearCacheTimestamp: null,
        clearCacheTimestampSet: setByDefault,

        disableUserInfoPopup: false,
        disableUserInfoPopupSet: setByDefault,

        clickToChatTimeout: bLastVisitedTimeout,
        clickToChatTimeoutSet: setByDefault,

        userProfileLinkEnabled: false,
        userProfileLinkEnabledSet: setByDefault,

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

            this.setValue("onlineUsersEnabled", config, setBy);
            this.setValue("publicRoomsEnabled", config, setBy);
            this.setValue("friendsEnabled", config, setBy);
            this.setValue("clearCacheTimestamp", config, setBy);
            this.setValue("imageMessagesEnabled", config, setBy);
            this.setValue("marginRight", config, setBy);

            this.setValue("friends", config, setBy);

            this.setValue("clickToChatTimeout", config, setBy);
            this.setValue("userProfileLinkEnabled", config, setBy);

            // After we've updated the config we need to digest the
            // root scope
            $timeout(function() {
                $rootScope.$digest();
            });

            $rootScope.config = this;

            $rootScope.$broadcast(bConfigUpdatedNotification);
            $timeout(function () {
                $rootScope.$digest()
            });

        },

        setValue: function (name, data, setBy) {
            if(data && !Utils.unORNull(data[name]) && this[name+"Set"] <= setBy) {
                this[name] = data[name];
                this[name+"Set"] = setBy;
            }
        },

        startConfigListener: function () {

            var deferred = $q.defer();

            var ref = Paths.configRef();
            ref.on('value', (function (snapshot) {
                this.setConfig(this.setByControlPanel, snapshot.val());
                deferred.resolve();
            }).bind(this));

            return deferred.promise;
        }

    };
}]);