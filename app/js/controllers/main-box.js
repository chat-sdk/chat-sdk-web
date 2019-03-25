angular.module('myApp.controllers').controller('MainBoxController', ['$scope', '$timeout', 'Auth', 'FriendsConnector', 'ArrayUtils', 'Config', 'Screen', 'Log', 'RoomPositionManager', 'RoomStore',
    function($scope, $timeout, Auth, FriendsConnector, ArrayUtils, Config, Screen, Log, RoomPositionManager, RoomStore) {

        $scope.inboxCount = 0;

        $scope.usersTabEnabled = true
        $scope.roomsTabEnabled = true;
        $scope.friendsTabEnabled = true;
        $scope.tabCount = 0;

        $scope.init = function () {

            // Work out how many tabs there are
            $scope.$on(bConfigUpdatedNotification, function () {
                $scope.updateConfig();
            });
            $scope.updateConfig();

            // Setup the search variable - if we don't do this
            // Angular can't set search.text
            $scope.search = {};
            $scope.search[bUsersTab] = "";
            $scope.search[bRoomsTab] = "";
            $scope.search[bFriendsTab] = "";

            // This is used by sub views for their layouts
            $scope.boxWidth = bMainBoxWidth;

            // We don't want people deleting rooms from this view
            $scope.canCloseRoom = false;

            // When the user value changes update the user interface
            $scope.$on(bUserValueChangedNotification, function () {
                Log.notification(bUserValueChangedNotification, "MainBoxController");
                $timeout(function () {
                    $scope.$digest();
                });
            });

            $scope.updateMainBoxSize();
            $scope.$on(bScreenSizeChangedNotification, function () {
                Log.notification(bScreenSizeChangedNotification, "MainBoxController");
                $scope.updateMainBoxSize();
            });

            $scope.$on(bRoomBadgeChangedNotification, function () {
                Log.notification(bRoomBadgeChangedNotification, "MainBoxController");
                $scope.updateInboxCount();
            });

            $scope.$on(bLoginCompleteNotification, function () {
                Log.notification(bRoomRemovedNotification, 'InboxRoomsListController');
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
                $scope.tabClicked(bUsersTab);
            }
            else if(Config.publicRoomsEnabled) {
                $scope.tabClicked(bRoomsTab);
            }
            else {
                $scope.tabClicked(bInboxTab);
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
            $scope.mainBoxHeight = Math.max(Screen.screenHeight * 0.5, bMainBoxHeight);
            $scope.mainBoxWidth = bMainBoxWidth;
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

            if(tab == bUsersTab) {
                $scope.title = "Who's online";
            }
            if(tab == bRoomsTab) {
                $scope.title = "Chat rooms";
            }
            if(tab == bFriendsTab) {
                $scope.title = "My friends";
            }
            if(tab == bInboxTab) {
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