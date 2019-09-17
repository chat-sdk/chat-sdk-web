import * as angular from 'angular'


import {ShowProfileSettingsBox} from "../keys/defines";
import {UserKeys} from "../keys/user-keys";
import {Utils} from "../services/utils";
import { NotificationType } from '../keys/notification-type';

angular.module('myApp.controllers').controller('ProfileSettingsController', ['$scope', 'Auth', 'Config', 'SoundEffects', 'LocalStorage',
    function($scope, Auth, Config, SoundEffects, LocalStorage) {

        $scope.ref = null;
        $scope.muted = false;
        $scope.nameChangeDummy = null;
        $scope.dirty = false;

        $scope.init = function () {

            // Listen for validation errors
            $scope.muted = SoundEffects.muted;

            $scope.validation = {};

            $scope.validation[UserKeys.Name] = {
                minLength: 2,
                maxLength: 50,
                valid: true
            };

            // $scope.validation[UserKeys.Location] = {
            //     minLength: 0,
            //     maxLength: 50,
            //     valid: true
            // };

            $scope.validation[UserKeys.ProfileLink] = {
                minLength: 0,
                maxLength: 100,
                valid: true
            };

            $scope.$watchCollection('user.meta', () => {
                $scope.dirty = true;
            });

            // When the box will be opened we need to add a listener to the
            // user
            $scope.$on(ShowProfileSettingsBox, () => {

                console.log("Show Profile");

            });
        };

        $scope.validateLocation = function () {
            return true;
            // return $scope.validation[UserKeys.Location].valid;
        };

        $scope.validateProfileLink = function () {
            return $scope.validation[UserKeys.ProfileLink].valid;
        };

        $scope.validateName= function () {
            return $scope.validation[UserKeys.Name].valid;
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
            let rg_pctEncoded = "%[0-9a-fA-F]{2}";
            let rg_protocol = "(http|https):\\/\\/";

            let rg_userinfo = "([a-zA-Z0-9$\\-_.+!*'(),;:&=]|" + rg_pctEncoded + ")+" + "@";

            let rg_decOctet = "(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])"; // 0-255
            let rg_ipv4address = "(" + rg_decOctet + "(\\." + rg_decOctet + "){3}" + ")";
            let rg_hostname = "([a-zA-Z0-9\\-\\u00C0-\\u017F]+\\.)+([a-zA-Z]{2,})";
            let rg_port = "[0-9]+";

            let rg_hostport = "(" + rg_ipv4address + "|localhost|" + rg_hostname + ")(:" + rg_port + ")?";

            // chars sets
            // safe           = "$" | "-" | "_" | "." | "+"
            // extra          = "!" | "*" | "'" | "(" | ")" | ","
            // hsegment       = *[ alpha | digit | safe | extra | ";" | ":" | "@" | "&" | "=" | escape ]
            let rg_pchar = "a-zA-Z0-9$\\-_.+!*'(),;:@&=";
            let rg_segment = "([" + rg_pchar + "]|" + rg_pctEncoded + ")*";

            let rg_path = rg_segment + "(\\/" + rg_segment + ")*";
            let rg_query = "\\?" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";
            let rg_fragment = "\\#" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";

            let rgHttpUrl = new RegExp(
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

            let user = $scope.getUser();

            // Validate the user
            let nameValid = $scope.validateString(UserKeys.Name, user.getName());

            let profileLinkValid = !Config.userProfileLinkEnabled || $scope.validateString(UserKeys.ProfileLink, user.getProfileLink());

            return nameValid && profileLinkValid;
        };

        $scope.validateString = function (key, string) {
            let valid = true;

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
                if(!$scope.validation[UserKeys.Name].valid) {
                    $scope.showNotification(NotificationType.Alert, "Validation failed", "The name must be between "+$scope.validation[UserKeys.Name].minLength+" - "+$scope.validation[UserKeys.Name].maxLength+" characters long ", "Ok");
                }
                // if(!$scope.validation[UserKeys.Location].valid) {
                //     $scope.showNotification(NotificationType.Alert, "Validation failed", "The location must be between "+$scope.validation[UserKeys.Location].minLength+" - "+$scope.validation[UserKeys.Location].maxLength+" characters long", "Ok");
                // }
                if(!$scope.validation[UserKeys.ProfileLink].valid) {
                    $scope.showNotification(NotificationType.Alert, "Validation failed", "The profile link must be a valid URL", "Ok");
                }
            }
        };

        $scope.init();

    }]);