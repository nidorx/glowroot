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
        .filter('gtTraceLine', GtTraceLineFilter);


GtTraceLineFilter.$inject = ['$sce'];

/**
 * Add colors to java trace lines
 *
 * @param {type} $sce
 * @returns {Function}
 */
function GtTraceLineFilter($sce) {
    var STYLE = {
        CLASS: 'style="color:#2222ff;font-weight: bold;"',
        METHOD: 'style="color:#000;font-weight: bold;"',
        LINE_NUMBER: 'style="color:#2222ff;font-weight: bold;"',
        TEXT: 'style="color:olive;min-height: 20px;"'
    };

    var REG_NATIVE_METHOD = /\.([a-z$_][a-z0-9$_]*)\.([a-z$_][a-z0-9$_]*)\(Native Method\)\s*$/i;
    var REG_JAVA_CLASS = /\.([a-z$_][a-z0-9$_]*)\.([a-z$_][a-z0-9$_]*)\(([a-z$_][a-z0-9$_]*).java\:(\d+)\)\s*$/i;
    var REG_R_TRIM = /(\s*$)/g;
    var TAB = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

    return function (input) {
        if (!input) {
            return '';
        }

        if (angular.isString(input)) {
            input = input.split('\n');
        }

        if (!angular.isArray(input)) {
            throw 'Invalid stacktrace';
        }

        var lines = input.map(function (line) {
            line = line.replace(REG_R_TRIM, '').replace(/\t/g, TAB).replace(/\s/g, '&nbsp;');
            var out = '<div ' + STYLE.TEXT + '>';
            if (line.indexOf('Native Method') >= 0) {
                out += line.replace(REG_NATIVE_METHOD, function ($0, $1, $2) {
                    return [
                        '.<span>' + $1 + '</span>',
                        '.<span ' + STYLE.METHOD + '>' + $2 + '</span>',
                        '(Native Method)'
                    ].join('');
                });
            } else {
                out += line.replace(REG_JAVA_CLASS, function ($0, $1, $2, $3, $4) {
                    return [
                        '.' + $1 + '',
                        '.<span ' + STYLE.METHOD + '>' + $2 + '</span>',
                        '(<span ' + STYLE.CLASS + '>' + $3 + '</span>.java',
                        ':<span ' + STYLE.LINE_NUMBER + '>' + $4 + '</span>)'
                    ].join('');
                });
            }
            out += '</div>';
            return out;
        });


        return $sce.trustAsHtml('<pre class="entry-message"><code style="white-space: nowrap;">' + lines.join('') + '</code></pre>');
    };
}



