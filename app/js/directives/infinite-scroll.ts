import * as angular from 'angular'

angular.module('myApp.directives').directive('infiniteScroll', [function() {

        return function(scope, elem, attrs) {

            var handler = (function () {

                var scrollHeight = elem.prop('scrollHeight');
                var scrollTop = elem.scrollTop();
                var height = elem.height();

                var top = scrollTop;
                var bottom = scrollHeight - scrollTop - height;

                if(top < 1 && scrollHeight > height) {
                    scope.room.loadMoreMessages(function () {
                        // Set the bottom distance based on the new height
                        elem.scrollTop(elem.prop('scrollHeight') - height - bottom);
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