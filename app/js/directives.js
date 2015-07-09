'use strict';

/* Directives */


var myApp = angular.module('myApp.directives', []).
    directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]);

myApp.directive('enterSubmit', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {

            elem.bind('keydown', function(event) {
                var code = event.keyCode || event.which;

                if (code === 13) {
                    if (!event.shiftKey) {
                        event.preventDefault();
                        scope.$apply(attrs.enterSubmit);

                        // Scroll down on enter too
                        scope.$broadcast('enterScrollDown');

                    }
                }
            });
        }
    };
});

myApp.directive('scrollGlue', function(){
    return {
        priority: 1,
        require: ['?ngModel'],
        restrict: 'A',
        link: function(scope, $el, attrs, ctrls){
            var el = $el[0],
                ngModel = ctrls[0] || fakeNgModel(true);

            function scrollToBottom(){
                el.scrollTop = el.scrollHeight;
            }

            function shouldActivateAutoScroll(){
                // + 1 catches off by one errors in chrome
                return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
            }

            scope.$watch(function(){
                if(ngModel.$viewValue){
                    scrollToBottom();
                }
            });

            $el.bind('scroll', function(){
                var activate = shouldActivateAutoScroll();
                if(activate !== ngModel.$viewValue){
                    scope.$apply(ngModel.$setViewValue.bind(ngModel, activate));
                }
            });

            // If they press enter scroll down
            scope.$on('enterScrollDown', function () {
                scrollToBottom();
            });
        }
    };

    function fakeNgModel(initValue){
        return {
            $setViewValue: function(value){
                this.$viewValue = value;
            },
            $viewValue: initValue
        };
    }
});

myApp.directive('animateRoom', ['$timeout', 'RoomPositionManager', 'Log', 'Utils', function ($timeout, RoomPositionManager, Log, Utils) {
    return function (scope, elm) {

        scope.$on(bAnimateRoomNotification, (function (event, args) {

            Log.notification(bAnimateRoomNotification, 'animateRoom');

            if(args.room == scope.room) {

                if(!Utils.unORNull(args.slot)) {
                    scope.room.slot = args.slot;
                }

                // Get the final offset
                var toOffset = RoomPositionManager.offsetForSlot(scope.room.slot);

                // Stop the previous animation
                elm.stop(true, false);

                var completion = function () {
                    scope.room.setOffset(toOffset);

                    scope.room.zIndex = null;

                    RoomPositionManager.updateAllRoomActiveStatus();

                    $timeout(function () {
                        scope.$digest();
                    });
                };

                if(!Utils.unORNull(args.duration) && args.duration == 0) {
                    completion();
                }
                else {
                    // Animate the chat room into position
                    elm.animate({right: toOffset}, !Utils.unORNull(args.duration) ? args.duration : 300, function () {
                        completion();
                    });
                }
            }
        }).bind(this));
    };
}]);

myApp.directive('resizeRoom',['$rootScope', '$timeout', '$document', 'Screen', 'RoomPositionManager', function ($rootScope, $timeout, $document, Screen, RoomPositionManager) {
    return function (scope, elm, attrs) {

        var lastClientX = 0;
        var lastClientY = 0;

        elm.mousedown((function (e) {
            stopDefault(e);
            scope.resizing = true;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
        }).bind(this));

        $document.mousemove((function (e) {
            if(scope.resizing) {

                stopDefault(e);

                // Min width
                scope.room.width += lastClientX - e.clientX;
                scope.room.width = Math.max(scope.room.width, bChatRoomWidth);
                scope.room.width = Math.min(scope.room.width, RoomPositionManager.effectiveScreenWidth() - scope.room.offset - bChatRoomSpacing);

                lastClientX = e.clientX;

                // Min height
                scope.room.height += lastClientY - e.clientY;
                scope.room.height = Math.max(scope.room.height, bChatRoomHeight);
                scope.room.height = Math.min(scope.room.height, Screen.screenHeight - bChatRoomTopMargin);

                lastClientY = e.clientY;

                // Update the room's scope
                $timeout(function () {
                    scope.$digest();
                });

                // We've changed the room's size so we need to re-calculate
                RoomPositionManager.setDirty();

                // Update the rooms to the left
                var rooms = RoomPositionManager.getRooms();

                // Only loop from this room's position onwards
                var room;
                for(var i = rooms.indexOf(scope.room); i < rooms.length; i++) {
                    room = rooms[i];
                    if(room != scope.room) {
                        room.setOffset(RoomPositionManager.offsetForSlot(i));
                        $rootScope.$broadcast(bRoomPositionUpdatedNotification, room);
                        RoomPositionManager.updateAllRoomActiveStatus();
                    }
                }

                return false;
            }
        }).bind(this));

        $document.mouseup((function (e) {
            if(scope.resizing) {
                scope.resizing = false;
            }
        }).bind(this));

    };
}]);

function stopDefault(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    else {
        window.event.returnValue = false;
    }
    return false;
}

myApp.directive('draggableRoom', ['$rootScope', '$document', '$timeout', 'RoomPositionManager', 'Screen', function ($rootScope, $document, $timeout, RoomPositionManager, Screen) {

    return function (scope, elm, attrs) {

        var lastClientX = 0;
        var emptySlot = 0;

        // Set the room as draggable - this will interact
        // with the layout manager i.e. draggable rooms
        // will be animated to position whereas non-draggable
        // rooms will be moved position manually
        scope.room.draggable = true;

        elm.mousedown((function (e) {

            // If the user clicked in the text box
            // then don't drag
            if($rootScope.disableDrag) {
                return true;
            }

            //stopDefault(e);
            if(scope.resizing) {
                return;
            }

            scope.room.zIndex = 1000;

            elm.stop(true, false);

            scope.startDrag();

            scope.dragging = true;
            lastClientX = e.clientX;

            return false;
        }).bind(this));

        $document.mousemove((function (e) {

            if(scope.dragging && !$rootScope.disableDrag) {

                stopDefault(e);

                var dx = lastClientX - e.clientX;

                // We must be moving in either a positive direction
                if(dx === 0) {
                    return false;
                }

                // Modify the chat's offset
                scope.room.dragDirection = dx;
                scope.room.setOffset(scope.room.offset + dx);

                lastClientX = e.clientX;

                // Apply constraints
                scope.room.offset = Math.max(scope.room.offset, bMainBoxWidth + bChatRoomSpacing);
                scope.room.offset = Math.min(scope.room.offset, RoomPositionManager.effectiveScreenWidth() - scope.room.width - bChatRoomSpacing);

                scope.wasDragged();

                RoomPositionManager.roomDragged(scope.room);

                // Apply the change
                $timeout(function () {
                    scope.$digest();
                });

                return false;
            }
        }).bind(this));

        $document.mouseup((function (e) {
            if(scope.dragging) {

                scope.dragging = false;

                $rootScope.$broadcast(bAnimateRoomNotification, {
                    room: scope.room
                });

            }
        }).bind(this));
    };
}]);

myApp.directive('centerMouseY', ['$document', 'Screen', function ($document, Screen) {
    return function (scope, elm, attrs) {
        $document.mousemove((function (e) {
            //!elm.is(":hover")
            if(scope.currentUser && jQuery('#'+elm.attr('id')+':hover').length == 0) {
                // Keep the center of this box level with the mouse y
                elm.css({bottom: Screen.screenHeight - e.clientY - elm.height()/2});
            }
        }).bind(this));
    };
}]);

myApp.directive('draggableUser', ['$rootScope','$document', '$timeout', 'Screen', function ($rootScope, $document, $timeout, Screen) {
    return function (scope, elm, attrs) {

        $rootScope.userDrag = {};

        elm.mousedown((function(e) {
            // Set the current user
            $rootScope.userDrag = {
                user: scope.aUser,
                x:0,
                y:0,
                dragging: true,
                dropLoc:false,
                visible: false
            };

            stopDefault(e);

            return false;

        }).bind(this));

        $document.mousemove((function (e) {

            if($rootScope.userDrag.dragging) {

                $rootScope.userDrag.visible = true;

                $rootScope.userDrag.x = e.clientX - 10;
                $rootScope.userDrag.y = e.clientY - 10;

                // TODO: Don't hardcode these values
                // for some reason .width() isn't working
                // Stop the dragged item going off the screen
                $rootScope.userDrag.x = Math.max($rootScope.userDrag.x, 0);
                $rootScope.userDrag.x = Math.min($rootScope.userDrag.x, Screen.screenWidth - 200);

                $rootScope.userDrag.y = Math.max($rootScope.userDrag.y, 0);
                $rootScope.userDrag.y = Math.min($rootScope.userDrag.y, Screen.screenHeight - 30);

                // If we're in the drop loc
                $timeout(function () {
                    scope.$apply();
                });
            }

        }).bind(this));

        $document.mouseup((function(e) {
            if($rootScope.userDrag.dragging) {
                $rootScope.userDrag.dragging = false;
                $rootScope.userDrag.visible = false;

                $timeout(function () {
                    scope.$apply();
                });
            }
        }).bind(this));
    };
}]);

myApp.directive('userDropLocation', ['$rootScope', 'Room', function ($rootScope, Room) {
    return function (scope, elm, attrs) {

        elm.mouseenter(function(e) {
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                $rootScope.userDrag.dropLoc = true;
            }
        });

        elm.mouseleave(function(e) {
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                $rootScope.userDrag.dropLoc = false;
            }
        });

        elm.mouseup((function(e) {
            // Add the user to this chat
            if($rootScope.userDrag && $rootScope.userDrag.dragging) {
                // Is the user already a member of this room?

                // This isn't really needed since it's handled with security rules
                //if(!scope.room.userIsMember($rootScope.userDrag.user)) {
                    Room.addUserToRoom(scope.room.meta.rid, $rootScope.userDrag.user, bUserStatusMember).then(function () {
                        // Update the room's type
                        scope.room.updateType();
                    }, function (error) {
                        $rootScope.showNotification(bNotificationTypeAlert, "Error", error.message, "Ok");
                    });
                //}
            }
        }).bind(this));
    };
}]);


myApp.directive('disableDrag', ['$rootScope','$document', function ($rootScope, $document) {
    return function (scope, elm, attrs) {

        elm.mousedown((function(e) {
            $rootScope.disableDrag = true;
        }).bind(this));

        $document.mouseup((function(e) {
            $rootScope.disableDrag = false;
        }).bind(this));
    };
}]);

myApp.directive('consumeEvent', ['$rootScope','$document', function ($rootScope, $document) {
    return function (scope, elm, attrs) {

        elm.mousedown((function(e) {
            stopDefault(e);
            return false;
        }).bind(this));

    };
}]);

/**
 * #54
 * This directive is used for scrollbars when the component can
 * also be dragged horizontally. If the user has shaky hands then
 * the chat will shake while they're scrolling. To prevent this
 * we add a listener to hear when they're scrolling.
 */
myApp.directive('stopShake', ['$rootScope', '$document',function ($rootScope, $document) {
    return function (scope, elm, attrs) {

        elm.scroll(function () {
            $rootScope.disableDrag = true;
        });

        // Allow dragging again on mouse up
        $document.mouseup((function(e) {
            $rootScope.disableDrag = false;
        }).bind(this));
    };
}]);

myApp.directive('fitText', function () {

    return function(scope, element, attr) {

        element.bind('keyup', function(e) {
            jQuery(element).height(0);
            var height = jQuery(element)[0].scrollHeight;

            // 8 is for the padding
            if (height < 26) {
                height = 26;
            }

            // If we go over the max height
            var maxHeight = eval(attr.fitText);
            if(height > maxHeight) {
                height = maxHeight;
                element.css({overflow: 'auto'});
            }
            else {
                element.css({overflow: 'hidden'});
            }

            scope.$apply(function () {
                scope.inputHeight = height;
            });

            element.css({'max-height': height});
            element.css({'height': height});

        });
    };
});

myApp.directive('ccFocus', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            scope.$watch(attr.ccFocus, function (n, o) {
                if (n !== 0 && n) {
                    element[0].focus();
                }
            });
        }
    };
});

myApp.directive('ccUncloak', function () {
    return function (scope, element, attr) {
        element.removeAttr('style');
    };
});

myApp.directive('infiniteScroll', [
    '$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {

        return function(scope, elem, attrs) {

            var handler = (function () {

                var scrollHeight = elem.prop('scrollHeight');
                var scrollTop = elem.scrollTop();
                var height = elem.height();

                var top = scrollTop;
                var bottom = scrollHeight - scrollTop - height;

                if(top < 1) {
                    scope.room.loadMoreMessages(function () {
                        // Set the bottom distance based on the new height
                        elem.scrollTop(elem.prop('scrollHeight') - height - bottom);
                    });
                }
            }).bind(this);

            elem.on('scroll', handler);

            scope.$on('$destroy', function() {
                return elem.off('scroll', handler);
            });
        }
    }
]);

myApp.directive('ccFlash', ['$timeout', 'Config', function ($timeout, Config) {
    return function (scope, element, attr) {

//        var originalColor = Config.headerColor;

        var originalColor = element.css('background-color');
        var originalTag = element.attr('cc-flash');
        var animating = false;

        scope.$on(bRoomFlashHeaderNotification, function (event, room, color, period, tag) {
            if(scope.room == room && color && period && !animating) {
                if(!tag || tag == originalTag) {
                    animating = true;

                    element.css('background-color', color);

                    $timeout(function () {
                        scope.$digest();
                    });

                    // Set another timeout
                    $timeout(function () {
                        if(tag == "room-header") {
                            originalColor = Config.headerColor;
                        }
                        element.css('background-color', originalColor);
                        scope.$digest();
                        animating = false;
                    }, period);
                }
            }
        });
    };
}]);

myApp.directive('pikaday', ["$rootScope", function ($rootScope) {
    return function (scope, element, attr) {

        var picker = new Pikaday({
            field: element[0],
            firstDay: 1,
            minDate: new Date('1920-01-01'),
            maxDate: new Date(),
            defaultDate: new Date('1990-01-01'),
            onSelect: function (date) {
                scope.dateOfBirth = date;
            }
        });

        scope.setDateOfBirth = function (date) {
            picker.setDate(date ? date : '1990-01-01');
        };

    };
}]);

myApp.directive('socialIframe', ["$rootScope", "$document", "$window", "Paths", function ($rootScope, $document, $window, Paths) {
    return function (scope, element, attr) {

        $rootScope.$on(bStartSocialLoginNotification, function (event, data, callback) {

            //element.load(function () {

//                var data = {
//                    action: 'github',
//                    path: Paths.firebase().toString()
//                };

                // Add the event listener
                var eventMethod = $window.addEventListener ? "addEventListener" : "attachEvent";
                var eventer = $window[eventMethod];
                var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                eventer(messageEvent, function(e) {
                    if (e.data) {
                        var data = JSON.parse(e.data);
                        callback(data);
                    }
                    else {
                        callback(null);
                    }
                });

                element.get(0).contentWindow.postMessage(JSON.stringify(data), "*");
            //});
        });
    };
}]);

myApp.directive('onEditMessage', function () {
    return function (scope, element, attr) {
        scope.$on(bEditMessageNotification, function (event, mid, newText) {
            if(mid == scope.message.meta.mid) {
                element.text(newText);
            }
        });
    };
});