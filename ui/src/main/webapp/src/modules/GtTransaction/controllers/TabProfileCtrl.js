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
        .controller('TransactionTabProfileCtrl', TransactionTabProfileCtrl);


TransactionTabProfileCtrl.$inject = [
    '$scope', '$http', '$location', 'locationChanges', 'queryStrings', 'httpErrors', 'model'
];

function TransactionTabProfileCtrl($scope, $http, $location, locationChanges, queryStrings,
        httpErrors, model) {

    $scope.model = model;
    $scope.range = model.range;

    if ($scope.hideMainContent()) {
        return;
    }

    var appliedFilter;

    $scope.showProfile = false;
    $scope.showSpinner = 0;

    $scope.$watchGroup([
        'chart.from',
        'chart.to',
        'chart.refresh',
        'auxiliary'
    ], function () {
        $location.search('filter', $scope.filter || null);
        $location.search('auxiliary', $scope.auxiliary ? 'true' : null);
        refreshData();
    });

    $scope.tabQueryString = function (auxiliary) {
        var query = $scope.buildQueryObject({});
        if (auxiliary) {
            query.auxiliary = true;
        }
        return queryStrings.encodeObject(query);
    };

    $scope.clickTopRadioButton = function (auxiliary) {
        if (($scope.auxiliary && auxiliary) || (!$scope.auxiliary && !auxiliary)) {
            $scope.chart.refresh++;
        } else {
            $scope.auxiliary = auxiliary;
        }
    };

    $scope.clickActiveTopLink = function (event, auxiliary) {
        if (event.ctrlKey) {
            return;
        }
        if (($scope.auxiliary && auxiliary) || (!$scope.auxiliary && !auxiliary)) {
            $scope.chart.refresh++;
            // suppress normal link
            event.preventDefault();
            return false;
        }
    };

    $scope.flameGraphHref = function () {
        var query = $scope.buildQueryObject();
        delete query['summary-sort-order'];
        if ($scope.filter) {
            query.filter = $scope.filter;
        }
        if ($scope.auxiliary || (!$scope.hasUnfilteredMainThreadProfile && $scope.hasUnfilteredAuxThreadProfile)) {
            query.auxiliary = true;
        }
        return 'transaction/thread-flame-graph' + queryStrings.encodeObject(query);
    };

    $scope.refresh = function () {
        $scope.applyLast();
        appliedFilter = $scope.filter;
        $scope.chart.refresh++;
    };

    locationChanges.on($scope, function () {
        var priorAppliedFilter = appliedFilter;
        appliedFilter = $location.search().filter || '';

        if (priorAppliedFilter !== undefined && appliedFilter !== priorAppliedFilter) {
            // e.g. back or forward button was used to navigate
            $scope.chart.refresh++;
        }
        $scope.filter = appliedFilter;
        $scope.truncateBranchPercentage = $location.search()['truncate-branch-percentage'] || 0.1;
        $scope.auxiliary = $location.search().auxiliary || false;
    });

    $('.gt-profile-text-filter').on('gtClearProfileFilter', function (event, response) {
        $scope.$apply(function () {
            $scope.filter = '';
            $scope.refresh();
        });
        response.handled = true;
    });

    function refreshData() {
        $scope.parsingError = undefined;
        var parseResult = gtParseIncludesExcludes($scope.filter);
        if (parseResult.error) {
            $scope.parsingError = parseResult.error;
            $scope.showProfile = true;
            $scope.sampleCount = 0;
            $('#profileOuter').removeData('gtLoaded');
            //HandlebarsRendering.profileToggle(undefined, '#profileOuter', {stackTraceElement: '', sampleCount: 0});
            return;
        }
        var query = {
            agentRollupId: $scope.agentRollupId,
            transactionType: $scope.model.transactionType,
            transactionName: $scope.model.transactionName,
            from: $scope.chart.from,
            to: $scope.chart.to,
            auxiliary: $scope.auxiliary,
            include: parseResult.includes,
            exclude: parseResult.excludes,
            truncateBranchPercentage: $scope.truncateBranchPercentage
        };
        $scope.showSpinner++;
        $http.get('backend/transaction/profile' + queryStrings.encodeObject(query))
                .then(function (response) {
                    $scope.showSpinner--;
                    var data = response.data;
                    $scope.showOverwrittenMessage = data.overwritten;
                    $scope.hasUnfilteredMainThreadProfile = data.hasUnfilteredMainThreadProfile;
                    $scope.hasUnfilteredAuxThreadProfile = data.hasUnfilteredAuxThreadProfile;
                    if ($scope.showOverwrittenMessage) {
                        $scope.showProfile = false;
                        return;
                    }
                    $scope.showProfile = data.profile.unfilteredSampleCount;
                    if ($scope.showProfile) {
                        $scope.sampleCount = data.profile.unfilteredSampleCount;
                        $('#profileOuter').removeData('gtLoaded');
                        //HandlebarsRendering.profileToggle(undefined, '#profileOuter', data.profile);
                    }
                }, function (response) {
                    $scope.showSpinner--;
                    $scope.$emit('httpError', response);
                });
    }
}

