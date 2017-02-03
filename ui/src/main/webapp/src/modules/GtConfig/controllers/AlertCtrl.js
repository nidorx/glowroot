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
        .controller('ConfigAlertCtrl', ConfigAlertCtrl);


ConfigAlertCtrl.$inject = ['$scope', '$location', '$http', 'confirmIfHasChanges', 'httpErrors'];

function ConfigAlertCtrl($scope, $location, $http, confirmIfHasChanges, httpErrors) {

    // initialize page binding object
    $scope.page = {};

    var version = $location.search().v;

    function onNewData(data) {
        $scope.config = data;
        $scope.originalConfig = angular.copy(data);

        if (data.emailAddresses.length) {
            $scope.page.timePeriodMinutes = data.timePeriodSeconds / 60;
            if (data.kind === 'transaction') {
                $scope.heading = data.transactionType + ' - ' + data.transactionPercentile
                        + $scope.percentileSuffix(data.transactionPercentile) + ' percentile over a '
                        + data.timePeriodSeconds + ' minute period';
            }
            if (data.kind === 'gauge') {
                $scope.heading = data.gaugeDisplay + ' - average over a ' + data.timePeriodSeconds / 60 + ' minute period';
            }
            $scope.emailAddresses = data.emailAddresses.join(', ');
        } else {
            $scope.heading = '<New>';
        }
    }

    $scope.unit = function () {
        if (!$scope.gauges) {
            // list of gauges hasn't loaded yet
            return '';
        }
        var i;
        for (i = 0; i < $scope.gauges.length; i++) {
            if ($scope.gauges[i].name === $scope.config.gaugeName) {
                return $scope.gauges[i].unit;
            }
        }
        return '';
    };

    var halfLoaded;

    function onHalfLoad() {
        if (halfLoaded) {
            $scope.loaded = true;
        } else {
            halfLoaded = true;
        }
    }

    $http.get('backend/jvm/all-gauges?agent-rollup-id=' + encodeURIComponent($scope.agentRollupId))
            .then(function (response) {
                onHalfLoad();
                $scope.gaugeNames = [];
                $scope.gauges = response.data;
            }, function (response) {
                $scope.$emit('httpError', response);
            });

    if (version) {
        $http.get('backend/config/alerts?agent-id=' + encodeURIComponent($scope.agentId) + '&version=' + version)
                .then(function (response) {
                    onHalfLoad();
                    onNewData(response.data);
                }, function (response) {
                    $scope.$emit('httpError', response);
                });
    } else {
        onHalfLoad();
        onNewData({
            kind: 'transaction',
            transactionType: $scope.defaultTransactionType(),
            emailAddresses: []
        });
    }

    $scope.$watch('config.kind', function (newValue) {
        if (!$scope.config) {
            return;
        }
        if (newValue === 'transaction') {
            $scope.config.gaugeName = undefined;
            $scope.config.gaugeThreshold = undefined;
            $scope.config.transactionType = $scope.defaultTransactionType();
        }
        if (newValue === 'gauge') {
            $scope.config.transactionType = undefined;
            $scope.config.transactionPercentile = undefined;
            $scope.config.transactionThresholdMillis = undefined;
            $scope.config.minTransactionCount = undefined;
        }
    });

    $scope.$watch('page.timePeriodMinutes', function (newValue) {
        if (!$scope.config) {
            return;
        }
        if (newValue === undefined) {
            $scope.config.timePeriodSeconds = undefined;
        } else {
            $scope.config.timePeriodSeconds = newValue * 60;
        }
    });

    $scope.$watch('emailAddresses', function (newValue) {
        if (newValue) {
            var emailAddresses = [];
            angular.forEach(newValue.split(','), function (emailAddress) {
                emailAddress = emailAddress.trim();
                if (emailAddress.length) {
                    emailAddresses.push(emailAddress);
                }
            });
            $scope.config.emailAddresses = emailAddresses;
        } else if ($scope.config) {
            $scope.config.emailAddresses = [];
        }
    });

    $scope.hasChanges = function () {
        return !angular.equals($scope.config, $scope.originalConfig);
    };
    var removeConfirmIfHasChangesListener = $scope.$on('$locationChangeStart', confirmIfHasChanges($scope));

    $scope.save = function (deferred) {
        var postData = angular.copy($scope.config);
        var url;
        if (version) {
            url = 'backend/config/alerts/update';
        } else {
            url = 'backend/config/alerts/add';
        }
        var agentId = $scope.agentId;
        $http.post(url + '?agent-id=' + encodeURIComponent(agentId), postData)
                .then(function (response) {
                    onNewData(response.data);
                    deferred.resolve(version ? 'Saved' : 'Added');
                    version = response.data.version;
                    // fix current url (with updated version) before returning to list page in case back button is used later
                    if (agentId) {
                        $location.search({'agent-id': agentId, v: version}).replace();
                    } else {
                        $location.search({v: version}).replace();
                    }
                }, function (response) {
                    httpErrors.handle(response, $scope, deferred);
                });
    };

    $scope.delete = function (deferred) {
        var postData = {
            version: $scope.config.version
        };
        var agentId = $scope.agentId;
        $http.post('backend/config/alerts/remove?agent-id=' + encodeURIComponent(agentId), postData)
                .then(function () {
                    removeConfirmIfHasChangesListener();
                    if (postData) {
                        $location.url('config/alert-list?agent-id=' + encodeURIComponent(agentId)).replace();
                    } else {
                        $location.url('config/alert-list').replace();
                    }
                }, function (response) {
                    httpErrors.handle(response, $scope, deferred);
                });
    };
}

