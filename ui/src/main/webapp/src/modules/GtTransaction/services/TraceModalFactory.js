/*
 * Copyright 2012-2016 the original author or authors.
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

/* global Glowroot, HandlebarsRendering, $ */

angular
        .module('GtTransaction')
        .factory('traceModal', TraceModalFactory);

TraceModalFactory.$inject = ['$http', 'modals'];

function TraceModalFactory($http, modals) {

    function displayModal(agentRollupId, agentId, traceId, checkLiveTraces) {

        var $modalContent = $('#traceModal .modal-body');

        modals.display('#traceModal');
        var url = 'backend/trace/header?agent-rollup-id=' + encodeURIComponent(agentRollupId) + '&agent-id='
                + encodeURIComponent(agentId) + '&trace-id=' + traceId;
        if (checkLiveTraces) {
            url += '&check-live-traces=true';
        }
        return;
        $http.get(url).then(function (response) {
            var data = response.data;
            $('#chart canvas').hide();
            if (data.expired) {
                $modalContent.html('expired');
            } else {
                data.showExport = true;
                HandlebarsRendering.renderTrace(data, agentRollupId, agentId, traceId, checkLiveTraces, $modalContent);
                $('#traceModal .modal-body button.download-trace').click(function () {
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
                });
            }
        }, function () {
            $modalContent.html(
                    '<div class="gt-red" style="padding: 1em;">An error occurred retrieving the trace</div>');
        });

        // padding is same as for trace once it loads
        $modalContent.html('<div style="position: relative; display: inline-block; padding-left: 40px; padding-top: 60px;"></div>');

    }

    return {
        displayModal: displayModal
    };
}
