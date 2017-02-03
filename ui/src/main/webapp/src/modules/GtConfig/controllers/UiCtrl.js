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
        .controller('ConfigUiCtrl', ConfigUiCtrl);


ConfigUiCtrl.$inject = ['$scope', '$http', '$rootScope', '$location', 'confirmIfHasChanges', 'httpErrors'];

function ConfigUiCtrl($scope, $http, $rootScope, $location, confirmIfHasChanges, httpErrors) {

    // initialize page binding object
    $scope.page = {};

    if ($scope.hideMainContent()) {
        return;
    }

    $scope.$watch('page.defaultDisplayedPercentiles', function (newVal) {
        if ($scope.config) {
            var percentiles = [];
            if (newVal) {
                angular.forEach(newVal.split(','), function (percentile) {
                    percentile = percentile.trim();
                    if (percentile.length) {
                        percentiles.push(Number(percentile));
                    }
                });
            }
            $scope.config.defaultDisplayedPercentiles = percentiles;
        }
    });

    $scope.hasChanges = function () {
        return $scope.originalConfig && !angular.equals($scope.config, $scope.originalConfig);
    };
    $scope.$on('$locationChangeStart', confirmIfHasChanges($scope));

    function onNewData(data) {
        $scope.loaded = true;
        $scope.config = data;
        $scope.originalConfig = angular.copy(data);
        $scope.page = {};

        $scope.page.defaultDisplayedPercentiles = $scope.config.defaultDisplayedPercentiles.join(', ');
    }

    $scope.save = function (deferred) {
        var postData = angular.copy($scope.config);
        $http.post('backend/config/ui?agent-id=' + encodeURIComponent($scope.agentId), postData)
                .then(function (response) {
                    onNewData(response.data);
                    deferred.resolve('Saved');
                }, function (response) {
                    httpErrors.handle(response, $scope, deferred);
                });
    };

    $http.get('backend/config/ui?agent-id=' + encodeURIComponent($scope.agentId))
            .then(function (response) {
                onNewData(response.data);
            }, function (response) {
                $scope.$emit('httpError', response);
            });
}

