import * as angular from 'angular'

export interface IPathAnalyser {

}

class PathAnalyser implements IPathAnalyser {

    toAscii(string): string {
        let output = "";
        for(let i = 0; i < string.length; i++) {
            output += string.charCodeAt(i);
        }
        return output;
    }

    searchPath(query): boolean {

        query = query.trim();

        // First see if the query has any wildcards. The * is a wildcard
        // and can be used at the start or end of the query
        let wildPrefix = false;
        if(query.length) {
            wildPrefix = query[0] == '*';
        }
        let wildSuffix = false;
        if(query.length) {
            wildSuffix = query[query.length - 1] == '*';
        }
        if(wildPrefix) {
            query = query.substring(1);
        }
        if(wildSuffix) {
            query = query.substring(0, query.length - 1);
        }

        // Now convert to ascii. We do this because otherwise the special
        // characters in the domain can mess up the regex search
        query = (wildPrefix ? '' : '/^') + this.toAscii(query) + (wildSuffix ? '.*' : '$');

        // Now get the path
        let path = this.toAscii(document.location.href);
        // First we check to see if the query has wild cards

        return path.search(query)!= -1;
    }

    shouldShowChatOnPath(paths): boolean {
        // Check to see if we should load the chat on this page?
        let matches = false;

        paths = paths.split(',');

        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            if (this.searchPath(path)) {
                matches = true;
                break;
            }
        }
        return matches;
    }
}

angular.module('myApp.services').service('PathAnalyser', PathAnalyser);