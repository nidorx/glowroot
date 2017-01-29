/*
 * Copyright 2015-2017 the original author or authors.
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

/* global angular, moment, $ */

angular
        .module('GtTransaction')
        .factory('summaryValueFn', SummaryValueFnFactory);


SummaryValueFnFactory.$inject = ['$filter'];

function SummaryValueFnFactory($filter) {
    return {
        transaction: function (summary, sortOrder, overallSummary, durationMillis) {
            if (sortOrder === 'total-time') {
                return (100 * summary.totalDurationNanos / overallSummary.totalDurationNanos).toFixed(1) + ' %';
            } else if (sortOrder === 'average-time') {
                return $filter('gtMillis')(summary.totalDurationNanos / (1000000 * summary.transactionCount)) + ' ms';
            } else if (sortOrder === 'throughput') {
                return (60 * 1000 * summary.transactionCount / durationMillis).toFixed(1) + '/min';
            }
        },
        error: function (summary, sortOrder) {
            if (sortOrder === 'error-count') {
                return summary.errorCount;
            } else if (sortOrder === 'error-rate') {
                return (100 * summary.errorCount / summary.transactionCount).toFixed(1) + ' %';
            }
        }
    };
}

