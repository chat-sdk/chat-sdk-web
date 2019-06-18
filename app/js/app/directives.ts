import * as angular from 'angular'

angular.module('myApp.directives', []).
    directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]);

import '../directives/animate-room'
import '../directives/cc-flash'
import '../directives/cc-focus'
import '../directives/cc-uncloak'
import '../directives/center-mouse-y'
import '../directives/consume-event'
import '../directives/disable-drag'
import '../directives/draggable-room'
import '../directives/draggable-user'
import '../directives/enter-submit'
import '../directives/fit-text'
import '../directives/infinite-scroll'
import '../directives/on-edit-message'
import '../directives/on-file-change'
import '../directives/pikaday'
import '../directives/resize-room'
import '../directives/scroll-glue'
import '../directives/social-iframe'
import '../directives/stop-shake'
import '../directives/user-drop-location'