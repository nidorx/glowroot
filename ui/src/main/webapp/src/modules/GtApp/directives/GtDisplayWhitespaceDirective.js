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
        .directive('gtDisplayWhitespace', GtDisplayWhitespaceDirective);


function GtDisplayWhitespaceDirective() {
    return {
        scope: {
            gtBind: '&'
        },
        link: function (scope, iElement) {
            var text = scope.gtBind();
            iElement.text(text);
            var html = iElement.html();
            html = html.replace('\n', '<em>\\n</em>')
                    .replace('\r', '<em>\\r</em>')
                    .replace('\t', '<em>\\t</em>');
            html = html.replace('</em><em>', '');
            iElement.html(html);
        }
    };
}
