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
        }
    };

    function fakeNgModel(initValue){
        return {
            $setViewValue: function(value){
                this.$viewValue = value;
            },
            $viewValue: initValue
        };
    }});

myApp.directive('resizeRoom',['$rootScope', '$document', 'Layout', function ($rootScope, $document, Layout) {
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

                // Modify the chat's offset
                scope.room.width += lastClientX - e.clientX;
                scope.room.width = Math.max(scope.room.width, bChatRoomWidth);

                lastClientX = e.clientX;

                scope.room.height += lastClientY - e.clientY;
                lastClientY = e.clientY;

                try {
                    scope.wasResized();
                }
                catch (error) {}

                var rooms = Layout.roomsSortedByOffset();
                for(var i = 0; i < rooms.length; i++) {
                    if(rooms[i] != scope.room) {
                        rooms[i].offset = Layout.offsetForSlot(i);
                    }
                }

                // Apply the change
                Layout.updateRoomSize();

                scope.$apply();

                //scope.$digest();
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

myApp.directive('draggableRoom', ['$rootScope', '$document', 'Layout', function ($rootScope, $document, Layout) {

    return function (scope, elm, attrs) {

        var lastClientX = 0;
        var emptySlot = 0;
        var startingSlotOffset = 0;
        var pastHalfWay = false;

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

            // Mark the slot we're leaving
            emptySlot = scope.nearestSlotToRoom(scope.room);
            startingSlotOffset = Layout.offsetForSlot(emptySlot);

            // #55 Stop background from being highlighted on drag
            return false;
        }).bind(this));

        $document.mousemove((function (e) {

            if(scope.dragging && !$rootScope.disableDrag) {

                stopDefault(e);

                var dx = lastClientX - e.clientX;

                // Modify the chat's offset
                scope.room.offset += dx;
                lastClientX = e.clientX;

                // We must be moving in either a positive direction
                if(dx === 0) {
                    return false;
                }

                // Which side of our starting point are we?
                // Left is +ve right is -ve
                var displacement = scope.room.offset - startingSlotOffset;

                // Identify the slot we're moving towards
                var nextSlot = emptySlot;

                // The displacement + direction tells us which slot we're heading
                // towards
                if(displacement > 0) {
                    if(dx > 0) {
                        nextSlot = emptySlot + 1;
                    }
                }
                else {
                    if(dx < 0) {
                        nextSlot = emptySlot - 1;
                    }
                }

                // If we're moving towards a new slot
                if(nextSlot != emptySlot) {

                    // Which slot are we closer to?
                    var nextSlotOffset = Layout.offsetForSlot(nextSlot);

                    pastHalfWay = false;
                    if(displacement > 0) {
                        pastHalfWay = scope.room.offset > (startingSlotOffset + nextSlotOffset)/2;
                    }
                    else {
                        pastHalfWay = scope.room.offset < (startingSlotOffset + nextSlotOffset)/2;
                    }

                    // If we've past half way then the
                    // next window needs to move into our
                    // old position
                    if(pastHalfWay) {

                        // Animate the room at the next offset to the empty slot
                        var nextRoom = scope.roomAtSlot(nextSlot);
                        if(nextRoom && nextRoom != scope.room) {

                            nextRoom.targetSlot = emptySlot;

                            $rootScope.$broadcast('animateRoom', {
                                room: nextRoom
                            });

                            // Reset the empty slot to be this slot
                            emptySlot = nextSlot;
                            startingSlotOffset = Layout.offsetForSlot(emptySlot);
                        }
                    }
                }

                if(DEBUG) console.log("Empty slot: " + emptySlot);

                // Notify the controller
                scope.wasDragged();

                // Apply the change
                scope.$digest();

                return false;
            }
        }).bind(this));

        $document.mouseup((function (e) {
            if(scope.dragging) {
                scope.stopDrag();
                scope.dragging = false;

                // Get the nearest slot to the chat room
                var nearestSlot = scope.nearestSlotToOffset(scope.room.offset);

                // #129 - Can place chat room in incorrect slot
                nearestSlot = Math.min(nearestSlot, Layout.getActiveRooms().length - 1);

                // Check to see if the slot is already
                var roomAtNearestSlot = Layout.roomAtSlot(nearestSlot);

                if(DEBUG) console.log("This room - " + scope.room.meta.name + ", room at nearest slot: " + roomAtNearestSlot.meta.name);

                // This logic stops rooms being placed on top of each other
                if(roomAtNearestSlot && roomAtNearestSlot != scope.room && nearestSlot != emptySlot) {

                    // Move the room to the nearest slot
                    // If the room's stopped animating or it's heading towards our target
                    // slot send it to the empty slot
                    if(!roomAtNearestSlot.targetSlot || roomAtNearestSlot.targetSlot == nearestSlot) {
                        roomAtNearestSlot.targetSlot = emptySlot;

                        $rootScope.$broadcast('animateRoom', {
                            room: roomAtNearestSlot
                        });
                    }
                }

                scope.room.targetSlot = nearestSlot;

                $rootScope.$broadcast('animateRoom', {
                    room: scope.room
                });

                // Update all other rooms too
                // this fixes an issue where if you move the room backwards and forwards
                // a lot the rooms get clumped together
                // This function makes sure that on a mouse-up event all the rooms are
                // layed out properly
                var r = null;
                var sortedRooms =  Layout.roomsSortedByOffset();
                for(var i = 0; i < sortedRooms.length; i++) {
                    r = sortedRooms[i];
                    if(r != scope.room && r != roomAtNearestSlot) {
                        r.targetSlot = i;
                        $rootScope.$broadcast('animateRoom', {
                            room: r
                        });
                    }
                }


            }
        }).bind(this));

        scope.$on('animateRoom', (function (event, args) {
            if(args.room == scope.room) {

                var offset = Layout.offsetForSlot(args.room.targetSlot);

                if(DEBUG) console.log(args.room.meta.name + " -> " + args.room.targetSlot);

                // Stop the previous animation
                elm.stop(true, false);

                // Animate the chat room into position
                elm.animate({right: offset}, args.duration ? args.duration : 300, function () {

                    scope.room.offset = offset;
                    scope.room.targetSlot = null;

                    scope.room.zIndex = null;

                    scope.saveRoomSlotToUser(scope.room);

                    scope.$digest();

                    try {
                        args.finished();
                    }
                    catch (e) {

                    }

                });
            }
        }).bind(this));
    };
}]);

myApp.directive('centerMouseY', ['$document', function ($document) {
    return function (scope, elm, attrs) {
        $document.mousemove((function (e) {
            if(scope.currentUser && !elm.is(":hover")) {
                // Keep the center of this box level with the mouse y
                elm.css({bottom: scope.screenHeight - e.clientY - elm.height()/2});
            }
        }).bind(this));
    };
}]);

myApp.directive('draggableUser', ['$rootScope','$document', function ($rootScope, $document) {
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
                $rootScope.userDrag.x = Math.min($rootScope.userDrag.x, $rootScope.screenWidth - 200);

                $rootScope.userDrag.y = Math.max($rootScope.userDrag.y, 0);
                $rootScope.userDrag.y = Math.min($rootScope.userDrag.y, $rootScope.screenHeight - 30);

                // If we're in the drop loc
                $rootScope.$apply();
            }

        }).bind(this));

        $document.mouseup((function(e) {
            $rootScope.userDrag.dragging = false;
            $rootScope.userDrag.visible = false;
            $rootScope.$apply();
        }).bind(this));
    };
}]);

myApp.directive('userDropLocation', ['$rootScope','$document', function ($rootScope, $document) {
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
                scope.room.addUser($rootScope.userDrag.user, bUserStatusInvited);
                $rootScope.userDrag.user.addRoom(scope.room);
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

myApp.directive('autoGrow', function() {
    return function(scope, element, attr){
        var minHeight = element[0].offsetHeight,
            paddingLeft = element.css('paddingLeft'),
            paddingRight = element.css('paddingRight');

        var $shadow = angular.element('<div></div>').css({
            position: 'absolute',
            top: -10000,
            left: -10000,
            width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
            fontSize: element.css('fontSize'),
            fontFamily: element.css('fontFamily'),
            lineHeight: element.css('lineHeight'),
            resize: 'none'
        });
        angular.element(document.body).append($shadow);

        var update = function() {

            var times = function(string, number) {
                for (var i = 0, r = ''; i < number; i++) {
                    r += string;
                }
                return r;
            };

            var val = element.val().replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/&/g, '&amp;')
                .replace(/\n$/, '<br/>&nbsp;')
                .replace(/\n/g, '<br/>')
                .replace(/\s{2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' ' });
            $shadow.html(val);

            element.css('height', Math.max($shadow[0].offsetHeight + 10 /* the "threshold" */, minHeight) + 'px');
        };

        element.bind('keyup keydown keypress change', update);
        update();
    };
});

myApp.directive('fitText', function () {

    return function(scope, element, attr) {

        element.bind('keyup', function(e) {
            $(element).height(0);
            var height = $(element)[0].scrollHeight;

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

