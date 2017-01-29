/*
 * Copyright 2012-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

window.Glowroot = (function () {

    function showAndFadeMessage(selector, delay) {
        $(selector).each(function () {
            // handle crazy user clicking on the button
            var $this = $(this);
            if ($this.data('gtTimeout')) {
                clearTimeout($this.data('gtTimeout'));
            }
            $this.stop().animate({opacity: '100'});
            $this.removeClass('hide');
            var outerThis = this;
            $this.data('gtTimeout', setTimeout(function () {
                fadeOut(outerThis, 1000);
            }, delay));
        });
    }

    function cancelFadeMessage(selector) {
        $(selector).each(function () {
            var $this = $(this);
            if ($this.data('gtTimeout')) {
                clearTimeout($this.data('gtTimeout'));
            }
            $this.stop().animate({opacity: '100'});
            $this.removeClass('hide');
        });
    }

    function fadeOut(selector, duration) {
        // fade out and then override jquery behavior and use hide class instead of display: none
        var $selector = $(selector);
        $selector.fadeOut(duration, function () {
            $selector.addClass('hide');
            $selector.css('display', '');
        });
    }

    function showSpinner(selector, callbackOnStart) {
        var element = $(selector)[0];
        // z-index should be less than navbar (which is 1030)
        var spinner = new Spinner({lines: 9, radius: 8, width: 5, zIndex: 1020});

        // small delay so that if there is an immediate response the spinner doesn't blink
        var timer = setTimeout(function () {
            $(element).removeClass('hide');
            spinner.spin(element);
            if (callbackOnStart) {
                callbackOnStart();
            }
        }, 100);

        return {
            stop: function () {
                clearTimeout(timer);
                $(element).addClass('hide');
                spinner.stop();
            }
        };
    }

    return {
        showAndFadeSuccessMessage: function (selector) {
            showAndFadeMessage(selector, 1500);
        },
        cancelFadeSuccessMessage: cancelFadeMessage,
        fadeOut: fadeOut,
        showSpinner: showSpinner
    };
})();

