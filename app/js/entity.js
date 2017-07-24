/**
 * Created by benjaminsmiley-andrews on 06/03/15.
 */

var myApp = angular.module('myApp.entity', ['firebase']);

myApp.factory('Entity', ['$q', 'Paths', function ($q, Paths) {

    function Entity (path, id) {
        this._path = path;
        this._id = id;
        this.pathIsOn = {};
        this.state = {};
    }

    Entity.prototype = {

        /**
         * Start listening to a path
         * This method first adds a listener to the state ref. It then only
         * adds a listener to the data path if the saved state is out of date
         *
         * @param key - the data key i.e. meta, blocked, friends, messages etc...
         * @param callback - The callback is called each time the value changes
         * @returns promise - the promise is resolved when the it's confirmed that
         *                    the state of the local data is up to date
         */
        pathOn: function (key, callback) {

            var deferred = $q.defer();

            // Check to see if this path has already
            // been turned on
            if(this.pathIsOn[key]) {
                deferred.resolve();
                return deferred.promise;
            }
            this.pathIsOn[key] = true;

            // Start listening to the state
            var stateRef = this.stateRef(key);

            stateRef.off('value');

            // TODO: There seems to be a bug with Firebase
            // when we call push this method is called twice
            stateRef.on('value', (function (snapshot) {

                var time = snapshot.val();

                if(DEBUG) console.log('Entity ID: ' + this._id + ' Key: ' + key);
                if(DEBUG) console.log('Time: ' + time + ' State time: ' + this.state[key]);

                // If the state isn't set either locally or remotely
                // or if it is set but the timestamp is lower than the remove value
                // add a listener to the value
                if((!time || !this.state[key]) || (time && time > this.state[key])) {

                    // Assume that the we will be able to get
                    // the latest version of the data so prevent any
                    // new requests
                    this.state[key] = time;

                    // Get the ref
                    var ref = this.pathRef(key);

                    // Add the value listener
                    ref.once('value', (function (snapshot) {
                        if (callback) {
                            callback(snapshot.val());
                            deferred.resolve();
                        }
                    }).bind(this));
                }
                else {
                    deferred.resolve();
                }

            }).bind(this));

            return deferred.promise;
        },

        pathOff: function (key) {

            this.pathIsOn[key] = false;

            this.stateRef(key).off('value');
            this.pathRef(key).off('value');
        },

        ref: function () {
            return Paths.firebase().child(this._path).child(this._id);
        },

        pathRef: function (path) {
            return this.ref().child(path);
        },

        stateRef: function (key) {
            return this.ref().child(bUpdatedPath).child(key);
        },

        updateState: function (key) {

            var deferred = $q.defer();

            var ref = this.stateRef(key);
            ref.set(firebase.database.ServerValue.TIMESTAMP, function () {
                deferred.resolve();
            });

            return deferred.promise;
        },

        serialize: function () {
            return {
                _path: this._path,
                _id: this._id,
                state: this.state
            }
        },

        deserialize: function (se) {
            if(se) {
                this._path = se._path;
                this._id = se._id;
                this.state = se.state ? se.state : {};
            }
        }
    };

    Entity.ref = function (path, id) {
        return Paths.firebase().child(path).child(id);
    };

    Entity.stateRef = function (path, id, key) {
        return this.ref(path, id).child(bUpdatedPath).child(key);
    };

    Entity.updateState = function (path, id, key) {

        var deferred = $q.defer();

        var ref = this.stateRef(path, id, key);
        ref.set(firebase.database.ServerValue.TIMESTAMP, (function (error) {
            if(!error) {
                deferred.resolve();
            }
            else {
                deferred.reject();
            }
        }).bind(this));

        return deferred.promise;
    };

    return Entity;

}]);