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
        .directive('gtConfirm', GtConfirmDirective);


GtConfirmDirective.$inject = ['$uibModal'];

/**
 * Show confirm message before call ng-click
 * 
 * @param {type} gtButtonGroupControllerFactory
 * @param {type} modals
 * @returns {GtConfirmDirective.GtConfirmDirectiveAnonym$0}
 */
function GtConfirmDirective($uibModal) {
    return {
        scope: {
            ngClick: '&',
            gtConfirm: '@',
            gtConfirmHeader: '@',
            gtConfirmTemplate: '@',
            gtConfirmModalOptions: '@',
        },
        link: function ($scope, $element, $attrs) {
            if (!$attrs.ngClick) {
                return;
            }

            $element.unbind('click');
            $element.bind('click', function (e) {                

                var options = angular.extend({}, $scope.gtConfirmModalOptions || {}, {
                    animation: true,
                    backdrop: true, //can also be false or 'static'
                    keyboard: true,
                    size:'sm',
                    scope: $scope,
                    templateUrl: 'modules/GtCommon/templates/GtConfirmDirective.html',
                    controller: GtConfirmModalController
                });

                $uibModal.open(options);
            });
        }
    };

    GtConfirmModalController.$inject = ['$scope', '$uibModalInstance'];

    function GtConfirmModalController($scope, $uibModalInstance) {

        $scope.confirm = function () {
            $uibModalInstance.close();
            $scope.ngClick();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
}