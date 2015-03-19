/**
 * Created by benjaminsmiley-andrews on 06/03/15.
 */

var myApp = angular.module('myApp.entity', ['firebase']);

myApp.factory('Entity', ['$q', '$rootScope', function ($q, $rootScope) {

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
         * @returns promise - the promise is resolved when the it's confirmed that
         *                    the state of the local data is up to date
         */
        pathOn: function (key, callback) {

            var deferred = $q.defer();

            //console.log("Meta: " + this.meta.uid + ", pathIsOn: " + JSON.stringify(this.pathIsOn));

            // Check to see if this path has already
            // been turned on
            if(this.pathIsOn[key]) {
                deferred.resolve();
                return deferred.promise;
            }
            this.pathIsOn[key] = true;

            //console.log("Meta: " + this.meta.uid + ", ON ");

            // Start listening to the state
            var stateRef = this.stateRef(key);

            stateRef.off('value');

            //if(this._path == bRoomsPath) {
            //    console.log('Entity ID: ' + entity._id + ' Key: ' + key);
            //    console.log('Ref: ' + stateRef.toString());
            //}

            // TODO: There seems to be a bug with Firebase
            // when we call push this method is called twice
            stateRef.on('value', (function (snapshot) {

                var time = snapshot.val();

                //                     if(this._path == bRoomsPath) {
                if(DEBUG) console.log('Entity ID: ' + this._id + ' Key: ' + key);
                if(DEBUG) console.log('Time: ' + time + ' State time: ' + this.state[key]);
                //                    }

                //                    if(this._id == "2222222222222222222222222222222222222222:2") {
                //                        console.log("Test");
                //                    }

                // If the state isn't set either locally or remotely
                // or if it is set but the timestamp is lower than the remove value
                // add a listener to the value
                if((!time || !this.state[key]) || (time && time > this.state[key])) {

                    //if(this._path == bRoomsPath) {
                    if(DEBUG) console.log("LOAD");
                    //}

                    // Assume that the we will be able to get
                    // the latest version of the data so prevent any
                    // new requests
                    //var oldTime = this.state[key];
                    this.state[key] = time;

                    // Get the ref
                    var ref = this.pathRef(key);

                    // Make sure the listener isn't added twice
                    //ref.off('value');

                    // Add the value listener
                    ref.once('value', (function (snapshot) {
                        //if(snapshot.val()) {
                        if(callback) {
                            callback(snapshot.val());
                        }
                        //}
                        //else {
                        // If the call failed we need to do it again
                        //    this.state[key] = oldTime;
                        //}
                        deferred.resolve();

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
            return this.ref().child(bStatePath).child(key);
        },

        updateState: function (key) {

            var deferred = $q.defer();

            var ref = this.stateRef(key);
            ref.set(Firebase.ServerValue.TIMESTAMP, function (error) {
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
        return this.ref(path, id).child(bStatePath).child(key);
    };

    Entity.updateState = function (path, id, key) {

        var deferred = $q.defer();

        var ref = this.stateRef(path, id, key);
        ref.set(Firebase.ServerValue.TIMESTAMP, (function (error) {
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

//    return {
//
//
//        newEntity: function (path, id) {
//
//
//            var entity = {
//                _path: path,
//                _id: id,
//                pathIsOn: {},
//                state: {}
//            };
//
//            /**
//             * Start listening to a path
//             * This method first adds a listener to the state ref. It then only
//             * adds a listener to the data path if the saved state is out of date
//             *
//             * @param key - the data key i.e. meta, blocked, friends, messages etc...
//             * @returns promise - the promise is resolved when the it's confirmed that
//             *                    the state of the local data is up to date
//             */
//            entity.pathOn = function (key, callback) {
//
//                var deferred = $q.defer();
//
//                // Check to see if this path has already
//                // been turned on
//                if(entity.pathIsOn[key]) {
//                    deferred.resolve();
//                    return deferred.promise;
//                }
//                entity.pathIsOn[key] = true;
//
//                // Start listening to the state
//                var stateRef = entity.stateRef(key);
//
//                stateRef.off('value');
//
//                //if(entity._path == bRoomsPath) {
//                //    console.log('Entity ID: ' + entity._id + ' Key: ' + key);
//                //    console.log('Ref: ' + stateRef.toString());
//                //}
//
//                // TODO: There seems to be a bug with Firebase
//                // when we call push this method is called twice
//                stateRef.on('value', (function (snapshot) {
//
//                    var time = snapshot.val();
//
////                     if(entity._path == bRoomsPath) {
//                        if(DEBUG) console.log('Entity ID: ' + entity._id + ' Key: ' + key);
//                        if(DEBUG) console.log('Time: ' + time + ' State time: ' + entity.state[key]);
////                    }
//
////                    if(entity._id == "2222222222222222222222222222222222222222:2") {
////                        console.log("Test");
////                    }
//
//                    // If the state isn't set either locally or remotely
//                    // or if it is set but the timestamp is lower than the remove value
//                    // add a listener to the value
//                    if((!time || !entity.state[key]) || (time && time > entity.state[key])) {
//
//                        //if(entity._path == bRoomsPath) {
//                        if(DEBUG) console.log("LOAD");
//                        //}
//
//                        // Assume that the we will be able to get
//                        // the latest version of the data so prevent any
//                        // new requests
//                        //var oldTime = entity.state[key];
//                        entity.state[key] = time;
//
//                        // Get the ref
//                        var ref = entity.pathRef(key);
//
//                        // Make sure the listener isn't added twice
//                        //ref.off('value');
//
//                        // Add the value listener
//                        ref.once('value', (function (snapshot) {
//                            //if(snapshot.val()) {
//                                if(callback) {
//                                    callback(snapshot.val());
//                                }
//                            //}
//                            //else {
//                                // If the call failed we need to do it again
//                            //    entity.state[key] = oldTime;
//                            //}
//                            deferred.resolve();
//
//                        }).bind(this));
//                    }
//                    else {
//                        deferred.resolve();
//                    }
//                }).bind(this));
//
//                return deferred.promise;
//            };
//
//            entity.pathOff = function (key) {
//
//                entity.pathIsOn[key] = false;
//
//                entity.stateRef(key).off('value');
//                entity.pathRef(key).off('value');
//            };
//
//            entity.ref = function () {
//                return Paths.firebase().child(entity._path).child(entity._id);
//            };
//
//            entity.pathRef = function (path) {
//                return entity.ref().child(path);
//            };
//
//            entity.stateRef = function (key) {
//                return entity.ref().child(bStatePath).child(key);
//            };
//
//            entity.updateState = function (key) {
//
//                var deferred = $q.defer();
//
//                var ref = entity.stateRef(key);
//                ref.set(Firebase.ServerValue.TIMESTAMP, function (error) {
//                    deferred.resolve();
//                });
//
//                return deferred.promise;
//            };
//
//            entity.serialize = function () {
//                return {
//                    _path: entity._path,
//                    _id: entity._id,
//                    state: entity.state
//                }
//            };
//
//            entity.deserialize = function (se) {
//                if(se) {
//                    entity._path = se._path;
//                    entity._id = se._id;
//                    entity.state = se.state ? se.state : {};
//                }
//            };
//
//            return entity;
//        },
//
//
//    };


}]);