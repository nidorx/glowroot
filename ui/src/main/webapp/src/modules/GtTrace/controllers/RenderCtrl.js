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

// IMPORTANT: DO NOT USE ANGULAR IN THIS FILE
// that would require adding angular to trace-export.js
// and that would significantly increase the size of the exported trace files

// Glowroot dependency is used for spinner, but is not used in export file
// angular dependency is used to call login.goToLogin() on 401 responses, but is not used in export file
/* global $, Handlebars, JST, moment, Glowroot, angular, SqlPrettyPrinter, gtClipboard, gtParseIncludesExcludes, console */

// IMPORTANT: DO NOT USE ANGULAR IN THIS FILE
// that would require adding angular to trace-export.js
// and that would significantly increase the size of the exported trace files


angular
        .module('GtTrace')
        .controller('TraceRenderCtrl', TraceRenderCtrl);


TraceRenderCtrl.$inject = ['$scope', '$http'];

function TraceRenderCtrl($scope, $http) {

    // Used to mantain scope
    $scope.aux = {};

// showing ellipsed node markers makes the rendered profile tree much much larger since it cannot contract otherwise
// identical branches, and this makes navigation more difficult, as well as makes rendering much slower
    var SHOW_ELLIPSED_NODE_MARKERS = false;

    // indent1 must be sync'd with $indent1 variable in common-trace.less
    var monospaceCharWidth = 8.41;
    var traceEntryLineLength;
    $scope.traceEntryBarWidth = 50;
    var MULTIPLE_ROOT_NODES = '<multiple root nodes>';


    /**
     *
     * @returns {undefined}
     */
    $scope.downloadTrace = function () {
        var agentId = $scope.agentId;
        var traceId = $scope.traceId;
        var agentRollupId = $scope.agentRollupId;
        var checkLiveTraces = $scope.checkLiveTraces;
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

    /**
     * Load Trace entries
     *
     * @returns {undefined}]
     */
    $scope.loadEntries = function () {

        if ($scope.entries) {
            // next times
            return;
        }

        var entries = $scope.entries;
        if (entries) {
            // this is an export file
            //
            // first time opening
            initTraceEntryLineLength();
            mergeInSharedQueryTexts($scope.entries, $scope.sharedQueryTexts);
            $scope.entries = entries;
        } else {
            // this is not an export file

            $http.get('backend/trace/entries', {
                params: {
                    'trace-id': $scope.traceId,
                    'agent-id': $scope.agentId || '',
                    'agent-rollup-id': $scope.agentRollupId || '',
                    'check-live-traces': $scope.checkLiveTraces ? 'true' : null
                }
            }).then(function (response) {
                var data = response.data;
                if (data.overwritten) {
                    $scope.entriesExpired = true;
                    $scope.entriesOverwritten = true;
                } else if (data.expired) {
                    $scope.entriesExpired = true;
                } else {
                    // first time opening
                    initTraceEntryLineLength();
                    mergeInSharedQueryTexts(data.entries, data.sharedQueryTexts);
                    $scope.entries = data.entries;
                    $scope.sharedQueryTexts = data.sharedQueryTexts;
                }
            }, function (cause) {
                if (cause.status === 401) {
                    // goToLogin(jqXHR.responseJSON.timedOut);
                } else {
                    // An error occurred retrieving the trace entries
                }
            });
        }
    };

    /**
     *
     * @returns {undefined}
     */
    $scope.loadMainThreadProfile = function () {
        var mainThreadProfile = $scope.mainThreadProfile;
        var url;
        if (!mainThreadProfile) {
            // this is not an export file
            var agentRollupId = $scope.agentRollupId;
            var agentId = $scope.agentId;
            var traceId = $scope.traceId;
            var checkLiveTraces = $scope.checkLiveTraces;

            url = [
                'backend/trace/main-thread-profile?agent-rollup-id=' + encodeURIComponent(agentRollupId),
                'agent-id=' + encodeURIComponent(agentId),
                'trace-id=' + traceId
            ].join('&');
            if (checkLiveTraces) {
                url += '&check-live-traces=true';
            }
        }
        loadProfiles(mainThreadProfile, url, 'mainThreadProfile');
    };

    /**
     *
     * @returns {undefined}
     */
    $scope.loadAuxThreadProfile = function () {
        var auxThreadProfile = $scope.auxThreadProfile;
        var url;
        if (!auxThreadProfile) {
            // this is not an export file
            var agentId = $scope.agentId;
            var traceId = $scope.traceId;
            var agentRollupId = $scope.agentRollupId;
            var checkLiveTraces = $scope.checkLiveTraces;

            url = [
                'backend/trace/aux-thread-profile?agent-rollup-id=' + encodeURIComponent(agentRollupId),
                'agent-id=' + encodeURIComponent(agentId),
                'trace-id=' + traceId
            ].join('&');
            if (checkLiveTraces) {
                url += '&check-live-traces=true';
            }
        }
        loadProfiles(auxThreadProfile, url, 'auxThreadProfile');
    };

    /**
     *
     * @param {type} profile
     * @param {type} url
     * @param {type} profileName
     * @returns {undefined}
     */
    function loadProfiles(profile, url, profileName) {
        if (profile) {
            // this is an export file or transaction profile tab
            $scope[profileName] = buildMergedStackTree(profile);
        } else {

            $http.get(url).then(function (response) {
                var data = response.data;

                if (data.overwritten) {
                    $scope[profileName + 'Expired'] = true;
                    $scope[profileName + 'Overwritten'] = true;
                } else if (data.expired) {
                    $scope[profileName + 'Expired'] = true;
                } else {
                    $scope[profileName] = buildMergedStackTree(data);
                }

            }, function (cause) {
                if (cause.status === 401) {
                    //goToLogin(jqXHR.responseJSON.timedOut);
                } else {
                    // An error occurred retrieving the profile
                }
            });
        }
    }

    function buildMergedStackTree(profile) {

        var rootNode = {
            stackTraceElement: '',
            sampleCount: 0,
            ellipsedSampleCount: 0,
            childNodes: []
        };

        $.each(profile.rootNodes, function (index, node) {
            rootNode.sampleCount += node.sampleCount;
            rootNode.ellipsedSampleCount += node.ellipsedSampleCount;
            if (!node.ellipsedSampleCount || node.sampleCount > node.ellipsedSampleCount) {
                rootNode.childNodes.push(node);
            }
        });

        // root node is always synthetic root node
        if (rootNode.childNodes && rootNode.childNodes.length === 1 && !rootNode.ellipsedSampleCount) {
            // strip off synthetic root node
            rootNode = rootNode.childNodes[0];
        } else {
            rootNode.stackTraceElement = MULTIPLE_ROOT_NODES;
        }

        var traces = parseTraces();
        if (!angular.isArray(traces)) {
            traces = [traces];
        }
        return traces;


        function parseTraces(timer) {

            if (!rootNode.childNodes) {
                // special case of empty result
                return '';
            }

            function curr(node, level) {
                var nodeSampleCount;

                if (timer) {
                    nodeSampleCount = node.timerCounts[timer] || 0;
                } else {
                    nodeSampleCount = node.sampleCount;
                }

                if (nodeSampleCount === 0) {
                    return '';
                }

                var nodes = [node];

                while (node.childNodes && node.childNodes.length === 1 && !node.leafThreadState
                        // the below condition is to make the 100% block at the top really mean exactly 100% (no ellipsed nodes)
                        && (node.sampleCount === node.childNodes[0].sampleCount || node.sampleCount < profile.unfilteredSampleCount)
                        && (!SHOW_ELLIPSED_NODE_MARKERS || !node.ellipsedSampleCount)) {
                    node = node.childNodes[0];
                    nodes.push(node);
                }

                if (!timer) {
                    // the displayed percentage for this chain is based on the last node
                    // (this is noticeable with large truncation percentages where the first/last node in a chain can have
                    // noticeably different sample counts)
                    nodeSampleCount = nodes[nodes.length - 1].sampleCount;
                }

                var samplePercentage = (nodeSampleCount / profile.unfilteredSampleCount) * 100;

                var item = {
                    stackTraceElement: node.stackTraceElement,
                    ellipsedSampleCount: node.ellipsedSampleCount,
                    leafThreadState: node.leafThreadState,
                    samplePercentage: samplePercentage
                };

                if (node.childNodes) {
                    var childNodes = node.childNodes;
                    // order child nodes by sampleCount (descending)
                    childNodes.sort(function (a, b) {
                        if (timer) {
                            return (b.timerCounts[timer] || 0) - (a.timerCounts[timer] || 0);
                        } else {
                            return b.sampleCount - a.sampleCount;
                        }
                    });

                    item.childEntries = [];
                    for (var i = 0; i < childNodes.length; i++) {
                        item.childEntries.push(curr(childNodes[i], level + 1));
                    }
                }

                if (SHOW_ELLIPSED_NODE_MARKERS && node.ellipsedSampleCount) {
                    var ellipsedSamplePercentage = (node.ellipsedSampleCount / rootNode.sampleCount) * 100;
                    item.ellipsedSamplePercentage = ellipsedSamplePercentage;
                }

                return item;
            }

            return curr(rootNode, 0);
        }
    }

    function traverseTimers(timers, callback) {
        function traverse(timer, depth) {
            callback(timer, depth);
            if (timer.childTimers) {
                $.each(timer.childTimers, function (index, childTimer) {
                    traverse(childTimer, depth + 1);
                });
            }
        }

        // add the root node(s)
        if ($.isArray(timers)) {
            $.each(timers, function (index, timer) {
                traverse(timer, 0);
            });
        } else {
            traverse(timers, 0);
        }
    }

    function initTotalNanosList(breakdown) {
        if (!breakdown.treeTimers) {
            // e.g. no auxiliary threads
            return;
        }
        breakdown.treeTotalNanosList = buildTotalNanosList(breakdown.treeTimers);
        breakdown.flattenedTotalNanosList = buildTotalNanosList(breakdown.flattenedTimers);
    }

    function buildTotalNanosList(timers) {
        var totalNanosList = [];
        traverseTimers(timers, function (timer) {
            totalNanosList.push(timer.totalNanos);
        });
        totalNanosList.sort(function (a, b) {
            return b - a;
        });
        return totalNanosList;
    }

    function initOneLimit(breakdown, timers, totalNanosList) {
        var limit = Math.min(breakdown.limit, totalNanosList.length);
        var thresholdNanos = totalNanosList[limit - 1];
        var count = 0;
        traverseTimers(timers, function (timer) {
            // count is to handle multiple timers equal to the threshold
            timer.show = (timer.totalNanos >= thresholdNanos) && ((count++) < breakdown.limit);
        });
    }

    function initLimit(breakdown) {
        breakdown.ftShowMore = breakdown.limit < breakdown.flattenedTimers.length;
        breakdown.ttShowMore = breakdown.limit < breakdown.timers.length;
        breakdown.showLess = breakdown.limit !== 10;
        initOneLimit(breakdown, breakdown.treeTimers, breakdown.treeTotalNanosList);
        initOneLimit(breakdown, breakdown.flattenedTimers, breakdown.flattenedTotalNanosList);
    }

    function initTimers(breakdown) {
        if (!breakdown.treeTimers) {
            // e.g. no auxiliary threads
            return;
        }
        var nextId = 0;
        var timers = [];

        traverseTimers(breakdown.treeTimers, function (timer, depth) {
            timer.id = nextId++;
            timer.depth = depth;
            timers.push(timer);
            if (timer.childTimers) {
                timer.childTimers.sort(function (a, b) {
                    return b.totalNanos - a.totalNanos;
                });
            }
        });
        breakdown.timers = timers;
    }

    function initFlattenedTimers(breakdown) {
        if (!breakdown.treeTimers) {
            // e.g. no auxiliary threads
            return;
        }
        var nextId = 0;
        var flattenedTimerMap = {};
        var flattenedTimers = [];

        function traverse(timer, parentTimerNames) {
            var flattenedTimer = flattenedTimerMap[timer.name];
            if (!flattenedTimer) {
                flattenedTimer = {
                    name: timer.name,
                    totalNanos: timer.totalNanos,
                    count: timer.count,
                    active: timer.active,
                    id: nextId++
                };
                flattenedTimerMap[timer.name] = flattenedTimer;
                flattenedTimers.push(flattenedTimer);
            } else if (parentTimerNames.indexOf(timer.name) === -1) {
                // only add to existing flattened timer if the timer isn't appearing under itself
                // (this is possible when they are separated by another timer)
                flattenedTimer.totalNanos += timer.totalNanos;
                flattenedTimer.active = flattenedTimer.active || timer.active;
                flattenedTimer.count += timer.count;
            }
            if (timer.childTimers) {
                $.each(timer.childTimers, function (index, nestedTimer) {
                    traverse(nestedTimer, parentTimerNames.concat(timer.name));
                });
            }
        }

        // add the root node(s)
        if ($.isArray(breakdown.treeTimers)) {
            $.each(breakdown.treeTimers, function (index, item) {
                traverse(item, []);
            });
        } else {
            traverse(breakdown.treeTimers, []);
        }

        flattenedTimers.sort(function (a, b) {
            return b.totalNanos - a.totalNanos;
        });

        breakdown.flattenedTimers = flattenedTimers;
    }

    function initTraceEntryLineLength() {
        // -170 for the left margin of the trace entry lines
        traceEntryLineLength = ($('#entries').width() - 220) / monospaceCharWidth;
        // min value of 60, otherwise not enough context provided by the elipsed line
        traceEntryLineLength = Math.max(traceEntryLineLength, 60);
        // max value of 240, since long queries are only initially retrieved with first 120 and last 120 characters
        traceEntryLineLength = Math.min(traceEntryLineLength, 240);
    }

    function mergeInSharedQueryTexts(entries, sharedQueryTexts) {
        angular.forEach(entries, function (entry, index) {
            if (entry.queryMessage) {
                entry.queryMessage.sharedQueryText = sharedQueryTexts[entry.queryMessage.sharedQueryTextIndex];
                if (!entry.queryMessage.sharedQueryText.fullTextSha1) {
                    entry.message = entry.queryMessage.prefix + entry.queryMessage.sharedQueryText.fullText + entry.queryMessage.suffix;
                }
            }
            if (entry.childEntries) {
                mergeInSharedQueryTexts(entry.childEntries, sharedQueryTexts);
            }
        });
    }

    function renderNext(entries, start) {
        return;
        // large numbers of trace entries (e.g. 20,000) render much faster when grouped into sub-divs
        var batchSize;
        var i;
        if (start === 0) {
            // first batch size is smaller to make the records show up on screen right away
            batchSize = 100;
        } else {
            // rest of batches are optimized for total throughput
            batchSize = 500;
        }
        var html = '';
        for (i = start; i < Math.min(start + batchSize, entries.length); i++) {
            html += JST['trace-entry'](entries[i]);
        }
        $('#entries').append(html);
        if (start + 100 < entries.length) {
            setTimeout(function () {
                renderNext(entries, start + batchSize);
            }, 10);
        }
    }

    /**
     *
     * @returns {undefined}
     */
    function renderTrace() {
        $scope.data.mainBreakdown = {
            treeTimers: $scope.data.mainThreadRootTimer,
            prefix: 'm',
            limit: 10
        };
        $scope.data.auxBreakdown = {
            treeTimers: $scope.data.auxThreadRootTimers,
            prefix: 'a',
            limit: 10
        };
        // initializing timers needs to occur before rendering
        initTimers($scope.data.mainBreakdown);
        initTimers($scope.data.auxBreakdown);
        initFlattenedTimers($scope.data.mainBreakdown);
        initFlattenedTimers($scope.data.auxBreakdown);
//
//        initTotalNanosList($scope.data.mainBreakdown);
//        initTotalNanosList($scope.data.auxBreakdown);

//        initLimit($scope.data.mainBreakdown);
//        initLimit($scope.data.auxBreakdown);

        $scope.traceDurationNanos = $scope.data.durationNanos;

//        registerShowMoreHandler($scope.data.mainBreakdown);
//        registerShowMoreHandler($scope.data.auxBreakdown);
//
//        registerShowLessHandler($scope.data.mainBreakdown);
//        registerShowLessHandler($scope.data.auxBreakdown);
//
//        registerShowAllHandler($scope.data.mainBreakdown);
//        registerShowAllHandler($scope.data.auxBreakdown);
    }

    $scope.$watch('data', function (data) {
        if (data) {
            renderTrace();
        }
    });
}





