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
        .module('GtCommon')
        .factory('formatMillis', FormatMillisFactory);



function FormatMillisFactory() {
    return function (millis) {
        if (Math.abs(millis) < 0.0000005) {
            // less than 0.5 nanoseconds
            return '0.0';
        }
        if (Math.abs(millis) < 0.000001) {
            // between 0.5 and 1 nanosecond (round up)
            return '0.000001';
        }
        if (Math.abs(millis) < 0.00001) {
            // less than 10 nanoseconds
            return millis.toPrecision(1);
        }
        if (Math.abs(millis) < 1) {
            return millis.toPrecision(2);
        }
        return (Math.round(millis * 10) / 10).toLocaleString(undefined, {
            minimumFractionDigits: 1
        });
    };
}

