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
        .controller('JvmThreadDumpCtrl', JvmThreadDumpCtrl);


JvmThreadDumpCtrl.$inject = ['$scope', '$http', '$location', 'locationChanges', 'traceModal'];

function JvmThreadDumpCtrl($scope, $http, $location, locationChanges, traceModal) {

    // Page header
    $scope.page.title = 'JVM - Thread Dump';
    $scope.page.subTitle = 'Snapshot of the state of all threads that are part of the process.';
    $scope.page.helpPopoverTemplate = 'modules/GtJvm/templates/help/ThreadDumpPageHelp.html';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        return;
    }

    locationChanges.on($scope, function () {
        var modalTraceId = $location.search()['modal-trace-id'];
        var modalCheckLiveTraces = $location.search()['modal-check-live-traces'];
        if (modalTraceId) {
            $('#traceModal').data('location-query', ['modal-trace-id', 'modal-check-live-traces']);
            traceModal.displayModal($scope.agentRollupId, $scope.agentId, modalTraceId, modalCheckLiveTraces);
        } else {
            $('#traceModal').modal('hide');
        }
    });

    $scope.refresh = function () {
        $scope.loaded = false;
        $http.get('backend/jvm/thread-dump', {
            params: {
                'agent-id': $scope.agentId
            }
        }).then(function (response) {
            $scope.loaded = true;
            $scope.agentNotConnected = response.data.agentNotConnected;
            if ($scope.agentNotConnected) {
                return;
            }
            $scope.data = response.data;

            if ($scope.data.deadlockedCycles) {
                $scope.data.deadlocks = $scope.data.deadlockedCycles.map(function (cycles) {
                    return {
                        cycles: cycles,
                        threads: cycles.map(function (cycle) {
                            var thread;
                            for (var a = 0, l = $scope.data.unmatchedThreads.length; a < l; a++) {
                                if ($scope.data.unmatchedThreads[a].name === cycle.name) {
                                    thread = $scope.data.unmatchedThreads[a];
                                    break;
                                }
                            }
                            return {
                                name: cycle.name,
                                thread: thread
                            };
                        })
                    };
                });
            }
        }, function (response) {
            $scope.$emit('httpError', response);
        });
    };

    $scope.refresh();
}
