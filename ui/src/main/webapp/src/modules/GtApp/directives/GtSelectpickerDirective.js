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
        .directive('gtSelectpicker', GtSelectpickerDirective);


GtSelectpickerDirective.$inject = ['$timeout'];

function GtSelectpickerDirective($timeout) {
    return {
        scope: {
            ngModel: '=',
            gtSelectpickerOptions: '&',
            gtTitle: '&'
        },
        link: function (scope, iElement) {
            // need to set title before initializing selectpicker in order to avoid flicker of 'None selected' text
            // when going back and forth between two different transaction types
            iElement.attr('title', scope.gtTitle);
            // set style outside of $timeout to avoid style flicker on loading
            iElement.selectpicker(scope.gtSelectpickerOptions());
            scope.$watch('ngModel', function () {
                iElement.selectpicker('val', scope.ngModel);
            });
            $timeout(function () {
                // refresh only works inside of $timeout
                iElement.selectpicker('refresh');
            });
            scope.$on('$destroy', function () {
                iElement.selectpicker('destroy');
            });
        }
    };
}
