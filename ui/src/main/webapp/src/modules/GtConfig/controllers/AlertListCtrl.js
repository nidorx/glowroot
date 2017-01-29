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
        .module('GtConfig')
        .controller('ConfigAlertListCtrl', ConfigAlertListCtrl);


ConfigAlertListCtrl.$inject = ['$scope', '$location', '$http', '$filter', 'queryStrings', 'httpErrors'];

function ConfigAlertListCtrl($scope, $location, $http, $filter, queryStrings, httpErrors) {

    if ($scope.hideMainContent()) {
        return;
    }

    $scope.alertQueryString = function (alert) {
        var query = {};
        if ($scope.agentId) {
            query.agentId = $scope.agentId;
        }
        query.v = alert.version;
        return queryStrings.encodeObject(query);
    };

    $scope.alertText = function (alert) {
        if (alert.kind === 'transaction') {
            return alert.transactionType + ' - ' + alert.transactionPercentile
                    + $scope.percentileSuffix(alert.transactionPercentile) + ' percentile over a '
                    + alert.timePeriodSeconds / 60 + ' minute period exceeds ' + alert.transactionThresholdMillis
                    + ' milliseconds';
        } else if (alert.kind === 'gauge') {
            var threshold;
            if (alert.gaugeUnit === 'bytes') {
                threshold = $filter('gtBytes')(alert.gaugeThreshold);
            } else if (alert.gaugeUnit) {
                threshold = alert.gaugeThreshold + ' ' + alert.gaugeUnit;
            } else {
                threshold = alert.gaugeThreshold;
            }
            return 'Gauge - ' + alert.gaugeDisplay + ' - average over a ' + alert.timePeriodSeconds / 60
                    + ' minute period exceeds ' + threshold;
        } else if (alert.kind === 'heartbeat') {
            return 'Heartbeat - no heartbeat received for ' + alert.timePeriodSeconds + ' seconds';
        } else {
            return 'Unknown alert kind ' + alert.kind;
        }
    };

    $scope.newQueryString = function () {
        if ($scope.agentId) {
            return '?agent-id=' + encodeURIComponent($scope.agentId) + '&new';
        }
        return '?new';
    };

    $http.get('backend/config/alerts?agent-id=' + encodeURIComponent($scope.agentId))
            .then(function (response) {
                $scope.loaded = true;
                $scope.alerts = response.data;
            }, function (response) {
                httpErrors.handle(response, $scope);
            });
}

