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
        .controller('TransactionTabTimePercentilesCtrl', TransactionTabTimePercentilesCtrl);


TransactionTabTimePercentilesCtrl.$inject = [
    '$scope', '$location', '$filter', '$timeout', 'locationChanges', 'charts', 'modals', 'model'
];

function TransactionTabTimePercentilesCtrl($scope, $location, $filter, $timeout, locationChanges, charts, modals, model) {

    $scope.model = model;
    $scope.range = model.range;

    if ($scope.hideMainContent()) {
        return;
    }

    var chartState = charts.createState();

    var appliedPercentiles;

    function refreshData(autoRefresh) {
        var query = {
            agentRollupId: $scope.agentRollupId,
            transactionType: $scope.model.transactionType,
            transactionName: $scope.model.transactionName,
            from: $scope.chart.from,
            to: $scope.chart.to,
            autoRefresh: autoRefresh
        };
        charts.refreshData('backend/transaction/percentiles', chartState, $scope, null, addToQuery, onRefreshData, query);
    }

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'chart.autoRefresh'
    ], function (newValues, oldValues) {
        if (angular.equals(appliedPercentiles, $scope.layout.agentRollups[$scope.agentRollupId].defaultDisplayedPercentiles)) {
            $location.search('percentile', null);
        } else {
            $location.search('percentile', appliedPercentiles);
        }
        refreshData(newValues[3] !== oldValues[3]);
    });


    $scope.clickActiveTopLink = function (event) {
        if (!event.ctrlKey) {
            $scope.chart.refresh++;
            // suppress normal link
            event.preventDefault();
            return false;
        }
    };

    $scope.openCustomPercentilesModal = function () {
        $scope.customPercentiles = appliedPercentiles.join(', ');
        modals.display('#customPercentilesModal', true);
        $timeout(function () {
            $('#customPercentiles').focus();
        });
    };

    $scope.applyCustomPercentiles = function () {
        appliedPercentiles = [];
        angular.forEach($scope.customPercentiles.split(','), function (percentile) {
            percentile = percentile.trim();
            if (percentile.length) {
                appliedPercentiles.push(Number(percentile));
            }
        });
        sortNumbers(appliedPercentiles);
        $('#customPercentilesModal').modal('hide');
        $scope.chart.refresh++;
    };

    locationChanges.on($scope, function () {
        var priorAppliedPercentiles = appliedPercentiles;
        if ($location.search().percentile) {
            appliedPercentiles = [];
            var percentile = $location.search().percentile;
            if (angular.isArray(percentile)) {
                angular.forEach(percentile, function (p) {
                    appliedPercentiles.push(Number(p));
                });
            } else {
                appliedPercentiles.push(Number(percentile));
            }
            sortNumbers(appliedPercentiles);
        } else {
            appliedPercentiles = $scope.layout.agentRollups[$scope.agentRollupId].defaultDisplayedPercentiles;
        }

        if (priorAppliedPercentiles !== undefined && !angular.equals(appliedPercentiles, priorAppliedPercentiles)) {
            $scope.chart.refresh++;
        }
        $scope.percentiles = appliedPercentiles;
    });

    function sortNumbers(arr) {
        arr.sort(function (a, b) {
            return a - b;
        });
    }

    function addToQuery(query) {
        query.percentile = appliedPercentiles;
    }

    function onRefreshData(data) {
        $scope.transactionCounts = data.transactionCounts;
        $scope.mergedAggregate = data.mergedAggregate;
    }

    var chartOptions = {
        tooltip: true,
        series: {
            stack: false,
            lines: {
                fill: false
            }
        },
        tooltipOpts: {
            content: function (label, xval, yval, flotItem) {
                var from = xval - chartState.dataPointIntervalMillis;
                // this math is to deal with live aggregate
                from = Math.ceil(from / chartState.dataPointIntervalMillis) * chartState.dataPointIntervalMillis;
                var to = xval;
                return charts.renderTooltipHtml(from, to, $scope.transactionCounts[xval], flotItem.dataIndex,
                        flotItem.seriesIndex, chartState.plot, function (value) {
                            return $filter('gtMillis')(value) + ' milliseconds';
                        });
            }
        }
    };

    charts.init(chartState, $('#chart'), $scope);
    charts.plot([[]], chartOptions, chartState, $('#chart'), $scope);
    charts.initResize(chartState.plot, $scope);
    charts.startAutoRefresh($scope, 60000);
}

