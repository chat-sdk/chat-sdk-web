import * as angular from 'angular'
import * as Defines from "../keys/defines";

export interface ILog {
    notification (notification: string, context: string): void;
}

export class Log implements ILog {
    notification (notification, context) {
        if(Defines.DEBUG) {
            if(!context) {
                context = ""
            } else {
                context = ", context: " + context
            }
            console.log("Notification: " + notification + context)
        }
    }
}

angular.module('myApp.services').service('Log', Log);

