import * as $ from 'jquery'
import * as angular from 'angular'
import {IRoomScope} from "../controllers/chat";

angular.module('myApp.directives').directive('infiniteScroll', [function() {

        return function(scope: IRoomScope, elem, attrs) {

            let handler = (function () {

                let scrollHeight = elem.prop('scrollHeight');
                let scrollTop = $(elem).scrollTop();
                let height = $(elem).height();

                let top = scrollTop;
                let bottom = scrollHeight - scrollTop - height;

                if(top < 1 && scrollHeight > height) {
                    scope.room.loadMoreMessages(function () {
                        // Set the bottom distance based on the new height
                        $(elem).scrollTop(elem.prop('scrollHeight') - height - bottom);
                    });
                }
            }).bind(this);

            elem.on('scroll', handler);

            scope.$on('$destroy', function() {
                return elem.off('scroll', handler);
            });
        }
    }
]);