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

angular
        .module('GtTrace')
        .directive('traceEntryBar', TraceEntryBarDirective);

TraceEntryBarDirective.$inject = ['$filter'];

function TraceEntryBarDirective($filter) {

    var traceEntryBarWidth = 50;
    var nanosToMilles = $filter('gtNanosToMillis');

    return {
        scope: {
            entry: '=',
            traceDurationNanos: '='
        },
        templateUrl: 'modules/GtTrace/templates/TraceEntryBar.html',
        link: function ($scope, $el, $attrs) {


            $scope.title = 'offset ' + nanosToMilles($scope.entry.startOffsetNanos) + ' ms';
            $scope.duration = nanosToMilles($scope.entry.durationNanos) + ($scope.entry.active ? '..' : '');

            $scope.style = [
                'margin-left: ' + traceEntryBarLeft() + 'px;',
                'width: ' + traceEntryBarWidthFn() + 'px;'
            ].join('');

            function traceEntryBarLeft() {
                var left = Math.floor($scope.entry.startOffsetNanos * traceEntryBarWidth / $scope.traceDurationNanos);
                // Math.min is in case startOffsetNanos is equal to traceDurationNanos
                return Math.min(left, traceEntryBarWidth - 1);
            }

            function traceEntryBarWidthFn() {
                var left = Math.floor($scope.entry.startOffsetNanos * traceEntryBarWidth / $scope.traceDurationNanos);
                var right = Math.floor(($scope.entry.startOffsetNanos + $scope.entry.durationNanos - 1) * traceEntryBarWidth / $scope.traceDurationNanos);
                return Math.max(1, right - left + 1);
            }
        }
    };
}
