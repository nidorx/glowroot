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
        .filter('gtDuration', gtDurationFilter);


function gtDurationFilter() {
    return function (input) {
        if (input === undefined) {
            return '';
        }
        var duration = moment.duration(input);
        var parts = [];
        if (duration.days() >= 1) {
            parts.push(Math.floor(duration.days()) + 'd');
        }
        if (duration.hours() >= 1) {
            parts.push(Math.floor(duration.hours()) + 'h');
        }
        if (duration.minutes() >= 1) {
            parts.push(Math.floor(duration.minutes()) + 'm');
        }
        if (duration.seconds() >= 1) {
            parts.push(Math.floor(duration.seconds()) + 's');
        }
        return parts.join(' ');
    };
}
