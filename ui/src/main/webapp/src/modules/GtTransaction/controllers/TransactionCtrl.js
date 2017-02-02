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


    $scope.hideMainContent = function () {
        return ($scope.layout.central && !$scope.agentRollupId) || !$scope.model.transactionType;
    };

    // need to defer listener registration, otherwise captures initial location change sometimes
    $timeout(function () {
        $scope.$on('$locationChangeSuccess', onLocationChangeSuccess);
    });
    onLocationChangeSuccess();

    $scope.$watchGroup([
        'chart.last',
        'chart.from',
        'chart.to',
        'summarySortOrder'
    ], function (newValues, oldValues) {
        if (newValues !== oldValues) {
            $location.search($scope.buildQueryObject());
        }
    });

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


        $scope.chart.last = Number($location.search().last);
        $scope.chart.from = Number($location.search().from);
        $scope.chart.to = Number($location.search().to);


        // both from and to must be supplied or neither will take effect
        if (!isNaN($scope.chart.from) && !isNaN($scope.chart.to)) {
            $scope.chart.last = 0;
        } else if (!$scope.chart.last) {
            $scope.chart.last = 4 * 60 * 60 * 1000;
        }
        $scope.summarySortOrder = $location.search()['summary-sort-order'] || $scope.defaultSummarySortOrder;

        // always re-apply last in order to reflect the latest time
        charts.applyLast($scope);
    }
}