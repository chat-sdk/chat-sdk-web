import * as $ from 'jquery';
import * as angular from 'angular';

import { IRoomScope } from '../controllers/chat';

class InfiniteScroll implements ng.IDirective {

    static $inject = ['$timeout'];

    private loading = false;
    private scrollHeight: number;
    private scrollTop: number;
    private lastScrollTop: number;
    private height: number;
    private top: number;
    private bottom: number;
    private timer: any;
    private silent = false;

    constructor(
        private $timeout: ng.ITimeoutService
    ) { }

    link(scope: IRoomScope, element: JQLite) {
        element.on('scroll', () => {
            this.onScroll(scope, element)
        });

        scope.$on('$destroy', () => {
            return element.off('scroll', () => {
                this.onScroll(scope, element)
            });
        });
    };

    loadMoreMessages(scope: IRoomScope, elem) {
        this.loading = true;

        const $elem = $(elem);

        console.log('2 - Height: '+ this.height +', Scroll height: ' + this.scrollHeight + ', top: ' + this.scrollTop);

        const scrollHeight = this.scrollHeight;

        // this.silent = true;

        scope.room.loadMoreMessages().then(messages => {
            this.$timeout(() => {
                let top = elem.prop('scrollHeight');

                // console.log('3 - Height: ' + $elem.height() + ', Scroll height: ' + top + ', top: ' + $elem.scrollTop());

                if (messages && messages.length && $elem.scrollTop() == 0) {
                    $elem.stop();
                    this.setScrollTopSilent(elem, top - scrollHeight);
                }

                this.loading = false;
            });
        });

    }

    onScroll(scope: IRoomScope, elem): void {

        const $elem = $(elem);

        if (this.silent) {
            this.silent = false;
            return;
        }

        if (this.timer) {
            this.$timeout.cancel(this.timer);
            this.timer = null;
        }

        this.timer = this.$timeout(() => {
            this.onScrollFinished(scope, elem)
        }, 100);

        this.scrollHeight = elem.prop('scrollHeight');
        this.scrollTop = $elem.scrollTop();
        this.height = $elem.height();

        this.top = this.scrollTop;
        this.bottom = this.scrollHeight - this.scrollTop - this.height;


        // Only load more messages when we're scrolling up
        if (this.scrollTop < this.lastScrollTop) {
            if(this.top / this.scrollHeight < 0.5 && !this.loading) {
                this.loadMoreMessages(scope, elem);
            }
        }

        // For Mobile or negative scrolling
        this.lastScrollTop = this.scrollTop <= 0 ? 0 : this.scrollTop;
    };

    onScrollFinished(scope: IRoomScope, elem): void {
        this.$timeout.cancel(this.timer);

        const $elem = $(elem);

        // this.silent = false;
        if ($elem.scrollTop() == 0) {

            this.loadMoreMessages(scope, elem);

        //
        //     const scrollHeight = elem.prop('scrollHeight');
        //
        //     scope.room.loadMoreMessages().then(messages => {
        //         this.$timeout(() => {
        //             if (messages && messages.length) {
        //                 const top = elem.prop('scrollHeight') - scrollHeight;
        //
        //                 console.log('Set scroll top: ' + top);
        //
        //                 this.silent = true;
        //                 $elem.scrollTop(top)
        //             }
        //         })
        //     })
        //
        //     // this.silent = true;
        //     // this.loadMoreMessages(scope, elem)
        }
    }

    setScrollTopSilent(elem, position: number): void {
        this.silent = true;
        $(elem).scrollTop(position)
    }

    static factory(): ng.IDirectiveFactory {
        return ($timeout: ng.ITimeoutService) => new InfiniteScroll($timeout);
    }

}

angular.module('myApp.directives').directive('infiniteScroll', InfiniteScroll.factory());
