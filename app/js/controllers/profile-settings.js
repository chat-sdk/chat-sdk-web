angular.module('myApp.controllers').controller('ProfileSettingsController', ['$scope', 'Auth', 'Config', 'SoundEffects', 'Log', 'LocalStorage', 'Paths', 'Utils',
    function($scope, Auth, Config, SoundEffects, Log, LocalStorage, Paths, Utils) {

        $scope.ref = null;
        $scope.muted = false;
        $scope.nameChangeDummy = null;
        $scope.dirty = false;

        $scope.init = function () {

            // Listen for validation errors
            $scope.muted = SoundEffects.muted;

            $scope.validation = {};

            $scope.validation[bUserName] = {
                minLength: 2,
                maxLength: 50,
                valid: true
            };

            $scope.validation[bUserLocation] = {
                minLength: 0,
                maxLength: 50,
                valid: true
            };

            $scope.validation[bUserProfileLink] = {
                minLength: 0,
                maxLength: 100,
                valid: true
            };

            $scope.$watchCollection('user.meta', function () {
                $scope.dirty = true;
            });

            // When the box will be opened we need to add a listener to the
            // user
            $scope.$on(bShowProfileSettingsBox, (function () {

                console.log("Show Profile");

            }).bind(this));
        };

        $scope.validateLocation = function () {
            return $scope.validation[bUserLocation].valid;
        };

        $scope.validateProfileLink = function () {
            return $scope.validation[bUserProfileLink].valid;
        };

        $scope.validateName= function () {
            return $scope.validation[bUserName].valid;
        };

        $scope.toggleMuted = function () {
            $scope.muted = SoundEffects.toggleMuted();
        };

        $scope.clearCache = function () {
            if(!$scope.cacheCleared) {
                LocalStorage.clearCache();
            }
            $scope.cacheCleared = true;
        };

        $scope.isValidURL = function(url) {// wrapped in self calling function to prevent global pollution

            //URL pattern based on rfc1738 and rfc3986
            var rg_pctEncoded = "%[0-9a-fA-F]{2}";
            var rg_protocol = "(http|https):\\/\\/";

            var rg_userinfo = "([a-zA-Z0-9$\\-_.+!*'(),;:&=]|" + rg_pctEncoded + ")+" + "@";

            var rg_decOctet = "(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])"; // 0-255
            var rg_ipv4address = "(" + rg_decOctet + "(\\." + rg_decOctet + "){3}" + ")";
            var rg_hostname = "([a-zA-Z0-9\\-\\u00C0-\\u017F]+\\.)+([a-zA-Z]{2,})";
            var rg_port = "[0-9]+";

            var rg_hostport = "(" + rg_ipv4address + "|localhost|" + rg_hostname + ")(:" + rg_port + ")?";

            // chars sets
            // safe           = "$" | "-" | "_" | "." | "+"
            // extra          = "!" | "*" | "'" | "(" | ")" | ","
            // hsegment       = *[ alpha | digit | safe | extra | ";" | ":" | "@" | "&" | "=" | escape ]
            var rg_pchar = "a-zA-Z0-9$\\-_.+!*'(),;:@&=";
            var rg_segment = "([" + rg_pchar + "]|" + rg_pctEncoded + ")*";

            var rg_path = rg_segment + "(\\/" + rg_segment + ")*";
            var rg_query = "\\?" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";
            var rg_fragment = "\\#" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";

            var rgHttpUrl = new RegExp(
                "^"
                + rg_protocol
                + "(" + rg_userinfo + ")?"
                + rg_hostport
                + "(\\/"
                + "(" + rg_path + ")?"
                + "(" + rg_query + ")?"
                + "(" + rg_fragment + ")?"
                + ")?"
                + "$"
            );

            // export public function
            if (rgHttpUrl.test(url)) {
                return true;
            } else {
                return false;
            }
        };

        $scope.validate = function () {

            var user = $scope.getUser();

            // Validate the user
            var nameValid = $scope.validateString(bUserName, user.getName());
            var locationValid = $scope.validateString(bUserLocation, user.getLocation());

            var profileLinkValid = !Config.userProfileLinkEnabled || $scope.validateString(bUserProfileLink, user.getProfileLink());

            return nameValid && locationValid && profileLinkValid;
        };

        $scope.validateString = function (key, string) {
            var valid = true;

            if(Utils.unORNull(string)) {
                valid = false;
            }

            else if(string.length < $scope.validation[key].minLength) {
                valid = false;
            }

            else if(string.length > $scope.validation[key].maxLength) {
                valid = false;
            }

            $scope.validation[key].valid = valid;
            return valid;

        };

        /**
         * This is called when the user confirms changes to their user
         * profile
         */
        $scope.done = function () {

            // Is the name valid?
            if($scope.validate()) {

                $scope.showMainBox();

                // Did the user update any values?
                if($scope.dirty) {
                    $scope.getUser().pushMeta();
                    $scope.dirty = false;
                }
            }
            else {
                if(!$scope.validation[bUserName].valid) {
                    $scope.showNotification(NotificationTypeAlert, "Validation failed", "The name must be between "+$scope.validation[bUserName].minLength+" - "+$scope.validation[bUserName].maxLength+" characters long ", "Ok");
                }
                if(!$scope.validation[bUserLocation].valid) {
                    $scope.showNotification(NotificationTypeAlert, "Validation failed", "The location must be between "+$scope.validation[bUserLocation].minLength+" - "+$scope.validation[bUserLocation].maxLength+" characters long", "Ok");
                }
                if(!$scope.validation[bUserProfileLink].valid) {
                    $scope.showNotification(NotificationTypeAlert, "Validation failed", "The profile link must be a valid URL", "Ok");
                }
            }
        };

        $scope.init();

    }]);