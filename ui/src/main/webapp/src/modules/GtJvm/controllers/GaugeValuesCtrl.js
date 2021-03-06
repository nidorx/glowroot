/*
 * Copyright 2016-2017 the original author or authors.
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
        .module('GtJvm')
        .controller('JvmGaugeValuesCtrl', JvmGaugeValuesCtrl);


JvmGaugeValuesCtrl.$inject = [
    '$scope', '$location', '$filter', '$http', 'locationChanges', 'charts', 'httpErrors'
];

function JvmGaugeValuesCtrl($scope, $location, $filter, $http, locationChanges, charts, httpErrors) {

    // Page header
    $scope.page.title = 'JVM - Gauges';
    $scope.page.subTitle = '';
    $scope.page.helpPopoverTemplate = 'modules/GtTransaction/templates/help/ChartHelp.html';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        $scope.buildQueryObject = function () {
            return {};
        };
        return;
    }

    // initialize page binding object
    $scope.aux = {};

    var DEFAULT_GAUGES = [
        'java.lang:type=Memory:HeapMemoryUsage.used'
    ];

    var chartState = charts.createState();

    var yvalMaps = {};

    var gaugeScales = {};
    var emptyGaugeNames = {};

    var allGaugeNames = [];
    var gaugeShortDisplayMap = {};
    var gaugeUnits = {};
    var gaugeGrouping = {};

    $scope.aux.gaugeFilter = '';
    $scope.chart.useGaugeViewThresholdMultiplier = true;

    function refreshData(autoRefresh) {
        var query = {
            agentRollupId: $scope.agentRollupId,
            from: $scope.chart.from,
            to: $scope.chart.to,
            autoRefresh: autoRefresh,
            gaugeNames: $scope.gaugeNames
        };
        charts.refreshData('backend/jvm/gauges', chartState, $scope, null, null, onRefreshData, query);
    }

    function watchListener(autoRefresh) {
        $location.search($scope.buildQueryObject());
        if ($scope.gaugeNames.length) {
            refreshData(autoRefresh);
        } else {
            // ideally wouldn't need to refreshData here, but this seems a rare condition (to de-select all gauges)
            // and need some way to clear the last gauge from the chart, and this is easy
            refreshData(autoRefresh);
            $scope.chart.noData = true;
        }
    }

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'chart.autoRefresh'
    ], function (newValues, oldValues) {
        if (newValues !== oldValues) {
            watchListener(newValues[3] !== oldValues[3]);
        }
    });

    $scope.$watchCollection('gaugeNames', function (newValue, oldValue) {
        if (newValue !== oldValue || newValue.length) {
            watchListener(false);
        }
    });

    $scope.$watch('chart.seriesLabels', function (newValues, oldValues) {
        if (newValues !== oldValues) {
            var i;
            for (i = 0; i < newValues.length; i++) {
                var shortDisplay = gaugeShortDisplayMap[newValues[i].text];
                if (shortDisplay) {
                    newValues[i].text = shortDisplay;
                }
            }
        }
    });

    $scope.buildQueryObject = function (baseQuery) {
        var query = baseQuery || angular.copy($location.search());
        delete query.from;
        delete query.to;
        delete query.last;
        if (!$scope.chart.last) {
            query.from = $scope.chart.from;
            query.to = $scope.chart.to;
        } else {
            query.last = $scope.chart.last;
        }

        if (angular.equals($scope.gaugeNames, DEFAULT_GAUGES)) {
            delete query['gauge-name'];
        } else {
            query['gauge-name'] = $scope.gaugeNames;
        }
        return query;
    };

    var location;

    function onRefreshData(data) {
        updatePlotData(data.dataSeries);
        var i;
        for (i = 0; i < data.dataSeries.length; i++) {
            data.dataSeries[i].shortLabel = gaugeShortDisplayMap[data.dataSeries[i].name];
        }
    }

    locationChanges.on($scope, onLocationChanges);

    function onLocationChanges() {
        var priorLocation = location;
        location = {
            last: Number($location.search().last),
            chart: {
                from: Number($location.search().from),
                to: Number($location.search().to)
            },
            gaugeNames: $location.search()['gauge-name']
        };

        // both from and to must be supplied or neither will take effect
        if (location.chart.from && location.chart.to) {
            location.last = 0;
        } else if (!location.last) {
            location.last = 4 * 60 * 60 * 1000;
        }

        if (!location.gaugeNames) {
            location.gaugeNames = [];
            angular.forEach(DEFAULT_GAUGES, function (defaultGauge) {
                if (allGaugeNames.indexOf(defaultGauge) !== -1) {
                    location.gaugeNames.push(defaultGauge);
                }
            });
        }

        if (!angular.isArray(location.gaugeNames)) {
            location.gaugeNames = [location.gaugeNames];
        }

        if (!angular.equals(location, priorLocation)) {
            // only update scope if relevant change
            $scope.gaugeNames = angular.copy(location.gaugeNames);
            $scope.chart.last = location.last;
            $scope.chart.from = location.chart.from;
            $scope.chart.to = location.chart.to;
            charts.applyLast($scope);
        }
    }

    if (!$scope.hideMainContent()) {
        $http.get('backend/jvm/all-gauges', {
            params: {
                'agent-rollup-id': $scope.agentRollupId || ''
            }
        }).then(function (response) {
            $scope.loaded = true;
            $scope.allGauges = response.data;
            createShortDataSeriesNames(response.data);
            allGaugeNames = [];
            gaugeShortDisplayMap = {};
            gaugeUnits = {};
            gaugeGrouping = {};
            angular.forEach(response.data, function (gauge) {
                allGaugeNames.push(gauge.name);
                gaugeShortDisplayMap[gauge.name] = gauge.shortDisplay;
                if (gauge.unit) {
                    gaugeUnits[gauge.name] = ' ' + gauge.unit;
                } else {
                    gaugeUnits[gauge.name] = '';
                }
                if (gauge.grouping) {
                    gaugeGrouping[gauge.name] = gauge.grouping;
                } else {
                    gaugeGrouping[gauge.name] = gauge.name;
                }
            });
            if (!$scope.gaugeNames.length) {
                angular.forEach(DEFAULT_GAUGES, function (defaultGauge) {
                    if (allGaugeNames.indexOf(defaultGauge) !== -1) {
                        $scope.gaugeNames.push(defaultGauge);
                    }
                });
            }
        }, function (response) {
            $scope.$emit('httpError', response);
        });
    }

    // scale will bring max into 0..100 range
    // not using Math.log / Math.log(10) due to floating point issues
    function getScale(max) {
        if (max === 0) {
            return 1;
        }
        var scale = 0.000000000000001;
        while (max * scale * 10 <= 100) {
            scale *= 10;
        }
        // deal with floating point problems
        scale = parseFloat(scale.toPrecision(1));
        return scale;
    }

    function updatePlotData(data) {
        // reset gauge scales
        gaugeScales = {};
        yvalMaps = {};
        emptyGaugeNames = {};

        var groupingScale = {};

        var i;
        var dataSeries;
        var scale;
        var grouping;
        for (i = 0; i < data.length; i++) {
            dataSeries = data[i];
            updateYvalMap(dataSeries.name, dataSeries.data);
            if (dataSeries.data.length) {
                // set negative data to zero after putting real value into yval map
                setNegativeDataToZero(dataSeries);
                scale = getPointsScale(dataSeries.data);
                grouping = gaugeGrouping[dataSeries.name];
                if (groupingScale[grouping]) {
                    if (scale !== 'ANY') {
                        groupingScale[grouping] = Math.min(groupingScale[grouping], scale);
                    }
                } else if (scale !== 'ANY') {
                    groupingScale[grouping] = scale;
                }
            } else {
                emptyGaugeNames[dataSeries.name] = true;
            }
        }
        for (i = 0; i < data.length; i++) {
            dataSeries = data[i];
            if (dataSeries.data.length) {
                grouping = gaugeGrouping[dataSeries.name];
                scale = groupingScale[grouping];
                if (scale === undefined) {
                    scale = 1; // this corresponds to 'ANY' above
                }
                gaugeScales[dataSeries.name] = scale;
                scalePoints(dataSeries.data, scale);
            }
        }
        updateThePlotData(data);
    }

    function setNegativeDataToZero(dataSeries) {
        var i;
        var point;
        for (i = 0; i < dataSeries.data.length; i++) {
            point = dataSeries.data[i];
            if (point && point[1] < 0) {
                point[1] = 0;
            }
        }
    }

    function updateYvalMap(label, points) {
        var map = {};
        var i;
        var point;
        for (i = 0; i < points.length; i++) {
            point = points[i];
            if (point) {
                map[point[0]] = point[1];
            }
        }
        yvalMaps[label] = map;
    }

    function getPointsScale(points) {
        var max = 0;
        for (var j = 0; j < points.length; j++) {
            var point = points[j];
            if (!point) {
                continue;
            }
            var value = point[1];
            if (value > max) {
                max = value;
            }
        }
        if (max === 0) {
            return 'ANY';
        }
        return getScale(max);
    }

    function scalePoints(points, scale) {
        if (scale === 1) {
            return;
        }
        for (var j = 0; j < points.length; j++) {
            var point = points[j];
            if (point) {
                point[1] *= scale;
            }
        }
    }

    function updateThePlotData(data) {
        var nodata = true;
        for (var i = 0; i < data.length; i++) {
            var points = data[i].data;
            if (nodata) {
                nodata = points.length === 0;
            }
        }
        $scope.chart.noData = nodata;
    }

    function createShortDataSeriesNames(gauges) {
        var GAUGE_PATH_SEPARATOR = ' / ';
        var splitGaugeNames = [];
        angular.forEach(gauges, function (gauge) {
            splitGaugeNames.push(gauge.displayPath);
        });
        var minRequiredForUniqueName;
        var i, j;
        for (i = 0; i < gauges.length; i++) {
            var splitGaugeName = splitGaugeNames[i];
            var gaugeName = gauges[i].name;
            var separator = gaugeName.lastIndexOf(GAUGE_PATH_SEPARATOR);
            // at least include the last step in the mbean object name
            minRequiredForUniqueName = gaugeName.substring(separator + 1).split(GAUGE_PATH_SEPARATOR).length + 1;
            for (j = 0; j < gauges.length; j++) {
                if (j === i) {
                    continue;
                }
                var splitGaugeName2 = splitGaugeNames[j];
                minRequiredForUniqueName = Math.max(minRequiredForUniqueName,
                        numSamePartsStartingAtEnd(splitGaugeName, splitGaugeName2) + 1);
            }
            gauges[i].shortDisplay = splitGaugeName.slice(-minRequiredForUniqueName).join(GAUGE_PATH_SEPARATOR);
        }
    }

    function numSamePartsStartingAtEnd(array1, array2) {
        var k = 0;
        var len1 = array1.length;
        var len2 = array2.length;
        while (k < Math.min(len1, len2) && array1[len1 - 1 - k] === array2[len2 - 1 - k]) {
            k++;
        }
        return k;
    }

    $scope.gaugeScaleStyle = function (gaugeName) {
        if (gaugeScales[gaugeName]) {
            return {};
        } else {
            return {'font-style': 'italic'};
        }
    };

    $scope.getGaugeScale = function (gaugeName) {
        var scale = gaugeScales[gaugeName];
        if (!scale) {
            return 'no data';
        }
        scale = scale.toString();
        var index = scale.indexOf('e-');
        if (index === -1) {
            return scale;
        }
        var numZeros = scale.substring(index + 2) - 1;
        scale = '0.';
        for (var i = 0; i < numZeros; i++) {
            scale += '0';
        }
        return scale + '1';
    };

    $scope.clickGaugeName = function (gaugeName) {
        var index = $scope.gaugeNames.indexOf(gaugeName);
        if (index === -1) {
            $scope.gaugeNames.push(gaugeName);
            // maintain selected gauge ordering matching to match ordering of allGaugeNames
            // (which are ordered server-side by case insensitive gauge display)
            var ordering = {};
            angular.forEach(allGaugeNames, function (gaugeName, index) {
                ordering[gaugeName] = index;
            });
            $scope.gaugeNames.sort(function (a, b) {
                return ordering[a] - ordering[b];
            });
        } else {
            $scope.gaugeNames.splice(index, 1);
            // hide color and scale right away (noticeable when subsequent server response is slow)
            delete gaugeScales[gaugeName];
        }
    };

    $scope.showingAllGauges = function () {
        if (!$scope.allGauges) {
            return true;
        }
        var gauges = $filter('filter')($scope.allGauges, {display: $scope.aux.gaugeFilter});
        return gauges.length === $scope.allGauges.length;
    };

    $scope.selectAllGauges = function () {
        var gauges = $filter('filter')($scope.allGauges, {display: $scope.aux.gaugeFilter});
        angular.forEach(gauges, function (gauge) {
            var index = $scope.gaugeNames.indexOf(gauge.name);
            if (index === -1) {
                $scope.gaugeNames.push(gauge.name);
            }
        });
    };

    $scope.deselectAllGauges = function () {
        var gauges = $filter('filter')($scope.allGauges, {display: $scope.aux.gaugeFilter});
        angular.forEach(gauges, function (gauge) {
            var index = $scope.gaugeNames.indexOf(gauge.name);
            if (index !== -1) {
                $scope.gaugeNames.splice(index, 1);
            }
        });
    };

    function displaySixDigitsOfPrecision(value) {
        var nonScaledValue;
        if (value < 1000000) {
            nonScaledValue = parseFloat(value.toPrecision(6));
        } else {
            nonScaledValue = Math.round(value);
        }
        return nonScaledValue.toLocaleString(undefined, {maximumFractionDigits: 20});
    }

    var chartOptions = {
        tooltip: true,
        yaxis: {
            label: ''
        },
        series: {
            stack: false,
            lines: {
                fill: false
            }
        },
        tooltipOpts: {
            content: function (label, xval, yval, flotItem) {
                var rollupConfig0 = $scope.layout.rollupConfigs[0];
                var dataPointIntervalMillis =
                        charts.getDataPointIntervalMillis($scope.chart.from, $scope.chart.to, true);
                if (dataPointIntervalMillis === rollupConfig0.intervalMillis
                        && $scope.chart.to - $scope.chart.from < 4 * rollupConfig0.viewThresholdMillis) {
                    var nonScaledValue = yvalMaps[label][xval];
                    var tooltip = '<table class="gt-chart-tooltip">';
                    tooltip += '<tr><td colspan="2" style="font-weight: 600;">' + gaugeShortDisplayMap[label];
                    tooltip += '</td></tr><tr><td style="padding-right: 10px;">Time:</td><td style="font-weight: 400;">';
                    tooltip += moment(xval).format('h:mm:ss.SSS a (Z)') + '</td></tr>';
                    tooltip += '<tr><td style="padding-right: 10px;">Value:</td><td style="font-weight: 600;">';
                    tooltip += displaySixDigitsOfPrecision(nonScaledValue) + gaugeUnits[label] + '</td></tr>';
                    tooltip += '</table>';
                    return tooltip;
                }
                var from = xval - chartState.dataPointIntervalMillis;
                // this math is to deal with live aggregate
                from = Math.ceil(from / chartState.dataPointIntervalMillis) * chartState.dataPointIntervalMillis;
                var to = xval;
                return charts.renderTooltipHtml(from, to, undefined, flotItem.dataIndex, flotItem.seriesIndex,
                        chartState.plot, function (value, label) {
                            var nonScaledValue = yvalMaps[label][xval];
                            if (nonScaledValue === undefined) {
                                return 'no data';
                            }
                            return displaySixDigitsOfPrecision(nonScaledValue) + gaugeUnits[label];
                        }, ' (average value over this interval)', true);
            }
        }
    };

    $scope.chartState = chartState;
    var $chart = angular.element('#chart');
    charts.init(chartState, $chart, $scope);
    charts.plot([[]], chartOptions, chartState, $chart, $scope);
    charts.initResize(chartState.plot, $scope);
    charts.startAutoRefresh($scope, 60000);
}

