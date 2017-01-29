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
        .module('GtApp')
        .directive('gtButton', GtButtonDirective);


GtButtonDirective.$inject = ['gtButtonGroupControllerFactory', 'modals'];

function GtButtonDirective(gtButtonGroupControllerFactory, modals) {
    return {
        scope: {
            gtLabel: '@',
            gtClick: '&',
            gtBtnClass: '@',
            gtDisabled: '&',
            gtNoSpinner: '@',
            gtConfirmHeader: '@',
            gtConfirmBody: '@'
        },
        templateUrl: 'modules/GtApp/templates/GtButton.html',
        require: '^?gtButtonGroup',
        link: function (scope, iElement, iAttrs, gtButtonGroup) {
            if (!gtButtonGroup) {
                scope.noGroup = true;
                gtButtonGroup = gtButtonGroupControllerFactory.create(iElement, scope.gtNoSpinner);
            }
            scope.onClick = function () {
                if (scope.gtConfirmHeader) {
                    var $modal = $('#confirmationModal');
                    $modal.find('.modal-header h3').text(scope.gtConfirmHeader);
                    $modal.find('.modal-body p').text(scope.gtConfirmBody);
                    modals.display('#confirmationModal', true);
                    $('#confirmationModalButton').off('click');
                    $('#confirmationModalButton').on('click', function () {
                        scope.$apply(function () {
                            $('#confirmationModal').modal('hide');
                            gtButtonGroup.onClick(scope.gtClick);
                        });
                    });
                } else {
                    gtButtonGroup.onClick(scope.gtClick);
                }
            };
        }
    };
}