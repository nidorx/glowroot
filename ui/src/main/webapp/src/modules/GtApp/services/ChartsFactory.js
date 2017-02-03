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

/* global angular, moment, $ */


angular
        .module('GtApp')
        .factory('charts', AppChartsFactory);

AppChartsFactory.$inject = ['$http', '$rootScope', '$timeout', 'keyedColorPools', 'queryStrings', 'httpErrors'];

/**
 * common code shared between transaction.js and errors.js
 *
 * @param {type} $http
 * @param {type} $rootScope
 * @param {type} $timeout
 * @param {type} keyedColorPools
 * @param {type} queryStrings
 * @param {type} httpErrors
 * @returns {AppChartsFactory.chartsAnonym$5}
 */
function AppChartsFactory($http, $rootScope, $timeout, keyedColorPools, queryStrings, httpErrors) {

    function createState() {
        return {
            plot: undefined,
            keyedColorPool: keyedColorPools.create()
        };
    }

    function init(chartState, $chart, $scope) {

        if(!$scope.chart){
            $scope.chart = {};
        }

        // All chart vars
        if (!$scope.chart.last || Number.isNaN($scope.chart.last)) {
            if ((!$scope.chart.from || Number.isNaN($scope.chart.from)) || !$scope.chart.to || Number.isNaN($scope.chart.to)) {
                $scope.chart.last = 4 * 60 * 60 * 1000;
            }
        }
        //$scope.chart.from = undefined;
        //$scope.chart.to = undefined;
        $scope.chart.noData = false;
        $scope.chart.seriesLabels = null;
        $scope.chart.refresh = 0;
        $scope.chart.autoRefresh = 0;
        $scope.chart.showSpinner = 0;
        $scope.chart.suppressSpinner = false;
        $scope.chart.useGaugeViewThresholdMultiplier = null;

        applyLast($scope);

        $chart.bind('plotzoom', function (event, plot, args) {
            var zoomingOut = args.amount && args.amount < 1;
            $scope.$apply(function () {
                var from = plot.getAxes().xaxis.options.min;
                var to = plot.getAxes().xaxis.options.max;
                updateRange($scope, from, to, zoomingOut);
            });
        });

        $chart.bind('plotselected', function (event, ranges) {
            $scope.$apply(function () {
                chartState.plot.clearSelection();
                var from = ranges.xaxis.from;
                var to = ranges.xaxis.to;
                updateRange($scope, from, to, false, true);
            });
        });

        $scope.zoomOut = function () {
            var currMin = $scope.chart.from;
            var currMax = $scope.chart.to;
            var currRange = currMax - currMin;
            updateRange($scope, currMin - currRange / 2, currMax + currRange / 2, true);
        };

        // Allwo override
        if (!$scope.refresh) {
            $scope.refresh = function () {
                applyLast($scope);
                $scope.chart.refresh++;
            };
        }
    }

    function initResize(plot, $scope) {
        function resize() {
            setTimeout(function () {
                plot.resize();
                plot.setupGrid();
                plot.draw();
            }, 10);
        }
        $scope.$on('resize', resize);
        resize();
    }

    function updateRange($scope, from, to, zoomingOut, selection, selectionNearestLarger, tracePoints) {
        // force chart refresh even if chart.from/chart.to don't change (e.g. trying to zoom in beyond single interval)
        $scope.chart.refresh++;

        if (zoomingOut && $scope.chart.last) {
            $scope.chart.last = roundUpLast($scope.chart.last * 2);
            applyLast($scope);
            return;
        }

        var dataPointIntervalMillis =
                getDataPointIntervalMillis(from, to, $scope.chart.useGaugeViewThresholdMultiplier, tracePoints);
        var revisedFrom;
        var revisedTo;
        if (zoomingOut || selectionNearestLarger) {
            revisedFrom = Math.floor(from / dataPointIntervalMillis) * dataPointIntervalMillis;
            revisedTo = Math.ceil(to / dataPointIntervalMillis) * dataPointIntervalMillis;
            var revisedDataPointIntervalMillis =
                    getDataPointIntervalMillis(revisedFrom, revisedTo, $scope.chart.useGaugeViewThresholdMultiplier, tracePoints);
            if (revisedDataPointIntervalMillis !== dataPointIntervalMillis) {
                // expanded out to larger rollup threshold so need to re-adjust
                // ok to use original from/to instead of revisedFrom/revisedTo
                revisedFrom = Math.floor(from / revisedDataPointIntervalMillis) * revisedDataPointIntervalMillis;
                revisedTo = Math.ceil(to / revisedDataPointIntervalMillis) * revisedDataPointIntervalMillis;
            }
        } else {
            revisedFrom = Math.ceil(from / dataPointIntervalMillis) * dataPointIntervalMillis;
            revisedTo = Math.floor(to / dataPointIntervalMillis) * dataPointIntervalMillis;
            if (revisedTo <= revisedFrom) {
                // selection is too small, so expand outward to exactly one data point interval
                if (to - revisedTo > revisedFrom - from) {
                    revisedTo += dataPointIntervalMillis;
                    revisedFrom = revisedTo - dataPointIntervalMillis;
                } else {
                    revisedFrom -= dataPointIntervalMillis;
                    revisedTo = revisedFrom + dataPointIntervalMillis;
                }
            }
        }
        var now = Date.now();
        // need to compare original 'to' in case it was revised below 'now'
        if ((revisedTo > now || to > now) && (!tracePoints || revisedTo - revisedFrom >= 60000)) {
            if (!zoomingOut && !selection && $scope.chart.last) {
                if (tracePoints && $scope.chart.last === 60000) {
                    $scope.chart.to = Math.ceil(now / 60000) * 60000;
                    $scope.chart.from = $scope.chart.to - 60000;
                    $scope.chart.last = 0;
                    return;
                }
                // double-click or scrollwheel zooming in, need special case here, otherwise might zoom in a bit too much
                // due to shrinking the zoom to data point interval, which could result in strange 2 days --> 22 hours
                // instead of the more obvious 2 days --> 1 day
                $scope.chart.last = roundUpLast($scope.chart.last / 2);
                applyLast($scope);
                return;
            }
            if (tracePoints && revisedTo - revisedFrom === 120000) {
                $scope.chart.last = 60000;
                applyLast($scope);
                return;
            }
            if (tracePoints && now < revisedFrom) {
                // this can happen after zooming in on RHS of chart until 1 second total chart width, then zooming out on LHS
                $scope.chart.last = 60000;
                applyLast($scope);
                return;
            }
            var last = roundUpLast(now - revisedFrom, selection);
            if (last > 0) {
                $scope.chart.last = last;
            }
            applyLast($scope);
        } else {
            $scope.chart.from = revisedFrom;
            $scope.chart.to = revisedTo;
            $scope.chart.last = 0;
        }
    }

    function roundUpLast(last, selection) {
        var hour = 60 * 60 * 1000;
        var day = 24 * hour;
        if (last > day) {
            if (selection) {
                // round down to nearest hour
                return Math.floor(last / hour) * hour;
            } else {
                // round up to nearest day
                return Math.ceil(last / day) * day;
            }
        }
        if (last > hour && !selection) {
            // round up to nearest hour
            return Math.ceil(last / hour) * hour;
        }
        var minute = 60 * 1000;
        if (selection) {
            // round down to nearest minute
            return Math.floor(last / minute) * minute;
        } else {
            // round up to nearest minute
            return Math.ceil(last / minute) * minute;
        }
    }

    function getDataPointIntervalMillis(from, to, useGaugeViewThresholdMultiplier, tracePoints) {
        var millis = to - from;
        if (tracePoints && millis < 120000) {
            return 1000;
        }
        var timeAgoMillis = Date.now() - from;
        var i;
        var rollupConfigs = $rootScope.layout.rollupConfigs;
        for (i = 0; i < rollupConfigs.length - 1; i++) {
            var currRollupConfig = rollupConfigs[i];
            var nextRollupConfig = rollupConfigs[i + 1];
            var viewThresholdMillis = nextRollupConfig.viewThresholdMillis;
            if (useGaugeViewThresholdMultiplier) {
                viewThresholdMillis *= 4;
            }
            var expirationMillis = $rootScope.layout.rollupExpirationMillis[i];
            if (millis < viewThresholdMillis && (expirationMillis === 0 || expirationMillis > timeAgoMillis)) {
                return currRollupConfig.intervalMillis;
            }
        }
        return rollupConfigs[rollupConfigs.length - 1].intervalMillis;
    }

    function plot(data, chartOptions, chartState, $chart, $scope) {
        var options = {
            grid: {
                // min border margin should match trace chart so they are positioned the same from the top of page
                // without specifying min border margin, the point radius is used
                minBorderMargin: 0,
                borderColor: '#7d7358',
                borderWidth: 1,
                // this is needed for tooltip plugin to work
                hoverable: true
            },
            xaxis: {
                mode: 'time',
                timezone: 'browser',
                twelveHourClock: true,
                ticks: 5,
                min: $scope.chart.from,
                max: $scope.chart.to,
                reserveSpace: false
            },
            yaxis: {
                ticks: 10,
                zoomRange: false,
                min: 0,
                // 10 second yaxis max just for initial empty chart rendering
                max: 10,
                label: 'milliseconds'
            },
            zoom: {
                interactive: true,
                ctrlKey: true,
                amount: 2,
                skipDraw: true
            },
            selection: {
                mode: 'x'
            },
            series: {
                stack: true,
                lines: {
                    show: true,
                    fill: true
                },
                points: {
                    //show: true,
                    radius: 2
                }
            },
            legend: {
                show: false
            }
        };
        chartState.plot = $.plot($chart, data, $.extend(true, options, chartOptions));
        chartState.plot.getAxes().yaxis.options.max = undefined;
        $(document).off('touchstart.chart');
        $(document).on('touchstart.chart', function () {
            chartState.plot.hideTooltip();
        });
    }

    function refreshData(url, chartState, $scope, autoRefresh, addToQuery, onRefreshData, query) {
        // addToQuery may change query.from/query.to (see gauges.js)

        if (addToQuery) {
            addToQuery(query);
        }
        var showChartSpinner = !$scope.chart.suppressSpinner;
        if (showChartSpinner) {
            $scope.chart.showSpinner++;
        }
        $scope.chart.suppressSpinner = false;
        $http.get(url + queryStrings.encodeObject(query)).then(function (response) {
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
            $scope.chart.noData = !data.dataSeries.length;
            // allow callback to modify data if desired
            onRefreshData(data);
            // reset axis in case user changed the date and then zoomed in/out to trigger this refresh
            chartState.plot.getAxes().xaxis.options.min = query.from;
            chartState.plot.getAxes().xaxis.options.max = query.to;
            // data point interval calculation must match server-side calculation, so based on query.from/query.to
            // instead of chart.from/chart.to
            chartState.dataPointIntervalMillis =
                    getDataPointIntervalMillis(query.from, query.to, $scope.chart.useGaugeViewThresholdMultiplier);
            var plotData = [];
            var labels = [];
            angular.forEach(data.dataSeries, function (dataSeries) {
                labels.push(dataSeries.name ? dataSeries.name : 'Other');
            });
            chartState.keyedColorPool.reset(labels);
            angular.forEach(data.dataSeries, function (dataSeries, index) {
                var label = labels[index];
                var plotDataItem = {
                    data: dataSeries.data,
                    label: label,
                    shortLabel: dataSeries.shortLabel,
                    color: chartState.keyedColorPool.get(label),
                    points: {
                        fillColor: chartState.keyedColorPool.get(label)
                    }
                };
                plotData.push(plotDataItem);
            });
            if (plotData.length) {
                chartState.plot.setData(plotData);
            } else {
                chartState.plot.setData([[]]);
            }
            chartState.plot.setupGrid();
            chartState.plot.draw();
            updateLegend(chartState, $scope);
        }, function (response) {
            if (showChartSpinner) {
                $scope.chart.showSpinner--;
            }
            $scope.$emit('httpError', response);
        });
    }

    function updateLegend(chartState, $scope) {
        var plotData = chartState.plot.getData();
        $scope.chart.seriesLabels = [];
        if (plotData.length === 1 && plotData[0].label === undefined) {
            // special case for when user de-selects all gauges and chart displays 'Select one or more gauges below'
            return;
        }
        var seriesIndex;
        for (seriesIndex = 0; seriesIndex < plotData.length; seriesIndex++) {
            $scope.chart.seriesLabels.push({
                color: plotData[seriesIndex].color,
                text: plotData[seriesIndex].label
            });
        }
    }

    function renderTooltipHtml(
            from, to, transactionCount, dataIndex, highlightSeriesIndex, plot, display,
            headerSuffix, nonStacked, dateFormat, altBetweenText) {
        function smartFormat(millis) {
            var date = moment(millis);
            if (dateFormat) {
                return date.format(dateFormat);
            } else if (date.valueOf() % 60000 === 0) {
                return date.format('LT');
            } else {
                return date.format('LTS');
            }
        }

        var html = '<table class="gt-chart-tooltip"><thead><tr><td colspan="3" style="font-weight: 600;">';
        html += smartFormat(from);
        if (to) {
            if (altBetweenText) {
                html += altBetweenText;
            } else {
                html += ' to ';
            }
            html += smartFormat(to);
        }
        if (headerSuffix) {
            html += '<span style="font-weight: 400;">' + headerSuffix + '</span>';
        }
        html += '</td></tr>';
        if (transactionCount !== undefined) {
            html += '<tr><td colspan="3">';
            html += transactionCount;
            html += ' transactions';
            html += '</td></tr>';
        }
        html += '</thead><tbody>';
        var plotData = plot.getData();
        var seriesIndex;
        var dataSeries;
        var value;
        var label;
        var found = false;
        var displayText;
        for (seriesIndex = 0; seriesIndex < plotData.length; seriesIndex++) {
            dataSeries = plotData[seriesIndex];
            if (nonStacked) {
                // dataIndex don't line up since non-stacked
                displayText = display(undefined, dataSeries.label);
                found = true;
            } else if (dataSeries.data[dataIndex]) {
                value = dataSeries.data[dataIndex][1];
                found = true;
                displayText = display(value, dataSeries.label);
            } else {
                displayText = 'no data';
            }
            html += '<tr';
            label = dataSeries.shortLabel ? dataSeries.shortLabel : dataSeries.label;
            if (seriesIndex === highlightSeriesIndex) {
                html += ' style="background-color: #eee;"';
            }
            html += '>'
                    + '<td class="legendColorBox" width="16">'
                    + '<div style="border: 1px solid rgb(204, 204, 204); padding: 1px;">'
                    + '<div style="width: 4px; height: 0px; border: 5px solid ' + dataSeries.color + '; overflow: hidden;">'
                    + '</div></div></td>'
                    + '<td style="padding-right: 10px;">' + label + '</td>'
                    + '<td style="font-weight: 600;">' + displayText + '</td>'
                    + '</tr>';
        }
        if (!found) {
            return 'No data';
        }
        html += '</tbody></table>';
        return html;
    }

    function startAutoRefresh($scope, delay) {
        var timer;

        function onVisible() {
            $scope.$apply(function () {
                $scope.chart.autoRefresh++;
                $scope.refresh();
            });
            document.removeEventListener('visibilitychange', onVisible);
        }

        function scheduleNextRefresh() {
            timer = $timeout(function () {
                if ($scope.chart.last) {
                    // document.hidden is not supported by IE9 but that's ok, the condition will just evaluate to false
                    // and auto refresh will continue even while hidden under IE9
                    if (document.hidden) {
                        document.addEventListener('visibilitychange', onVisible);
                    } else {
                        $scope.chart.suppressSpinner = true;
                        $scope.chart.autoRefresh++;
                        $scope.refresh();
                    }
                }
                scheduleNextRefresh();
            }, delay);
        }

        scheduleNextRefresh();

        $scope.$on('$destroy', function () {
            $timeout.cancel(timer);
        });
    }

    /**
     * always re-apply last in order to reflect the latest time
     *
     * @param {type} $scope
     * @returns {undefined}
     */
    function applyLast($scope) {
        if (!$scope.chart.last) {
            return;
        }
        var now = moment().startOf('second').valueOf();
        var from = now - $scope.chart.last;
        var to = now + $scope.chart.last / 10;
        var dataPointIntervalMillis = getDataPointIntervalMillis(from, to);
        var revisedFrom = Math.floor(from / dataPointIntervalMillis) * dataPointIntervalMillis;
        var revisedTo = Math.ceil(to / dataPointIntervalMillis) * dataPointIntervalMillis;
        var revisedDataPointIntervalMillis = getDataPointIntervalMillis(revisedFrom, revisedTo);
        if (revisedDataPointIntervalMillis !== dataPointIntervalMillis) {
            // expanded out to larger rollup threshold so need to re-adjust
            // ok to use original from/to instead of revisedFrom/revisedTo
            revisedFrom = Math.floor(from / revisedDataPointIntervalMillis) * revisedDataPointIntervalMillis;
            revisedTo = Math.ceil(to / revisedDataPointIntervalMillis) * revisedDataPointIntervalMillis;
        }

        $scope.chart.from = revisedFrom;
        $scope.chart.to = revisedTo;
    }

    return {
        init: init,
        plot: plot,
        applyLast: applyLast,
        initResize: initResize,
        refreshData: refreshData,
        updateRange: updateRange,
        createState: createState,
        startAutoRefresh: startAutoRefresh,
        renderTooltipHtml: renderTooltipHtml,
        getDataPointIntervalMillis: getDataPointIntervalMillis,
    };
}

