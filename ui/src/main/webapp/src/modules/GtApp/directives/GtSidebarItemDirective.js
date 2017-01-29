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
        .directive('gtSidebarItem', GtSidebarItemDirective);


GtSidebarItemDirective.$inject = ['$location'];

function GtSidebarItemDirective($location) {
    return {
        scope: {
            gtDisplay: '@',
            gtDisplayRight: '@',
            gtUrl: '@',
            gtActive: '&',
            gtSubActive: '&'
        },
        // replace is needed in order to not mess up bootstrap css hierarchical selectors
        replace: true,
        templateUrl: 'modules/GtApp/templates/GtSidebarItem.html',
        link: function (scope, iElement, iAttrs) {
            scope.isActive = function () {
                return iAttrs.gtActive ? scope.gtActive() : $location.path() === '/' + scope.gtUrl;
            };
            // isSubActive sidebar items are marked active, but when clicked will return to their parent
            scope.isSubActive = function () {
                return iAttrs.gtSubActive && scope.gtSubActive();
            };
        }
    };
}