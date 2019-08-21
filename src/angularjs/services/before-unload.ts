import * as angular from 'angular'

export interface IBeforeUnload {
    addListener(listener: IBeforeUnloadListener): void
    removeListener(listener: IBeforeUnloadListener): void
}

export interface IBeforeUnloadListener {
    beforeUnload(): void
}

class BeforeUnload implements IBeforeUnload {

    listeners = new Array<IBeforeUnloadListener>();

    static $inject = ['$window'];

    constructor ($window: ng.IWindowService) {
        let beforeUnloadHandler = (e) => {
            let listener = null;
            for(let i = 0; i < this.listeners.length; i++) {
                listener = this.listeners[i];
                try {
                    listener.beforeUnload();
                }
                catch (e) {

                }
            }
        };

        if ($window.addEventListener) {
            $window.addEventListener('beforeunload', beforeUnloadHandler);
        } else {
            $window.onbeforeunload = beforeUnloadHandler;
        }
    }

    addListener(listener: IBeforeUnloadListener): void {
        if(this.listeners.indexOf(listener) == -1 && listener.beforeUnload) {
            this.listeners.push(listener);
        }
    }

    removeListener(listener: IBeforeUnloadListener): void {
        let index = this.listeners.indexOf(listener);
        if(index >= 0) {
            this.listeners.splice(index, 1);
        }
    }
}

angular.module('myApp.services').service('BeforeUnload', BeforeUnload);