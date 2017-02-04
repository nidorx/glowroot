/*
 * Copyright 2015-2017 the original author or authors.
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

/* global angular, moment, $ */


angular
        .module('GtApp')
        .service('gtToolbar', GtToolbarFactory);

function GtToolbarFactory() {

    var toolbar;
    function getToolbarElement(callback) {
        if (!toolbar || toolbar.length < 1) {
            toolbar = angular.element('#toolbar-content');
            if (toolbar.length < 1) {
                return setTimeout(getToolbarElement.bind(null, callback), 10);
            }
        }
        callback(toolbar);
    }

    return {
        append: function ($iScope, $iElement) {
            getToolbarElement(function ($toolbar) {
                $toolbar.append($iElement);
                $iScope.$on('$destroy', function () {
                    $iElement.remove();
                });
            });
        }
    };
}
