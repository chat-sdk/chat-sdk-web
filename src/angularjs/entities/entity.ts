import * as angular from 'angular';
import * as firebase from 'firebase';

import * as PathKeys from '../keys/path-keys';
import * as Defines from '../keys/defines';
import { IPaths } from '../network/paths';
import { Emoji } from '../services/emoji';
import { Utils } from '../services/utils';
import { IStringAnyObject } from '../interfaces/string-any-object';

export interface IEntity {
    serialize(): IStringAnyObject
    setMeta(meta: any): void
    getMetaObject (): IStringAnyObject
    getMeta(): Map<string, any>
    updateState(key: string): Promise<any>
    removeOnDisconnect (path: string): Promise<any>
}

export class Entity implements IEntity {

    protected meta = new Map<string, any>();
    protected _path: string;
    protected _id: string;
    pathIsOn: { [key: string]: boolean } = {};
    state: IStringAnyObject = {};

    // static $inject = ['$q', 'Paths'];
    constructor(
        protected Paths: IPaths,
        path: string,
        id: string
    ) {
        this._path = path;
        this._id = id;
    }

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
    pathOn(key: string, callback: (value: IStringAnyObject) => void): Promise<any> {
        return new Promise((resolve, reject) => {
            // Check to see if this path has already
            // been turned on
            if (this.pathIsOn[key]) {
                resolve();
            } else {
                this.pathIsOn[key] = true;

                // Start listening to the state
                let stateRef = this.stateRef(key);

                stateRef.off('value');

                // TODO: There seems to be a bug with Firebase
                // when we call push this method is called twice
                stateRef.on('value', (snapshot) => {

                    let time = snapshot.val();

                    if (Defines.DEBUG) console.log('Entity ID: ' + this._id + ' Key: ' + key);
                    if (Defines.DEBUG) console.log('Date: ' + time + ' State time: ' + this.state[key]);

                    // If the state isn't set either locally or remotely
                    // or if it is set but the timestamp is lower than the remove value
                    // add a listener to the value
                    if ((!time || !this.state[key]) || (time && time > this.state[key])) {

                        // Assume that the we will be able to get
                        // the latest version of the data so prevent any
                        // new requests
                        this.state[key] = time;

                        // Get the ref
                        let ref = this.pathRef(key);

                        // Add the value listener
                        // TODO: Check this
                        resolve(ref.once('value', (snapshot) => {
                            if (callback) {
                                callback(snapshot.val());
                                resolve();
                            }
                        }));
                    }
                    else {
                        resolve();
                    }
                }, (error: Error) => {
                    console.log(error.message);
                    reject(error);
                });
            }
        });
    }

    // This method strips the root of the Firebase reference to give a relative
    // path for batch writes
    relativeFirebasePath(ref: firebase.database.Reference): string {
        return ref.toString().replace(this.Paths.firebase().toString(), "");
    }

    pathOff(key: string) {
        this.pathIsOn[key] = false;

        this.stateRef(key).off('value');
        this.pathRef(key).off('value');
    }

    ref(): firebase.database.Reference {
        return this.Paths.firebase().child(this._path).child(this._id);
    }

    removeOnDisconnect(path: string): Promise<any> {
        return this.ref().child(path).onDisconnect().remove();
    }

    pathRef(path: string) {
        return this.ref().child(path);
    }

    stateRef(key: string) {
        return this.ref().child(PathKeys.UpdatedPath).child(key);
    }

    updateState(key: string): Promise<any> {
        const ref = this.stateRef(key);
        return ref.set(firebase.database.ServerValue.TIMESTAMP);
    }

    setMeta(meta: Map<string, any> | IStringAnyObject): void {
        if (meta instanceof Map) {
            this.meta = meta;
        } else {
            this.meta = new Map(Object.entries(meta));
        }
    };

    getMetaObject(): IStringAnyObject {
        return Utils.toObject(this.meta);
    }

    getMeta(): Map<string, any> {
        return this.meta;
    }

    metaValue(key: string) {
        if (this.getMeta()) {
            return this.getMeta().get(key);
        }
        return null;
    };

    getMetaValue(key: string) {
        return this.metaValue(key);
    };

    setMetaValue(key: string, value: any) {
        this.getMeta().set(key, value);
    };

    serialize(): IStringAnyObject {
        return {
            _path: this._path,
            _id: this._id,
            state: this.state,
            meta: this.getMetaObject()
        }
    }

    deserialize(se: IStringAnyObject) {
        if (se) {
            this._path = se._path;
            this._id = se._id;
            this.state = se.state ? se.state : {};
            this.setMeta(se.meta);
        }
    }

}

export class EntityFactory {

    static $inject = ['$q', 'Paths'];

    constructor(
        protected $q: ng.IQService,
        protected Paths: IPaths
    ) { }

    ref(path: string, id: string) {
        return this.Paths.firebase().child(path).child(id);
    }

    stateRef(path: string, id: string, key: string) {
        return this.ref(path, id).child(PathKeys.UpdatedPath).child(key);
    }

    updateState(path: string, id: string, key: string) {

        const deferred = this.$q.defer();

        const ref = this.stateRef(path, id, key);
        ref.set(firebase.database.ServerValue.TIMESTAMP, (error) => {
            if (!error) {
                deferred.resolve();
            }
            else {
                deferred.reject();
            }
        });

        return deferred.promise;
    }}

angular.module('myApp.services')
    .service('Entity', ['Paths', function(Paths: IPaths) {
    // we can ask for more parameters if needed
    return function entityFactory(path: string, id: string) { // return a factory instead of a new talker
        return new Entity(Paths, path, id);
    }}])
    .service('EntityFactory', EntityFactory);
