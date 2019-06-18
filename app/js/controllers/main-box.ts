import * as angular from 'angular'
import {
    ConfigUpdatedNotification, LoginCompleteNotification, RoomBadgeChangedNotification, RoomRemovedNotification,
    ScreenSizeChangedNotification,
    UserValueChangedNotification
} from "../keys/notification-keys";
import {FriendsTab, InboxTab, RoomsTab, UsersTab} from "../keys/tab-keys";
import {MainBoxHeight, MainBoxWidth} from "../keys/dimensions";
import {NotificationTypeWaiting} from "../keys/defines";

angular.module('myApp.controllers').controller('MainBoxController', ['$scope', '$timeout', 'Auth', 'FriendsConnector', 'ArrayUtils', 'Config', 'Screen', 'Log', 'RoomPositionManager', 'RoomStore',
    function($scope, $timeout, Auth, FriendsConnector, ArrayUtils, Config, Screen, Log, RoomPositionManager, RoomStore) {

        $scope.inboxCount = 0;

        $scope.usersTabEnabled = true
        $scope.roomsTabEnabled = true;
        $scope.friendsTabEnabled = true;
        $scope.tabCount = 0;

        $scope.init = function () {

            // Work out how many tabs there are
            $scope.$on(ConfigUpdatedNotification, function () {
                $scope.updateConfig();
            });
            $scope.updateConfig();

            // Setup the search variable - if we don't do this
            // Angular can't set search.text
            $scope.search = {};
            $scope.search[UsersTab] = "";
            $scope.search[RoomsTab] = "";
            $scope.search[FriendsTab] = "";

            // This is used by sub views for their layouts
            $scope.boxWidth = MainBoxWidth;

            // We don't want people deleting rooms from this view
            $scope.canCloseRoom = false;

            // When the user value changes update the user interface
            $scope.$on(UserValueChangedNotification, function () {
                Log.notification(UserValueChangedNotification, "MainBoxController");
                $timeout(function () {
                    $scope.$digest();
                });
            });

            $scope.updateMainBoxSize();
            $scope.$on(ScreenSizeChangedNotification, function () {
                Log.notification(ScreenSizeChangedNotification, "MainBoxController");
                $scope.updateMainBoxSize();
            });

            $scope.$on(RoomBadgeChangedNotification, function () {
                Log.notification(RoomBadgeChangedNotification, "MainBoxController");
                $scope.updateInboxCount();
            });

            $scope.$on(LoginCompleteNotification, function () {
                Log.notification(RoomRemovedNotification, 'InboxRoomsListController');
                $scope.updateInboxCount();
            });

        };

        $scope.updateConfig = function () {
            $scope.usersTabEnabled = Config.onlineUsersEnabled;
            $scope.roomsTabEnabled = Config.publicRoomsEnabled;
            $scope.friendsTabEnabled = Config.friendsEnabled;

            $scope.tabCount = $scope.numberOfTabs();

            // Make the users tab start clicked
            if(Config.onlineUsersEnabled) {
                $scope.tabClicked(UsersTab);
            }
            else if(Config.publicRoomsEnabled) {
                $scope.tabClicked(RoomsTab);
            }
            else {
                $scope.tabClicked(InboxTab);
            }

            $timeout(function () {
                $scope.$digest();
            })
        };

        $scope.numberOfTabs = function () {
            var tabs = 1;
            if(Config.onlineUsersEnabled) {
                tabs++;
            }
            if(Config.publicRoomsEnabled) {
                tabs++;
            }
            if(Config.friendsEnabled) {
                tabs++;
            }
            return tabs;
        };

        $scope.updateInboxCount = function () {
            $scope.inboxCount = RoomStore.inboxBadgeCount();
            $timeout(function () {
                $scope.$digest();
            });
        };

        $scope.updateMainBoxSize = function () {
            $scope.mainBoxHeight = Math.max(Screen.screenHeight * 0.5, MainBoxHeight);
            $scope.mainBoxWidth = MainBoxWidth;
            $timeout(function () {
                $scope.$digest();
            });
        };

        $scope.profileBoxDisabled = function () {
            return Config.disableProfileBox;
        };

        $scope.showOverlay = function (message) {
            $scope.notification.show = true;
            $scope.type = NotificationTypeWaiting;
            $scope.notification.message = message;
        };

        $scope.tabClicked = function (tab) {
            $scope.activeTab = tab;

            // Save current search text
            //$scope.search

            if(tab == UsersTab) {
                $scope.title = "Who's online";
            }
            if(tab == RoomsTab) {
                $scope.title = "Chat rooms";
            }
            if(tab == FriendsTab) {
                $scope.title = "My friends";
            }
            if(tab == InboxTab) {
                $scope.title = "Inbox";
            }
        };

        /**
         * Return a list of friends filtered by the search box
         * @return A list of users who's names meet the search text
         */
        $scope.getAllUsers = function () {
            return ArrayUtils.objectToArray(FriendsConnector.friends);
        };

        $scope.searchKeyword = function () {
            return $scope.search[$scope.activeTab];
        };

        $scope.roomClicked = function (room) {

            // Trim the messages array in case it gets too long
            // we only need to store the last 200 messages!
            room.trimMessageList();

            // Messages on is called by when we add the room to the user
            // If the room is already open do nothing!
            if(room.flashHeader()) {
                return;
            }

            room.open(0, 300);
        };

        $scope.init();
    }]);