import * as angular from 'angular'
import {AllEmojis} from "../keys/all-emojis";

angular.module('myApp.filters').filter("emoji", function () {
    return function (input) {

        if(!input) {
            input = "";
        }

        let replaceAll = (target, search, replacement) => {
            return target.split(search).join(replacement);
        };

        input = input + " ";

        input = replaceAll(input, ':s ', ':confused:');
        input = replaceAll(input, ':S ', ':confused:');
        input = replaceAll(input, ':-s ', ':confused:');
        input = replaceAll(input, ':-S ', ':confused:');

        input = replaceAll(input, ':o ', ':open_mouth:');
        input = replaceAll(input, ':O ', ':open_mouth:');
        input = replaceAll(input, ':-o ', ':open_mouth:');
        input = replaceAll(input, ':-O ', ':open_mouth:');

        input = replaceAll(input, ':) ', ':smile:');
        input = replaceAll(input, ':-) ', ':smile:');

        input = replaceAll(input, '&lt;3 ', ':heart:');


        input = replaceAll(input, ';) ', ':wink:');
        input = replaceAll(input, ';-) ', ':wink:');

        input = replaceAll(input, ":'( ", ':cry:');

        input = replaceAll(input, ':-( ', ':frowning:');

        input = replaceAll(input, ':p ', ':stuck_out_tongue:');
        input = replaceAll(input, ':P ', ':stuck_out_tongue:');
        input = replaceAll(input, ':-p ', ':stuck_out_tongue:');
        input = replaceAll(input, ':-P ', ':stuck_out_tongue:');

        input = replaceAll(input, ';P ', ':stuck_out_tongue_winking_eye:');
        input = replaceAll(input, ';P ', ':stuck_out_tongue_winking_eye:');
        input = replaceAll(input, ';-p ', ':stuck_out_tongue_winking_eye:');
        input = replaceAll(input, ';-P ', ':stuck_out_tongue_winking_eye:');

        input = replaceAll(input, '(h) ', ':sunglasses:');
        input = replaceAll(input, '(H) ', ':sunglasses:');

        input = replaceAll(input, '(a) ', ':angel:');
        input = replaceAll(input, '(A) ', ':angel:');

        input = replaceAll(input, ':# ', ':no_mouth:');
        input = replaceAll(input, ':-# ', ':no_mouth:');

        input = replaceAll(input, ':d ', ':grin:');
        input = replaceAll(input, ':D ', ':grin:');
        input = replaceAll(input, ':-d ', ':grin:');
        input = replaceAll(input, ':-D ', ':grin:');

        input = replaceAll(input, ':* ', ':kissing:');
        input = replaceAll(input, ':-* ', ':kissing:');

        input = replaceAll(input, '(kiss) ', ':kiss:');

        input  = input.trim();

        return input.replace(AllEmojis, (match, text) => {
            return "<i class='emoji emoji_" + text + "' title=':" + text + ":'>" + text + "</i>";
        });
    };
});
