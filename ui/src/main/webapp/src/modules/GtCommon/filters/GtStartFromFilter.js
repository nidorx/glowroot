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
        .module('GtCommon')
        .filter('gtStartFrom', GtStartFromFilter);

/**
 * ng-repeat pagination
 *
 * @link https://gist.github.com/kmaida/06d01f6b878777e2ea34
 * @returns {Function}
 */
function GtStartFromFilter() {
    return function (input, pagination) {
        if (input) {
            var start = ((pagination.current - 1) * pagination.limit);
            return input.slice(start);
        }
        return [];
    };
}
