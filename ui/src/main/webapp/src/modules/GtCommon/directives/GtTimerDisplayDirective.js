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
        .module('GtCommon')
        .directive('gtTimerDisplay', GtTimerDisplayDirective);


function GtTimerDisplayDirective() {
    return {
        scope: {
            heading: '@',
            subHeading: '@',
            flattenedTimers: '=',
            treeTimers: '=',
            transactionCount: '='
        },
        templateUrl: 'modules/GtCommon/templates/GtTimerDisplay.html',
        link: function (scope) {

            function buildTotalNanosList(timers) {
                var totalNanosList = [];
                angular.forEach(timers, function (timer) {
                    totalNanosList.push(timer.totalNanos);
                });
                totalNanosList.sort(function (a, b) {
                    return b - a;
                });
                return totalNanosList;
            }

            var flattenedTotalNanosList = [];
            var treeTotalNanosList = [];

            scope.limit = 10;

            function updateLimit() {
                scope.ftShowMore = scope.limit < scope.flattenedTimers.length;
                scope.ttShowMore = scope.limit < scope.treeTimers.length;
                scope.showLess = scope.limit !== 10;

                function updateLimitOne(timers, totalNanosList) {
                    var limit = Math.min(scope.limit, totalNanosList.length);
                    var thresholdNanos = totalNanosList[limit - 1];
                    var count = 0;
                    angular.forEach(timers, function (timer) {
                        // count is to handle multiple timers equal to the threshold
                        timer.show = timer.totalNanos >= thresholdNanos && count++ < scope.limit;
                    });
                }

                updateLimitOne(scope.flattenedTimers, flattenedTotalNanosList);
                updateLimitOne(scope.treeTimers, treeTotalNanosList);
            }

            scope.$watch('flattenedTimers', function () {
                // the timer list changes each time the chart is refreshed
                flattenedTotalNanosList = buildTotalNanosList(scope.flattenedTimers);
                treeTotalNanosList = buildTotalNanosList(scope.treeTimers);
                updateLimit();
            });

            scope.clickShowMore = function () {
                scope.limit *= 2;
                updateLimit();
            };

            scope.clickShowLessFT = function () {
                scope.limit /= 2;
                while (scope.limit >= scope.flattenedTimers.length) {
                    // show less should always leave displayed list less than full list
                    scope.limit /= 2;
                }
                updateLimit();
            };

            scope.clickShowLessTT = function () {
                scope.limit /= 2;
                updateLimit();
            };

            scope.clickShowAll = function () {
                while (scope.limit < scope.treeTimers.length) {
                    scope.limit *= 2;
                }
                updateLimit();
            };
        }
    };
}
