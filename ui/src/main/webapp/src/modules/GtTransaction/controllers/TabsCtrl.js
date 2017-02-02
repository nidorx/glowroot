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
        .controller('TransactionTabsCtrl', TransactionTabsCtrl);


TransactionTabsCtrl.$inject = [
    '$scope', '$state', '$location', '$http', '$timeout', 'httpErrors', 'model'
];

function TransactionTabsCtrl($scope, $state, $location, $http, $timeout, httpErrors, model) {
    $scope.model = model;
    $scope.range = model.range;

    var filteredTraceTabCount;
    var concurrentUpdateCount = 0;

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'chart.autoRefresh',
        'transactionName'
    ], function (newValues, oldValues) {
        if (newValues !== oldValues) {
            $timeout(function () {
                // slight delay to de-prioritize tab bar data request
                updateTabBarData(newValues[3] !== oldValues[3]);
            }, 100);
        }
    });

    $scope.$on('updateTraceTabCount', function (event, traceCount) {
        filteredTraceTabCount = traceCount;
    });

    $scope.traceCountDisplay = function () {
        if ($scope.traceCount === undefined) {
            return '...';
        }
        if (filteredTraceTabCount !== undefined) {
            return filteredTraceTabCount;
        }
        return $scope.traceCount;
    };

    var initialStateChangeSuccess = true;
    $scope.$on('$stateChangeSuccess', function () {
        // don't let the active tab selection get out of sync (which can happen after using the back button)
        var activeElement = document.activeElement;
        if (activeElement && $(activeElement).closest('.gt-transaction-tabs').length) {
            var ngHref = activeElement.getAttribute('ng-href');
            if (ngHref && ngHref !== $location.url().substring(1)) {
                activeElement.blur();
            }
        }
        if ($scope.chart.last && !initialStateChangeSuccess) {
            $timeout(function () {
                // slight delay to de-prioritize summaries data request
                updateTabBarData();
            }, 100);
        }
        initialStateChangeSuccess = false;
    });

    function updateTabBarData(autoRefresh) {
        if (!$scope.agentPermissions || !$scope.agentPermissions[$scope.shortName].traces) {
            return;
        }
        if (($scope.layout.central && !$scope.agentRollupId) || !$scope.model.transactionType) {
            $scope.traceCount = 0;
            return;
        }

        concurrentUpdateCount++;
        $http.get('backend/' + $scope.shortName + '/trace-count', {
            params: {
                'agent-rollup-id': $scope.agentRollupId,
                'transaction-type': $scope.model.transactionType,
                'transaction-name': $scope.model.transactionName,
                from: $scope.chart.from,
                to: $scope.chart.to,
                'auto-refresh': autoRefresh ? true : undefined
            }
        }).then(function (response) {
            concurrentUpdateCount--;
            if (concurrentUpdateCount) {
                return;
            }
            if ($state.is('page.transaction.detail.traces') || $state.is('page.error.detail.traces')) {
                filteredTraceTabCount = undefined;
            }
            $scope.traceCount = response.data;

        }, function (response) {
            concurrentUpdateCount--;
            httpErrors.handle(response, $scope);
        });
    }

    $timeout(function () {
        // slight delay to de-prioritize tab bar data request
        updateTabBarData();
    }, 100);
}

