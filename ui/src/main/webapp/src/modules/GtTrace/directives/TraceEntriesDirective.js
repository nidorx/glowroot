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
        .directive('traceEntries', TraceEntriesDirective);

function TraceEntriesDirective() {
    return {
        scope: {
            entries: '='
        },
        templateUrl: 'modules/GtTrace/templates/TraceEntries.html',
        link: function ($scope) {

            $scope.aux = {};

            $scope.$watch('entries', function () {
                if (!$scope.entries) {
                    return;
                }

                // Add index to ng-repeat
                angular.forEach($scope.entries, function (entry, index) {
                    entry.index = index;
                });

                // pagination controls
                $scope.pagination = {};
                $scope.pagination.current = 1;
                $scope.pagination.total = $scope.entries.length;
                $scope.pagination.limit = 8; // items per page
                $scope.pagination.pages = Math.ceil($scope.pagination.total / $scope.pagination.limit);

                // updating traceDurationNanos is needed for live traces
                var last = $scope.entries[$scope.entries.length - 1];
                $scope.traceDurationNanos = last.startOffsetNanos + last.durationNanos;
            });
        }
    };
}
