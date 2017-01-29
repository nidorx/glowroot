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
        .filter('gtBytes', gtBytesFilter);


function gtBytesFilter() {
    return function formatBytes(bytes) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
            return '-';
        }
        if (bytes === 0) {
            // no unit needed
            return '0';
        }
        var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var number = Math.floor(Math.log(bytes) / Math.log(1024));
        var num = bytes / Math.pow(1024, Math.floor(number));
        if (number === 0) {
            return num.toFixed(0) + ' bytes';
        } else {
            return num.toFixed(1) + ' ' + units[number];
        }
    };
}
