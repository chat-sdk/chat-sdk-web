angular.module('myApp.services').factory('ArrayUtils', ['Utils', function (Utils) {

    return {

        getRoomsWithUsers: function (rooms, users) {

            var roomsWithUsers = [];
            for(var i = 0; i < rooms.length; i++) {
                var room = rooms[i];
                if(room.containsOnlyUsers(users)) {
                    if((users.length == 2 && room.type() == RoomType1to1) || (users.length != 2 && room.type() == RoomTypeGroup)) {
                        roomsWithUsers.push(room);
                    }
                }
            }
            return roomsWithUsers;
        },

        roomsSortedByMostRecent: function (rooms) {
            rooms.sort(function (a, b) {
                var at = a.lastMessageMeta ? a.lastMessageMeta[messageTime] : a.created();
                var bt = b.lastMessageMeta ? b.lastMessageMeta[messageTime] : b.created();

                return bt - at;
            });
            return rooms;
        },

        indexOf: function (array, id, getID) {
            for(var i = 0; i < array.length; i++) {
                if(id == getID(array[i])) {
                    return i;
                }
            }
        },

        removeItem: function (array, id, getID) {
            if(array.length == 0) {
                return;
            }
            var i = this.indexOf(array, id, getID);
            array.splice(i, 1);
        },

        getItem: function (array, id, getID) {
            if(array.length == 0) {
                return null;
            }
            var i = this.indexOf(array, id, getID);
            return array[i];
        },

        contains: function (array, obj) {
            for(var i = 0; i < array.length; i++) {
                if(obj == array[i]) {
                    return true;
                }
            }
            return false;
        },

        remove: function (array, obj) {
            for(var i = 0; i < array.length; i++) {
                if(obj == array[i]) {
                    array.splice(i, 1);
                    break;
                }
            }
        },

        filterByKey: function (array, key, getKey) {
            if(!key || key.length == 0 || key === "") {
                return array;
            }
            else {
                // Loop over all elements
                var result = [];
                var elm, t1, t2;
                for(var i = 0; i < array.length; i++) {

                    elm = array[i];
                    // Switch to lower case and remove spaces
                    // to improve search results
                    var elmKey = getKey(elm);
                    if (!Utils.unORNull(key) && !Utils.unORNull(elmKey)) {
                        t1 = key.toLowerCase().replace(/ /g,'');
                        t2 = elmKey.toLowerCase().replace(/ /g,'');
                        if(t2.length >= t1.length && t2.substring(0, t1.length) == t1) {
                            result.push(elm);
                        }
                    }
                }
                return result;
            }
        },

        objectToArray: function (object) {
            var array = [];
            for(var key in object) {
                if(object.hasOwnProperty(key)) {
                    array.push(object[key]);
                }
            }
            return array;
        },
    }
}]);