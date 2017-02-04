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
        .controller('JvmHeapHistogramCtrl', JvmHeapHistogramCtrl);


JvmHeapHistogramCtrl.$inject = ['$scope', '$http', '$location', 'locationChanges', 'queryStrings', 'httpErrors'];

function JvmHeapHistogramCtrl($scope, $http, $location, locationChanges, queryStrings, httpErrors) {

     // Page header
    $scope.page.title = 'JVM - Heap histogram';
    $scope.page.subTitle = '';
    $scope.page.helpPopoverTemplate = '';
    $scope.page.breadcrumb = null;

    $scope.ref = {};

    if ($scope.hideMainContent()) {
        return;
    }

    $scope.filterComparatorOptions = {
        contains: 'Contains',
        begins: 'Begins with',
        ends: 'Ends with'
    };

    $scope.displayLimits = [100, 200, 500, 1000, 2000, 5000];

    // this is used to calculate bar width under class name representing the proportion of total bytes
    var maxBytes;

    $scope.classNameBarWidth = function (bytes) {
        return (bytes / maxBytes) * 100 + '%';
    };

    $scope.$watch('ref.filterComparator', function (newValue, oldValue) {
        if (oldValue !== newValue) {
            if (newValue === 'contains') {
                $location.search('filter-comparator', null);
            } else {
                $location.search('filter-comparator', newValue);
            }
        }
    });

    $scope.$watch('ref.filterValue', function (newValue, oldValue) {
        if (oldValue !== newValue) {
            if (newValue) {
                $location.search('filter-value', newValue);
            } else {
                $location.search('filter-value', null);
            }
        }
    });

    $scope.$watch('ref.filterLimit', function (newValue, oldValue) {
        if (oldValue !== newValue) {
            if (newValue === '200') {
                $location.search('filter-limit', null);
            } else {
                $location.search('filter-limit', newValue);
            }
        }
    });

    locationChanges.on($scope, function () {
        $scope.ref.filterComparator = $location.search()['filter-comparator'] || 'contains';
        $scope.ref.filterValue = $location.search()['filter-value'] || '';
        $scope.ref.filterLimit = $location.search()['filter-limit'] || '200';

        $scope.sortAttribute = $location.search()['sort-attribute'] || 'bytes';
        if ($scope.sortAttribute === 'class-name') {
            $scope.sortAsc = $location.search()['sort-direction'] !== 'desc'; // text sorting defaults to asc
        } else {
            $scope.sortAsc = $location.search()['sort-direction'] === 'asc';
        }

        if ($scope.histogram !== undefined) {
            // TODO no need to sort if sort didn't change
            sortIfNeeded();
            applyFilter();
        }
    });

    $scope.sortQueryString = function (attributeName) {
        var query = {};
        if ($scope.ref.filterComparator !== 'contains') {
            query['filter-comparator'] = $scope.ref.filterComparator;
        }
        if ($scope.ref.filterValue) {
            query['filter-value'] = $scope.ref.filterValue;
        }
        if ($scope.ref.filterLimit !== '200') {
            query['filter-limit'] = $scope.ref.filterLimit;
        }
        if (attributeName !== 'bytes' || ($scope.sortAttribute === 'bytes' && !$scope.sortAsc)) {
            query['sort-attribute'] = attributeName;
        }
        if ($scope.sortAttribute === attributeName) {
            if (attributeName === 'class-name' && $scope.sortAsc) {
                query['sort-direction'] = 'desc';
            } else if (attributeName !== 'class-name' && !$scope.sortAsc) {
                query['sort-direction'] = 'asc';
            }
        }
        return queryStrings.encodeObject(query);
    };

    $scope.sortIconClass = function (attributeName) {
        if ($scope.sortAttribute !== attributeName) {
            return '';
        }
        if ($scope.sortAsc) {
            return 'caret gt-caret-sort-ascending';
        } else {
            return 'caret';
        }
    };

    var appliedSortAttribute;
    var appliedSortAsc;

    function sortIfNeeded() {
        if ($scope.sortAttribute === appliedSortAttribute && $scope.sortAsc === appliedSortAsc) {
            return;
        }
        if ($scope.sortAttribute === 'class-name') {
            // text sort
            $scope.histogram.items.sort(function (item1, item2) {
                var s1 = item1.className.toLowerCase();
                var s2 = item2.className.toLowerCase();
                var compare = s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
                return $scope.sortAsc ? compare : -compare;
            });
        } else {
            // numeric sort
            $scope.histogram.items.sort(function (item1, item2) {
                var compare = item1[$scope.sortAttribute] - item2[$scope.sortAttribute];
                return $scope.sortAsc ? compare : -compare;
            });
        }
        appliedSortAttribute = $scope.sortAttribute;
        appliedSortAsc = $scope.sortAsc;
    }


    $scope.$on('jvmHeapHistogramLimit', function (event, limit) {
        $scope.ref.filterLimit = limit;
    });


    $scope.$on('jvmHeapHistogramFilterValue', function (event, value) {
        $scope.ref.filterValue = value;
    });

    $scope.refresh = function (deferred) {
        $http.post('backend/jvm/heap-histogram?agent-id=' + encodeURIComponent($scope.agentId))
                .then(function (response) {
                    $scope.loaded = true;
                    var data = response.data;
                    $scope.agentNotConnected = data.agentNotConnected;
                    $scope.agentUnsupportedOperation = data.agentUnsupportedOperation;
                    $scope.unavailableDueToRunningInJre = data.unavailableDueToRunningInJre;
                    if ($scope.agentNotConnected || $scope.agentUnsupportedOperation || $scope.unavailableDueToRunningInJre) {
                        return;
                    }
                    $scope.histogram = data;
                    appliedSortAttribute = 'bytes';
                    appliedSortAsc = false;
                    sortIfNeeded();
                    applyFilter();
                    if (deferred) {
                        deferred.resolve('Complete');
                    }
                }, function (response) {
                    httpErrors.handle(response, $scope, deferred);
                });
    };

    $scope.exportAsCsv = function () {
        var csv = '<strong>Class name,Bytes,Count</strong><br>';
        angular.forEach($scope.histogram.items, function (item) {
            if (matchesFilter(item.className)) {
                // limit is not applied during export
                csv += item.className + ',' + item.bytes + ',' + item.count + '<br>';
            }
        });
        var csvWindow = window.open();
        $(csvWindow.document.body).html('<pre style="white-space: pre-wrap;">' + csv + '</pre>');
    };

    $scope.smallScreen = function () {
        // using innerWidth so it will match to screen media queries
        return window.innerWidth < 768;
    };



    function applyFilter() {
        if ($scope.displayedItems === undefined) {
            $scope.displayedItems = [];
        }
        $scope.displayedItems.length = 0;
        $scope.limitApplied = false;
        $scope.filteredTotalBytes = 0;
        $scope.filteredTotalCount = 0;
        if ($scope.ref.filterValue === '') {
            // optimization
            $scope.displayedItems = $scope.histogram.items.slice(0, $scope.ref.filterLimit);
            $scope.limitApplied = ($scope.histogram.items.length > $scope.ref.filterLimit);
            $scope.filteredTotalBytes = $scope.histogram.totalBytes;
            $scope.filteredTotalCount = $scope.histogram.totalCount;
            maxBytes = 0;
            angular.forEach($scope.displayedItems, function (item) {
                maxBytes = Math.max(maxBytes, item.bytes);
            });
            angular.forEach($scope.displayedItems, function (item) {
                item.percent = (item.bytes / maxBytes) * 100;
            });
            return;
        }
        var items = $scope.histogram.items;
        maxBytes = 0;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (matchesFilter(item.className)) {
                if ($scope.displayedItems.length < $scope.ref.filterLimit) {
                    $scope.displayedItems.push(item);
                    maxBytes = Math.max(maxBytes, item.bytes);
                } else {
                    $scope.limitApplied = true;
                }
                $scope.filteredTotalBytes += item.bytes;
                $scope.filteredTotalCount += item.count;
            }
        }

        angular.forEach($scope.displayedItems, function (item) {
            item.percent = (item.bytes / maxBytes) * 100;
        });

    }

    function matchesFilter(className) {
        if ($scope.ref.filterComparator === 'begins') {
            return className.toLowerCase().indexOf($scope.ref.filterValue.toLowerCase()) === 0;
        }
        if ($scope.ref.filterComparator === 'ends') {
            return className.toLowerCase().indexOf($scope.ref.filterValue.toLowerCase(),
                    className.length - $scope.ref.filterValue.length) !== -1;
        }
        // filterComparator === 'contains'
        return className.toLowerCase().indexOf($scope.ref.filterValue.toLowerCase()) !== -1;
    }

    $scope.refresh();
}

