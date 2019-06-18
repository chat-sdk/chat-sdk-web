import * as angular from 'angular'
/**
 * This service allows us to flag a room to be opened. This
 * is useful because when we create a new room it's turned
 * on in the impl_roomAdded function. We want to be able
 * to flag it to be opened from anywhere and then let
 * that function open it
 */
angular.module('myApp.services').factory('RoomOpenQueue', [function () {
    return {

        rids: [],

        addRoomWithID: function (rid) {
            if(this.rids.indexOf(rid) <0) {
                this.rids.push(rid);
            }
        },

        roomExistsAndPop: function (rid) {
            var index = this.rids.indexOf(rid);
            if(index >= 0) {
                this.rids.splice(index, 1);
                return true;
            }
            return false;
        }
    };
}]);