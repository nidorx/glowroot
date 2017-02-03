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


/* global angular, Glowroot, $, Spinner, moment */


angular
        .module('GtCommon')
        .directive('gtAlert', GtConfirmDirective);

function GtConfirmDirective() {
    var TYPES = {
        error: {icon: 'pficon-error-circle-o', className: 'alert-danger'},
        info: {icon: 'pficon-info', className: 'alert-info'},
        success: {icon: 'pficon-ok', className: 'alert-success'},
        warning: {icon: 'pficon-warning-triangle-o', className: 'alert-warning'}
    };

    return {
        scope: {
            type: '@?',
            dismissable: '=?'
        },
        restrict: 'E',
        transclude: true,
        templateUrl: 'modules/GtCommon/templates/GtAlertDirective.html',
        link: function ($scope, $element, $attrs) {
            if (!$attrs.type) {
                $scope.type = 'info';
            }
            if (!$attrs.dismissable) {
                $scope.dismissable = false;
            }

            $scope.ref = {
                visible: true
            }

            $scope.$watchGroup([
                'type',
                'dismissable',
                'visible'
            ], function () {
                console.log('$scope.type', $scope.type);
                if (!$scope.type) {
                    return;
                }
                $scope.icon = TYPES[$scope.type].icon || TYPES.info.icon;
                $scope.className = TYPES[$scope.type].className || TYPES.info.className;
                if ($scope.dismissable) {
                    $scope.className += ' alert-dismissable';
                }
            });
        }
    };
}