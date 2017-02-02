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
        .controller('TransactionTabTimeAverageCtrl', TransactionTabTimeAverageCtrl);


TransactionTabTimeAverageCtrl.$inject = ['$scope', '$location', 'charts', 'model'];

function TransactionTabTimeAverageCtrl($scope, $location, charts, model) {
    $scope.model = model;
    //$scope.range = model.range;

//    if ($scope.hideMainContent()) {
//        return;
//    }


    var chartState = charts.createState();

    function refreshData(autoRefresh) {
        var query = {
            agentRollupId: $scope.agentRollupId,
            transactionType: $scope.model.transactionType,
            transactionName: $scope.model.transactionName,
            from: $scope.chart.from,
            to: $scope.chart.to,
            autoRefresh: autoRefresh
        };
        charts.refreshData('backend/transaction/average', chartState, $scope, null, null, onRefreshData, query);
    }

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'chart.autoRefresh'
    ], function (newValues, oldValues) {
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

    function onRefreshData(data) {
        var mainThreadRootTimers = data.mergedAggregate.mainThreadRootTimers;
        if (mainThreadRootTimers.length === 1) {
            data.mergedAggregate.mainThreadRootTimer = mainThreadRootTimers[0];
        } else {
            var mainThreadRootTimer = {
                name: '<multiple root nodes>',
                totalNanos: 0,
                count: 0,
                childTimers: mainThreadRootTimers
            };
            var i;
            for (i = 0; i < mainThreadRootTimers.length; i++) {
                mainThreadRootTimer.totalNanos += mainThreadRootTimers[i].totalNanos;
                mainThreadRootTimer.count += mainThreadRootTimers[i].count;
            }
            data.mergedAggregate.mainThreadRootTimer = mainThreadRootTimer;
        }
        $scope.transactionCounts = data.transactionCounts;
        $scope.mergedAggregate = data.mergedAggregate;
        if ($scope.mergedAggregate.transactionCount) {
            $scope.mainThreadTreeTimers = createTreeTimers($scope.mergedAggregate.mainThreadRootTimer);
            $scope.auxThreadTreeTimers = createTreeTimers($scope.mergedAggregate.auxThreadRootTimers);
            $scope.mainThreadFlattenedTimers = createFlattenedTimers($scope.mergedAggregate.mainThreadRootTimer);
            $scope.auxThreadFlattenedTimers = createFlattenedTimers($scope.mergedAggregate.auxThreadRootTimers);
        }
    }

    function createTreeTimers(rootTimer) {
        var treeTimers = [];

        // indent1 must be sync'd with $indent1 variable in common-trace.less
        var indent1 = 8.41; // px

        function traverse(timer, nestingLevel) {
            timer.nestingIndent = nestingLevel * indent1 * 2;
            treeTimers.push(timer);
            if (timer.childTimers) {
                timer.childTimers.sort(function (a, b) {
                    return b.totalNanos - a.totalNanos;
                });
                angular.forEach(timer.childTimers, function (childTimer) {
                    traverse(childTimer, nestingLevel + 1);
                });
            }
        }

        // add the root node(s)
        if (angular.isArray(rootTimer)) {
            angular.forEach(rootTimer, function (item) {
                traverse(item, 0);
            });
        } else {
            traverse(rootTimer, 0);
        }
        return treeTimers;
    }

    function createFlattenedTimers(rootTimer) {
        var flattenedTimerMap = {};
        var flattenedTimers = [];

        function traverse(timer, parentTimerNames) {
            var flattenedTimer = flattenedTimerMap[timer.name];
            if (!flattenedTimer) {
                flattenedTimer = {
                    name: timer.name,
                    totalNanos: timer.totalNanos,
                    count: timer.count
                };
                flattenedTimerMap[timer.name] = flattenedTimer;
                flattenedTimers.push(flattenedTimer);
            } else if (parentTimerNames.indexOf(timer.name) === -1) {
                // only add to existing flattened timer if the aggregate timer isn't appearing under itself
                // (this is possible when they are separated by another aggregate timer)
                flattenedTimer.totalNanos += timer.totalNanos;
                flattenedTimer.count += timer.count;
            }
            if (timer.childTimers) {
                $.each(timer.childTimers, function (index, nestedTimer) {
                    traverse(nestedTimer, parentTimerNames.concat(timer));
                });
            }
        }

        // add the root node(s)
        if (angular.isArray(rootTimer)) {
            angular.forEach(rootTimer, function (item) {
                traverse(item, []);
            });
        } else {
            traverse(rootTimer, []);
        }

        flattenedTimers.sort(function (a, b) {
            return b.totalNanos - a.totalNanos;
        });

        return flattenedTimers;
    }

    var chartOptions = {
        tooltip: true,
        tooltipOpts: {
            content: function (label, xval, yval, flotItem) {
                var total = 0;
                var seriesIndex;
                var dataSeries;
                var value;
                var plotData = chartState.plot.getData();
                for (seriesIndex = 0; seriesIndex < plotData.length; seriesIndex++) {
                    dataSeries = plotData[seriesIndex];
                    value = dataSeries.data[flotItem.dataIndex][1];
                    total += value;
                }
                if (total === 0) {
                    return 'No data';
                }
                var from = xval - chartState.dataPointIntervalMillis;
                // this math is to deal with live aggregate
                from = Math.ceil(from / chartState.dataPointIntervalMillis) * chartState.dataPointIntervalMillis;
                var to = xval;
                return charts.renderTooltipHtml(
                        from,
                        to,
                        $scope.transactionCounts[xval],
                        flotItem.dataIndex,
                        flotItem.seriesIndex,
                        chartState.plot,
                        function (value) {
                            return (100 * value / total).toFixed(1) + ' %';
                        }
                );
            }
        }
    };

    charts.init(chartState, $('#chart'), $scope);
    charts.plot([[]], chartOptions, chartState, $('#chart'), $scope);
    charts.initResize(chartState.plot, $scope);
    charts.startAutoRefresh($scope, 60000);
}
