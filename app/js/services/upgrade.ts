import * as angular from 'angular'
import * as PathKeys from "../keys/path-keys";

export interface IUpgrade {

}

angular.module('myApp.services').factory('Upgrade', ['$q', 'Paths', function ($q, Paths) {
    return {
        // This should be called after the user has selected
        update_user_to_1_0_5: function (user) {
            var array;
            var promises = [];
            if(user.meta && user.meta.friends) {
                array = user.meta.friends;
                for(var key in array) {
                    if(array.hasOwnProperty(key)) {
                        promises.push(user.addFriendWithUID(array[key].uid));
                    }
                }
                // Now remove the friends reference
                var deferred = $q.defer();
                var ref = Paths.userMetaRef(user.uid()).child(PathKeys.FriendsPath);
                ref.remove((function (error) {
                    if(error) {
                        deferred.reject(error);
                    }
                    else {
                        deferred.resolve();
                    }
                }).bind(this));
                promises.push(deferred.promise);
            }
            if(user.meta && user.meta.blocked) {
                array = user.meta.blocked;
                for(var key in array) {
                    if(array.hasOwnProperty(key)) {
                        promises.push(user.blockUserWithUID(array[key].uid));
                    }
                }
                // Now remove the friends reference
                deferred = $q.defer();
                ref = Paths.userMetaRef(user.uid()).child(PathKeys.BlockedPath);
                ref.remove(function (error) {
                    if(error) {
                        deferred.reject(error);
                    }
                    else {
                        deferred.resolve();
                    }
                });
                promises.push(deferred.promise);
            }
            return $q.all(promises);
        }
    }
}]);