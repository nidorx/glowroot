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


/* global angular, Glowroot, $, Spinner, moment */

angular
        .module('GtApp')
        .directive('gtSpinner', GgtSpinnerDirective);


function GgtSpinnerDirective() {
    return function (scope, iElement, iAttrs) {
        var spinner;
        var timer;
        iElement.addClass('hide');
        scope.$watch(iAttrs.gtShow,
                function (newValue) {
                    if (newValue) {
                        if (spinner) {
                            return;
                        }
                        var left;
                        if (iAttrs.gtSpinnerInline) {
                            left = 10;
                        }
                        // z-index should be less than navbar (which is 1030)
                        spinner = new Spinner({lines: 9, radius: 8, width: 5, left: left, zIndex: 1020});
                        if (iAttrs.gtNoDelay) {
                            iElement.removeClass('hide');
                            spinner.spin(iElement[0]);
                        } else {
                            // small delay so that if there is an immediate response the spinner doesn't blink
                            //
                            // must clear previous timer, e.g. in case multiple keystrokes are entered on typeahead
                            // inside of 100 milliseconds
                            clearTimeout(timer);
                            timer = setTimeout(function () {
                                iElement.removeClass('hide');
                                spinner.spin(iElement[0]);
                            }, 100);
                        }
                    } else if (spinner !== undefined) {
                        clearTimeout(timer);
                        iElement.addClass('hide');
                        spinner.stop();
                        spinner = undefined;
                    }
                });
    };
}