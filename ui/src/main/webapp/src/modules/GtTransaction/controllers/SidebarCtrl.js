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
        .module('GtTransaction')
        .controller('TransactionSidebarCtrl', TransactionSidebarCtrl);


TransactionSidebarCtrl.$inject = [
    '$scope', '$location', '$http', '$timeout', 'queryStrings', 'httpErrors', 'summarySortOrders', 'model','summaryValueFn'
];

function TransactionSidebarCtrl($scope, $location, $http, $timeout,
        queryStrings, httpErrors, summarySortOrders, model, summaryValueFn) {

    $scope.model = model;
    $scope.range = model.range;

    var lastSortOrder;
    var lastDurationMillis;
    var concurrentUpdateCount = 0;

    $scope.summaryValueFn = summaryValueFn[$scope.shortName];
    $scope.summarySortOrders = summarySortOrders[$scope.shortName];

    $scope.summaryLimit = 10;
    $scope.summariesLoadingMore = 0;

    $scope.summariesNoSearch = true;

    $scope.overallSummaryValue = function () {
        if ($scope.overallSummary) {
            return $scope.summaryValueFn($scope.overallSummary, lastSortOrder, $scope.overallSummary, lastDurationMillis);
        }
    };

    $scope.transactionSummaryValue = function (transactionSummary) {
        return $scope.summaryValueFn(transactionSummary, lastSortOrder, $scope.overallSummary, lastDurationMillis);
    };

    $scope.sidebarQueryString = function (transactionName) {
        var query = angular.copy($location.search());
        query['transaction-name'] = transactionName;
        return queryStrings.encodeObject(query);
    };

    $scope.showMoreSummaries = function () {
        // double each time
        $scope.summaryLimit *= 2;
        updateSummaries(false, true);
    };

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'chart.autoRefresh',
        'summarySortOrder'
    ], function (newValues, oldValues) {
        if (newValues !== oldValues) {
            if (newValues[4] !== oldValues[4]) {
                $scope.summariesNoSearch = true;
                $scope.transactionSummaries = undefined;
                $scope.moreSummariesAvailable = undefined;
            }
            $timeout(function () {
                // slight delay to de-prioritize summaries data request
                updateSummaries(newValues[3] !== oldValues[3]);
            }, 100);
        }
    });

    var initialStateChangeSuccess = true;
    $scope.$on('$stateChangeSuccess', function () {
        // don't let the active sidebar selection get out of sync (which can happen after using the back button)
        var activeElement = document.activeElement;
        if (activeElement && $(activeElement).closest('.gt-sidebar').length) {
            var gtUrl = activeElement.getAttribute('gt-url');
            if (gtUrl && gtUrl !== $location.url()) {
                activeElement.blur();
            }
        }
        if ($scope.chart.last && !initialStateChangeSuccess) {
            // refresh on tab change
            $timeout(function () {
                // slight delay to de-prioritize summaries data request
                updateSummaries();
            }, 100);
        }
        initialStateChangeSuccess = false;
    });

    function updateSummaries(autoRefresh, moreLoading) {
        if (($scope.layout.central && !$scope.agentRollupId) || !$scope.model.transactionType) {
            $scope.summariesNoSearch = true;
            return;
        }
        $scope.showSpinner = $scope.summariesNoSearch;
        var query = {
            agentRollupId: $scope.agentRollupId,
            transactionType: $scope.model.transactionType,
            // need floor/ceil when on trace point chart which allows second granularity
            from: Math.floor($scope.chart.from / 60000) * 60000,
            to: Math.ceil($scope.chart.to / 60000) * 60000,
            sortOrder: $scope.summarySortOrder,
            limit: $scope.summaryLimit
        };
        if (autoRefresh) {
            query.autoRefresh = true;
        }
        if (moreLoading) {
            $scope.summariesLoadingMore++;
        }
        concurrentUpdateCount++;
        $http.get('backend/' + $scope.shortName + '/summaries' + queryStrings.encodeObject(query))
                .then(function (response) {
                    if (moreLoading) {
                        $scope.summariesLoadingMore--;
                    }
                    concurrentUpdateCount--;
                    if (concurrentUpdateCount) {
                        return;
                    }
                    $scope.showSpinner = false;
                    $scope.summariesNoSearch = false;

                    lastSortOrder = query.sortOrder;
                    lastDurationMillis = query.to - query.from;
                    var data = response.data;
                    $scope.summariesNoData = !data.transactions.length;
                    $scope.overallSummary = data.overall;
                    $scope.transactionSummaries = data.transactions;
                    $scope.moreSummariesAvailable = data.moreAvailable;
                }, function (response) {
                    $scope.showSpinner = false;
                    if (moreLoading) {
                        $scope.summariesLoadingMore--;
                    }
                    concurrentUpdateCount--;
                    $scope.$emit('httpError', response);
                });
    }

    $timeout(function () {
        // slight delay to de-prioritize summaries data request
        updateSummaries();
    }, 100);
}

