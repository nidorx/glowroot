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
        .controller('ErrorMessagesCtrl', ErrorMessagesCtrl);


ErrorMessagesCtrl.$inject = [
    '$scope', '$http', '$location', 'locationChanges', 'charts', 'queryStrings', 'httpErrors', 'model'
];

function ErrorMessagesCtrl($scope, $http, $location, locationChanges, charts, queryStrings, httpErrors, model) {

    $scope.model = model;

    if ($scope.hideMainContent()) {
        return;
    }

    var appliedFilter;

    var chartState = charts.createState();

    $scope.chart.showSpinner = 0;

    var errorMessageLimit = 25;
    var dataSeriesExtra;

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'chart.autoRefresh'
    ], function (newValues, oldValues) {
        $location.search('filter', $scope.filter || null);
        refreshData(newValues[3] !== oldValues[3]);
    });

    function refreshData(autoRefresh, deferred) {
        if (($scope.layout.central && !$scope.agentRollupId) || !$scope.model.transactionType) {
            return;
        }
        $scope.parsingError = undefined;
        var parseResult = gtParseIncludesExcludes($scope.filter);
        if (parseResult.error) {
            $scope.parsingError = parseResult.error;
            return;
        }
        var query = {
            agentRollupId: $scope.agentRollupId,
            transactionType: $scope.model.transactionType,
            transactionName: $scope.model.transactionName,
            from: $scope.chart.from,
            to: $scope.chart.to,
            include: parseResult.includes,
            exclude: parseResult.excludes,
            errorMessageLimit: errorMessageLimit
        };
        if (autoRefresh) {
            query.autoRefresh = true;
        }
        var showChartSpinner = !$scope.chart.suppressSpinner;
        if (showChartSpinner) {
            $scope.chart.showSpinner++;
        }
        $scope.chart.suppressSpinner = false;
        $http.get('backend/error/messages' + queryStrings.encodeObject(query))
                .then(function (response) {
                    // clear http error, especially useful for auto refresh on live data to clear a sporadic error from earlier
                    httpErrors.clear();
                    if (showChartSpinner) {
                        $scope.chart.showSpinner--;
                    }
                    if ($scope.chart.showSpinner) {
                        // ignore this response, another response has been stacked
                        return;
                    }
                    var data = response.data;
                    $scope.chart.noData = !data.dataSeries.data.length;
                    // reset axis in case user changed the date and then zoomed in/out to trigger this refresh
                    chartState.plot.getAxes().xaxis.options.min = query.from;
                    chartState.plot.getAxes().xaxis.options.max = query.to;
                    chartState.dataPointIntervalMillis = charts.getDataPointIntervalMillis(query.from, query.to);
                    if (data.dataSeries.data.length) {
                        chartState.plot.setData([{data: data.dataSeries.data}]);
                    } else {
                        chartState.plot.setData([[]]);
                    }
                    chartState.plot.setupGrid();
                    chartState.plot.draw();
                    dataSeriesExtra = data.dataSeriesExtra;

                    $scope.moreErrorMessagesAvailable = data.moreErrorMessagesAvailable;
                    $scope.errorMessages = data.errorMessages;
                    if (deferred) {
                        deferred.resolve();
                    }
                }, function (response) {
                    if (showChartSpinner) {
                        $scope.chart.showSpinner--;
                    }
                    httpErrors.handle(response, $scope, deferred);
                });
    }

    $scope.tracesQueryString = function (errorMessage) {
        var query = $scope.buildQueryObject();
        if (errorMessage.message.length <= 1000) {
            query.errorMessageComparator = 'equals';
            query.errorMessage = errorMessage.message;
        } else {
            query.errorMessageComparator = 'begins';
            // this keeps url length under control
            query.errorMessage = errorMessage.message.substring(0, 1000);
        }
        return queryStrings.encodeObject(query);
    };

    $scope.showMoreErrorMessages = function (deferred) {
        // double each time
        errorMessageLimit *= 2;
        refreshData(false, deferred);
    };

    $scope.refresh = function () {
        $scope.applyLast();
        appliedFilter = $scope.filter;
        $scope.chart.refresh++;
    };

    locationChanges.on($scope, function () {
        var priorAppliedFilter = appliedFilter;
        appliedFilter = $location.search().filter || '';

        if (priorAppliedFilter !== undefined && appliedFilter !== priorAppliedFilter) {
            // e.g. back or forward button was used to navigate
            $scope.chart.refresh++;
        }
        $scope.filter = appliedFilter;
    });

    // 100% yaxis max just for initial empty chart rendering
    var chartOptions = {
        yaxis: {
            max: 100,
            label: 'error percentage'
        },
        tooltip: true,
        tooltipOpts: {
            content: function (label, xval, yval) {
                if (yval === 0 && !dataSeriesExtra[xval]) {
                    // this is synthetic point for initial upslope, gap or final downslope
                    return 'No errors';
                }
                function smartFormat(millis) {
                    if (millis % 60000 === 0) {
                        return moment(millis).format('LT');
                    } else {
                        return moment(millis).format('LTS');
                    }
                }

                var from = xval - chartState.dataPointIntervalMillis;
                // this math is to deal with live aggregate
                from = Math.ceil(from / chartState.dataPointIntervalMillis) * chartState.dataPointIntervalMillis;
                var to = xval;
                var html = '<div class="gt-chart-tooltip"><div style="font-weight: 600;">'
                        + smartFormat(from) + ' to ' + smartFormat(to)
                        + '</div><div>Error percentage: ' + yval.toFixed(1)
                        + '</div><div>Error count: ' + dataSeriesExtra[xval][0]
                        + '</div><div>Transaction count: ' + dataSeriesExtra[xval][1] + '</div></div>';
                return html;
            }
        }
    };

    charts.init(chartState, $('#chart'), $scope);
    charts.plot([[]], chartOptions, chartState, $('#chart'), $scope);
    charts.initResize(chartState.plot, $scope);
    charts.startAutoRefresh($scope, 60000);
}

