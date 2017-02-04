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
        .controller('JvmGcCtrl', JvmGcCtrl);


JvmGcCtrl.$inject = ['$scope', '$http'];

function JvmGcCtrl($scope, $http) {

    // Page header
    $scope.page.title = 'JVM - Garbage Collection';
    $scope.page.subTitle = '';
    $scope.page.helpPopoverTemplate = '';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        return;
    }

    $scope.gc = function () {
        $http.post('backend/jvm/gc', {}, {
            params: {
                'agent-id': $scope.agentId
            }
        }).then(function () {

        }, function (response) {
            $scope.$emit('httpError', response);
        });
    };

    $http.get('backend/jvm/gc-check-agent-connected', {
        params: {
            'agent-id': $scope.agentId
        }
    }).then(function (response) {
        $scope.loaded = true;
        $scope.agentNotConnected = !response.data;
        if ($scope.agentNotConnected) {
            return;
        }
    }, function (response) {
        $scope.$emit('httpError', response);
    });
}
