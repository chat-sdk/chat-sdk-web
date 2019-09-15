import * as angular from 'angular';

import { IEnvironment } from './environment';

export interface ICloudImage {
    cloudImage(url: string, w: number, h: number): string;
}

class CloudImage implements ICloudImage {

    private cloudImageToken: string;

    static $inject = ['Environment'];

    constructor(Environment: IEnvironment) {
        this.cloudImageToken = Environment.cloudImageToken();
    }

    cloudImage(url: string, w: number, h: number): string {
        return 'http://' + this.cloudImageToken + '.cloudimg.io/s/crop/'+w+'x'+h+'/' + url;
    }

}

angular.module('myApp.controllers').service('CloudImage', CloudImage);
