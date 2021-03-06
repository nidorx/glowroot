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
        .controller('JvmSystemPropertiesCtrl', JvmSystemPropertiesCtrl);


JvmSystemPropertiesCtrl.$inject = ['$scope', '$http'];

function JvmSystemPropertiesCtrl($scope, $http) {

    // Page header
    $scope.page.title = 'JVM - System properties';
    $scope.page.subTitle = '';
    $scope.page.helpPopoverTemplate = '';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        return;
    }

    $scope.isArray = function (value) {
        return angular.isArray(value);
    };

    $http.get('backend/jvm/system-properties', {
        params: {
            'agent-id': $scope.agentId
        }
    }).then(function (response) {
        $scope.loaded = true;
        var data = response.data;
        $scope.agentNotConnected = data.agentNotConnected;
        $scope.agentUnsupportedOperation = data.agentUnsupportedOperation;
        if ($scope.agentNotConnected || $scope.agentUnsupportedOperation) {
            return;
        }
        $scope.properties = data.properties;
    }, function (response) {
        $scope.$emit('httpError', response);
    });
}
