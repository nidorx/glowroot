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
        .module('GtTrace')
        .filter('exceptionHtml', ExceptionHtmlFilter);


ExceptionHtmlFilter.$inject = ['$sce'];

function ExceptionHtmlFilter($sce) {
    return function (throwable) {
        if (!throwable) {
            return '';
        }

        // don't pre-wrap stack traces (using overflow-x: auto on container)
        var html = '<div style="white-space: pre;">';
        html += '<div style="font-weight: bold; white-space: pre-wrap;">';
        while (throwable) {
            var message = throwable.message;
            if (message) {
                message = ': ' + message.replace(/\n/g, '\n    ');
            }
            html += escapeHtml(throwable.className + message) + '\n</div>';
            var i;
            for (i = 0; i < throwable.stackTraceElements.length; i++) {
                html += 'at ' + escapeHtml(throwable.stackTraceElements[i]) + '\n';
            }
            if (throwable.framesInCommonWithEnclosing) {
                html += '... ' + throwable.framesInCommonWithEnclosing + ' more\n';
            }
            throwable = throwable.cause;
            if (throwable) {
                html += '\n<div style="font-weight: bold; white-space: pre-wrap;">Caused by: ';
            }
        }
        html += '</div>';
        return $sce.trustAsHtml(html);
    };
}
