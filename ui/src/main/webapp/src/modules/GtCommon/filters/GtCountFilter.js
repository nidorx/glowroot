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
        .filter('gtCount', gtCountFilter);


function gtCountFilter() {
    return function (count) {
        if (count === undefined) {
            return '';
        }
        if (Math.abs(count) < 0.1) {
            return count.toPrecision(1);
        }


        return (Math.round(count * 10) / 10).toLocaleString(undefined, {
            minimumFractionDigits: 1
        });
    };
}
