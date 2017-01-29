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
        .controller('TransactionTraceModalCtrl', TransactionTraceModalCtrl);


TransactionTraceModalCtrl.$inject = ['$scope', '$http', '$location'];

function TransactionTraceModalCtrl($scope, $http, $location) {

    var agentRollupId = $location.search()['modal-agent-rollup-id'] || $location.search()['modal-agent-id'] || '';
    var agentId = $location.search()['modal-agent-id'] || '';
    var traceId = $location.search()['modal-trace-id'];
    var checkLiveTraces = $location.search()['modal-check-live-traces'];

    var url = [
        'backend/trace/header?agent-rollup-id=' + encodeURIComponent(agentRollupId),
        'agent-id=' + encodeURIComponent(agentId),
        'trace-id=' + traceId
    ].join('&');
    if (checkLiveTraces) {
        url += '&check-live-traces=true';
    }

    $http.get(url).then(function (response) {
        var data = response.data;

        if (data.expired) {
            $scope.expired = true;
        } else {
            data.showExport = true;
            $scope.data = data;
            $scope.agentRollupId = agentRollupId;
            $scope.agentId = agentId;
            $scope.traceId = traceId;
            $scope.checkLiveTraces = checkLiveTraces;
        }
    }, function () {
        // @todo: Msg error An error occurred retrieving the trace
    });

    $scope.downloadUrl = function () {
        var $traceParent = $(this).parents('.gt-trace-parent');
        var traceId = $traceParent.data('gtTraceId');
        var checkLiveTraces = $traceParent.data('gtCheckLiveTraces');
        var url = document.getElementsByTagName('base')[0].href + 'export/trace?';
        if (agentRollupId !== agentId) {
            url += 'agent-rollup-id=' + encodeURIComponent(agentRollupId) + '&';
        }
        url += 'agent-id=' + encodeURIComponent(agentId) + '&trace-id=' + traceId;
        if (checkLiveTraces) {
            url += '&check-live-traces=true';
        }
        window.location = url;
    };
}

