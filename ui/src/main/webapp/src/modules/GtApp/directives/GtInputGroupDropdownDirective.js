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
        .directive('gtInputGroupDropdown', GtInputGroupDropdownDirective);


function GtInputGroupDropdownDirective() {
    return {
        scope: {
            gtModel: '=',
            gtItems: '&',
            gtClass: '@'
        },
        templateUrl: 'modules/GtApp/templates/GtInputGroupDropdown.html',
        // replace is needed in order to not mess up bootstrap css hierarchical selectors
        replace: true,
        link: function (scope) {
            // update display when model changes
            scope.$watch('gtModel', function (newGtModel) {
                angular.forEach(scope.gtItems(), function (item) {
                    if (item.value === newGtModel) {
                        scope.gtDisplay = item.display;
                    }
                });
            });
            if (scope.gtClass) {
                scope.classes = 'input-group-btn ' + scope.gtClass;
            } else {
                scope.classes = 'input-group-btn';
            }
        }
    };
}
