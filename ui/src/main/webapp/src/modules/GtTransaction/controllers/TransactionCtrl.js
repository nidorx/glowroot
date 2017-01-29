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
/* global moment */

'use strict';


angular
        .module('GtTransaction')
        .controller('TransactionCtrl', TransactionCtrl);


TransactionCtrl.$inject = [
    '$scope', '$location', '$timeout', 'queryStrings', 'charts'
];

function TransactionCtrl($scope, $location, $timeout, queryStrings, charts) {
    $scope.hideAgentRollupDropdown = function () {
        return $scope.layout.agentRollups.length === 1 || !$scope.layout.central;
    };

    $scope.hideTransactionTypeDropdown = function () {
        var agentRollup = $scope.layout.agentRollups[$scope.agentRollupId];
        if (!agentRollup) {
            // show empty dropdown
            return false;
        }
        var transactionTypes = agentRollup.transactionTypes;
        if (!transactionTypes) {
            // show empty dropdown
            return false;
        }
        if (transactionTypes.length === 1 && transactionTypes[0] === $scope.model.transactionType) {
            return true;
        }
        return false;
    };

    $scope.hideMainContent = function () {
        return ($scope.layout.central && !$scope.agentRollupId) || !$scope.model.transactionType;
    };

    $scope.headerQueryString = function (agentRollup, transactionType) {
        var query = {};
        if ($scope.layout.central) {
            if (agentRollup.agent) {
                query['agent-id'] = agentRollup.id;
            } else {
                query['agent-rollup-id'] = agentRollup.id;
            }
        }
        if (transactionType) {
            query['transaction-type'] = transactionType;
        } else {
            query['transaction-type'] = agentRollup.defaultDisplayedTransactionType;
        }
        if ($scope.range.last) {
            if ($scope.range.last !== 4 * 60 * 60 * 1000) {
                query.last = $scope.range.last;
            }
        } else {
            query.from = $scope.range.chartFrom;
            query.to = $scope.range.chartTo;
        }
        return queryStrings.encodeObject(query);
    };

    // TODO this is exact duplicate of same function in gauge-values.js
    $scope.applyLast = function () {
        if (!$scope.range.last) {
            return;
        }
        var now = moment().startOf('second').valueOf();
        var from = now - $scope.range.last;
        var to = now + $scope.range.last / 10;
        var dataPointIntervalMillis = charts.getDataPointIntervalMillis(from, to);
        var revisedFrom = Math.floor(from / dataPointIntervalMillis) * dataPointIntervalMillis;
        var revisedTo = Math.ceil(to / dataPointIntervalMillis) * dataPointIntervalMillis;
        var revisedDataPointIntervalMillis = charts.getDataPointIntervalMillis(revisedFrom, revisedTo);
        if (revisedDataPointIntervalMillis !== dataPointIntervalMillis) {
            // expanded out to larger rollup threshold so need to re-adjust
            // ok to use original from/to instead of revisedFrom/revisedTo
            revisedFrom = Math.floor(from / revisedDataPointIntervalMillis) * revisedDataPointIntervalMillis;
            revisedTo = Math.ceil(to / revisedDataPointIntervalMillis) * revisedDataPointIntervalMillis;
        }
        $scope.range.chartFrom = revisedFrom;
        $scope.range.chartTo = revisedTo;
    };

    function onLocationChangeSuccess() {
        $scope.model.transactionType = $location.search()['transaction-type'];
        $scope.model.transactionName = $location.search()['transaction-name'];

        if ($scope.$state.includes('page.transaction')) {
            // Transactions
            $scope.shortName = 'transaction';
            $scope.headerDisplay = 'Transactions';
            $scope.defaultSummarySortOrder = 'total-time';
        } else {
            // Errors
            $scope.shortName = 'error';
            $scope.headerDisplay = 'Errors';
            $scope.defaultSummarySortOrder = 'error-count';
        }

        if ($scope.layout.central) {
            $scope.headerDisplay = $scope.agentRollupId || '<agent>';
        }

        // Page header
        $scope.page.title = $scope.headerDisplay + ' - ' + $scope.model.transactionType;
        $scope.page.subTitle = '';
        $scope.page.titleClass = 'header-pre-cards-pf';
        $scope.page.breadcrumb = null;


        $scope.range.last = Number($location.search().last);
        $scope.range.chartFrom = Number($location.search().from);
        $scope.range.chartTo = Number($location.search().to);


        // both from and to must be supplied or neither will take effect
        if (!isNaN($scope.range.chartFrom) && !isNaN($scope.range.chartTo)) {
            $scope.range.last = 0;
        } else if (!$scope.range.last) {
            $scope.range.last = 4 * 60 * 60 * 1000;
        }
        $scope.summarySortOrder = $location.search()['summary-sort-order'] || $scope.defaultSummarySortOrder;

        // always re-apply last in order to reflect the latest time
        $scope.applyLast();
    }

    // need to defer listener registration, otherwise captures initial location change sometimes
    $timeout(function () {
        $scope.$on('$locationChangeSuccess', onLocationChangeSuccess);
    });
    onLocationChangeSuccess();

    $scope.$watchGroup([
        'range.last',
        'range.chartFrom',
        'range.chartTo',
        'summarySortOrder'
    ], function (newValues, oldValues) {
        if (newValues !== oldValues) {
            $location.search($scope.buildQueryObject());
        }
    });

    $scope.tabQueryString = function () {
        return queryStrings.encodeObject($scope.buildQueryObject({}));
    };

    $scope.currentTabUrl = function () {
        return $location.path().substring(1);
    };
}