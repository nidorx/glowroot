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
        .controller('JvmCapabilitiesCtrl', JvmCapabilitiesCtrl);


JvmCapabilitiesCtrl.$inject = ['$scope', '$http'];

function JvmCapabilitiesCtrl($scope, $http) {

    // Page header
    $scope.page.title = 'JVM - Capabilities';
    $scope.page.subTitle = '';
    $scope.page.helpPopoverTemplate = '';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        return;
    }

    $http.get('backend/jvm/capabilities', {
        params: {
            'agent-id': $scope.agentId
        }
    }).then(function (response) {
        $scope.loaded = true;
        $scope.agentNotConnected = response.data.agentNotConnected;
        if ($scope.agentNotConnected) {
            return;
        }
        $scope.capabilities = response.data;
    }, function (response) {
        $scope.$emit('httpError', response);
    });
}

