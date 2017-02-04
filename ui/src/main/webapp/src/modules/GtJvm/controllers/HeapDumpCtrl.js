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
        .controller('JvmHeapDumpCtrl', JvmHeapDumpCtrl);


JvmHeapDumpCtrl.$inject = ['$scope', '$http'];

function JvmHeapDumpCtrl($scope, $http) {

    // Page header
    $scope.page.title = 'JVM - Heap dump';
    $scope.page.subTitle = 'Generate a snapshot of the memory of a Java process.';
    $scope.page.helpPopoverTemplate = 'modules/GtJvm/templates/help/HeapDumpPageHelp.html';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        return;
    }

    // initialize page binding object
    $scope.ref = {};

    $scope.checkDiskSpace = function () {
        var postData = {
            directory: $scope.ref.directory
        };
        $scope.availableDiskSpaceBytes = undefined;
        $scope.heapDumpResponse = false;
        $http.post('backend/jvm/available-disk-space', postData, {
            params: {
                'agent-id': $scope.agentId
            }
        }).then(function (response) {
            var data = response.data;
            if (data.error) {
                // @todo: ??
                if (window.console) {
                    console.log(data.error);
                }
            } else if (data.directoryDoesNotExist) {
                $scope.$emit('txtError', 'Directory does not exist');
            } else {
                $scope.availableDiskSpaceBytes = data;
            }
        }, function (response) {
            $scope.$emit('httpError', response);
        });
    };

    $scope.heapDump = function () {
        var postData = {
            directory: $scope.ref.directory
        };
        $scope.availableDiskSpaceBytes = undefined;
        $scope.heapDumpResponse = false;
        $http.post('backend/jvm/heap-dump', postData, {
            params: {
                'agent-id': $scope.agentId
            }
        }).then(function (response) {
            var data = response.data;
            if (data.error) {
                // @todo: ??
                if (window.console) {
                    console.log(data.error);
                }
            } else if (data.directoryDoesNotExist) {
                $scope.$emit('txtError', 'Directory does not exist');
            } else {
                $scope.heapDumpResponse = data;
            }
        }, function (response) {
            $scope.$emit('httpError', response);
        });
    };

    $http.get('backend/jvm/heap-dump-default-dir', {
        params: {
            'agent-id': $scope.agentId
        }
    }).then(function (response) {
        $scope.loaded = true;
        $scope.agentNotConnected = response.data.agentNotConnected;
        if ($scope.agentNotConnected) {
            return;
        }
        $scope.ref.directory = response.data.directory;
    }, function (response) {
        $scope.$emit('httpError', response);
    });
}
