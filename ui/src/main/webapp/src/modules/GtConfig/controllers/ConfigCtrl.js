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
        .controller('ConfigCtrl', ConfigCtrl);


ConfigCtrl.$inject = ['$scope', '$location'];

function ConfigCtrl($scope, $location) {
    // \u00b7 is &middot;
    document.title = 'Configuration \u00b7 Glowroot';
    $scope.$parent.activeNavbarItem = 'gears';

    $scope.hideAgentRollupDropdown = function () {
        if (!$scope.layout) {
            // this is ok, under grunt serve and layout hasn't loaded yet
            return true;
        }
        return $scope.layout.agentRollups.length === 1;
    };

    $scope.hideMainContent = function () {
        return $scope.layout.central && !$scope.agentRollupId && !$scope.agentId;
    };

    $scope.percentileSuffix = function (percentile) {
        var text = String(percentile);
        if (text === '11' || /\.11$/.test(text)) {
            return 'th';
        }
        if (text === '12' || /\.12$/.test(text)) {
            return 'th';
        }
        if (text === '13' || /\.13$/.test(text)) {
            return 'th';
        }
        var lastChar = text.charAt(text.length - 1);
        if (lastChar === '1') {
            return 'st';
        }
        if (lastChar === '2') {
            return 'nd';
        }
        if (lastChar === '3') {
            return 'rd';
        }
        return 'th';
    };

    $scope.currentUrl = function () {
        return $location.path().substring(1);
    };

    $scope.$on('$stateChangeSuccess', function () {
        // don't let the active sidebar selection get out of sync (which can happen after using the back button)
        if (document.activeElement) {
            var gtUrl = document.activeElement.getAttribute('gt-url');
            if (gtUrl && gtUrl !== $location.path().substring(1)) {
                document.activeElement.blur();
            }
        }
    });
}
