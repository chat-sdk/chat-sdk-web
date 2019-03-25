/**
 * This service keeps track of the slot positions
 * while the rooms are moving around
 */
angular.module('myApp.services').factory('RoomPositionManager', ['$rootScope', '$timeout', '$document', '$window', 'LocalStorage', 'Cache', 'Screen', 'ArrayUtils',
    function ($rootScope, $timeout, $document, $window, LocalStorage, Cache, Screen, ArrayUtils) {

        var rpm = {

            rooms: [],
            slotPositions: [],
            dirty: true,

            init: function () {

                this.updateAllRoomActiveStatus();
                $rootScope.$on(bScreenSizeChangedNotification, (function () {
                    this.updateAllRoomActiveStatus();
                }).bind(this));

                return this;
            },

            roomDragged: function (room) {

                this.calculateSlotPositions();

                // Right to left
                var nextSlot = room.slot;
                var nextRoom = null;

                if(room.dragDirection > 0) {
                    nextSlot++;
                    if(this.rooms.length > nextSlot) {

                        nextRoom = this.rooms[nextSlot];

                        // If the room is covering over half of the next room
                        if(room.offset + room.width > this.slotPositions[nextSlot] + nextRoom.width/2) {
                            this.setDirty();
                            room.slot = nextSlot;
                            $rootScope.$broadcast(bAnimateRoomNotification, {
                                room: nextRoom,
                                slot: nextSlot - 1
                            });
                        }
                    }
                }
                // Left to right
                else {
                    nextSlot--;
                    if(nextSlot >= 0) {

                        nextRoom = this.rooms[nextSlot];

                        // If the room is covering over half of the next room
                        if(room.offset < this.slotPositions[nextSlot] + nextRoom.width / 2) {
                            this.setDirty();
                            room.slot = nextSlot;
                            $rootScope.$broadcast(bAnimateRoomNotification, {
                                room: nextRoom,
                                slot: nextSlot + 1
                            });
                        }
                    }
                }
            },

            insertRoom: function (room, slot, duration) {

                // If the room is already added then return
                if(this.roomIsOpen(room)) {
                    room.isOpen = true;
                    return;
                }

                // Update the rooms from the cache
                this.updateRoomsList();

                // We have no slot so add it to the max position
                if(slot == -1) {
                    slot = this.rooms.length;
                }

                var i;

                // Move the rooms left
                for(i = slot; i < this.rooms.length; i++) {
                    this.rooms[i].slot++;
                }

                // Add the room
                Cache.addRoom(room);

                room.slot = slot;

                // Flag as dirty since we've added a room
                this.setDirty();

                // Recalculate
                this.calculateSlotPositions();

                $rootScope.$broadcast(bRoomPositionUpdatedNotification, room);

                for(i = slot; i < this.rooms.length; i++) {
                    $rootScope.$broadcast(bAnimateRoomNotification, {
                        room: this.rooms[i],
                        duration: duration
                    });
                }

                room.updateOffsetFromSlot();
                $rootScope.$broadcast(bRoomOpenedNotification, room);

                this.updateAllRoomActiveStatus();

            },

            roomIsOpen: function (room) {
                return ArrayUtils.contains(this.rooms, room);
            },

            closeRoom: function (room) {

                if(!this.roomIsOpen(room)) {
                    room.isOpen = false;
                    return;
                }

                Cache.removeRoom(room);

                // Set the room width to default
                room.setSizeToDefault();

                this.autoPosition(300);
                this.updateAllRoomActiveStatus();

                $rootScope.$broadcast(bRoomClosedNotification, room);

            },

            closeAllRooms: function () {
                for(var i = 0; i < this.rooms.length; i++) {
                    this.closeRoom(this.rooms[i]);
                }
            },

            autoSetSlots: function () {
                for(var i = 0; i < this.rooms.length; i++) {
                    this.rooms[i].slot = i;
                }
            },

            autoPosition: function (duration) {

                this.calculateSlotPositions(true);
                this.autoSetSlots();

                // Are there any inactive rooms?
                // We do this because we can't animate rooms that
                // are inactive
                if(Cache.inactiveRooms().length) {
                    duration = 0;
                }

                // Animate all rooms into position
                for(var i = 0; i < this.rooms.length; i++) {
                    if(this.rooms[i].active && duration > 0) {
                        $rootScope.$broadcast(bAnimateRoomNotification, {
                            room: this.rooms[i],
                            duration: duration
                        });
                    }
                    // We need this because if a room isn't active then it's
                    // HTML and therefore controller won't exist
                    else {
                        this.rooms[i].updateOffsetFromSlot();
                    }
                }
            },

            updateAllRoomActiveStatus: function () {

                if(this.rooms.length === 0) {
                    return;
                }

                this.calculateSlotPositions(true);

                var effectiveScreenWidth = this.effectiveScreenWidth();

                // Get the index of the current room
                // If any room has gone changed their active status then digest
                var digest;

                for(var i = 0; i < this.rooms.length; i++) {
                    if((this.slotPositions[i] + this.rooms[i].width) < effectiveScreenWidth) {
                        digest = digest || this.rooms[i].active == false;
                        this.rooms[i].setActive(true);
                    }
                    else {
                        digest = digest || this.rooms[i].active == true;
                        this.rooms[i].setActive(false);
                    }
                }
                if(digest) {
                    $rootScope.$broadcast(bUpdateRoomActiveStatusNotification);
                }
            },

            updateRoomPositions: function (room, duration) {

                this.calculateSlotPositions();

                if(this.rooms.length) {
                    for(var i = Math.max(this.rooms.indexOf(room), 0); i < this.rooms.length; i++) {
                        if(this.rooms[i].active && duration > 0) {
                            $rootScope.$broadcast(bAnimateRoomNotification, {
                                room: this.rooms[i],
                                duration: duration
                            });
                        }
                        else {
                            this.rooms[i].updateOffsetFromSlot();
                        }
                    }
                }
            },

            /**
             * Returns the width of the screen -
             * if the room list is showing then it subtracts it's width
             * @returns {Usable screen width}
             */
            effectiveScreenWidth: function () {

                this.calculateSlotPositions();

                var width = Screen.screenWidth;

                if(!this.rooms.length) {
                    return width;
                }

                // Check the last box to see if it's off the end of the
                // screen
                var lastRoom = this.rooms[this.rooms.length - 1];

                // If we can fit the last room in then
                // the rooms list will be hidden which will
                // give us extra space
                if(lastRoom.width + this.slotPositions[lastRoom.slot] > Screen.screenWidth) {
                    width -= bRoomListBoxWidth;
                }

                return width;
            },

            getRooms: function () {
                this.calculateSlotPositions();
                return this.rooms;
            },

            updateRoomsList: function () {
                this.rooms = Cache.rooms;

                // Sort the rooms by slot
                this.rooms.sort(function (a, b) {
                    return a.slot - b.slot;
                });
            },

            setDirty: function () {
                this.dirty = true;
            },

            calculateSlotPositions: function (force) {
                if(force) {
                    this.setDirty();
                }
                if(!this.dirty) {
                    return;
                }

                this.dirty = false;

                this.updateRoomsList();

                this.slotPositions = [];

                // Work out the positions
                var p = bMainBoxWidth + bChatRoomSpacing;
                for(var i = 0; i < this.rooms.length; i++) {

                    this.slotPositions.push(p);

                    p += this.rooms[i].minimized ? bChatRoomWidth : this.rooms[i].width;
                    p += bChatRoomSpacing;
                }

//            for(var i in this.slotPositions) {
//                console.log("Slot: " + i + " - " + this.slotPositions[i]);
//            }
//            for(i = 0; i < this.rooms.length; i++) {
//                console.log("Room "+i+": " + this.rooms[i].slot);
//                if(i != this.rooms[i].slot) {
//                    console.log("ERRR");
//                }
//            }

            },

            offsetForSlot: function (slot) {
                this.calculateSlotPositions();
                return this.slotPositions[slot];
            }

        }

        return rpm.init();

    }]);