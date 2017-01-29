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
        .directive('gtFormGroup', GtFormGroupDirective);


GtFormGroupDirective.$inject = ['conversions'];

function GtFormGroupDirective(conversions) {
    return {
        scope: {
            gtType: '@',
            gtLabel: '@',
            gtCheckboxLabel: '@',
            gtModel: '=',
            gtWidth: '@',
            gtAddon: '@',
            // gtPattern accepts string binding for inline patterns and RegExp binding for scope expressions
            // (same as ngPattern on angular input directive)
            gtPattern: '@',
            gtRequired: '&',
            gtDisabled: '&',
            gtPlaceholder: '@',
            gtNumber: '&',
            gtRows: '@',
            gtColClass1: '@',
            gtColClass2: '@'
        },
        transclude: true,
        require: '^form',
        templateUrl: 'modules/GtApp/templates/GtFormGroup.html',
        link: function (scope, iElement, iAttrs, formCtrl) {
            scope.formCtrl = formCtrl;
            // just need a unique id
            scope.gtId = scope.$id;
            if (!scope.gtType) {
                // default
                scope.gtType = 'text';
            }
            scope.$watch('gtModel', function (newValue) {
                // conditional prevents the '.' from being automatically deleted when user deletes the '3' in '2.3'
                if (conversions.toNumber(scope.ngModel) !== newValue) {
                    scope.ngModel = newValue;
                }
            });
            scope.$watch('ngModel', function (newValue) {
                if (scope.gtNumber()) {
                    scope.gtModel = conversions.toNumber(newValue);
                } else {
                    scope.gtModel = newValue;
                }
            });
            scope.$watch('gtPattern', function (newValue) {
                if (newValue) {
                    var match = newValue.match(/^\/(.*)\/$/);
                    if (match) {
                        scope.ngPattern = new RegExp(match[1]);
                    } else {
                        scope.ngPattern = scope.$parent.$eval(newValue);
                    }
                } else {
                    // ngPattern doesn't understand falsy values (maybe it should?)
                    // so just pass a pattern that will match everything
                    scope.ngPattern = /.?/;
                }
            });
        }
    };
}