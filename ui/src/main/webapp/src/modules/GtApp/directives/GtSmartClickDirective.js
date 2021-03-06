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
        .directive('gtSmartClick', GtSmartClickDirective);


function GtSmartClickDirective() {
    return {
        scope: {
            gtSmartClick: '&'
        },
        link: function (scope, iElement) {
            iElement.mousedown(function (e) {
                scope.mousedownPageX = e.pageX;
                scope.mousedownPageY = e.pageY;
            });
            iElement.click(function (event, keyboard) {
                if (!keyboard && (Math.abs(event.pageX - scope.mousedownPageX) > 5
                        || Math.abs(event.pageY - scope.mousedownPageY) > 5)) {
                    // not a simple single click, probably highlighting text
                    return;
                }
                scope.$apply(function () {
                    scope.gtSmartClick({$event: event});
                });
            });
        }
    };
}
