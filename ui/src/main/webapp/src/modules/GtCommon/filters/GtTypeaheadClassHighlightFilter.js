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
        .filter('gtTypeaheadClassHighlight', gtTypeaheadClassHighlightFilter);


gtTypeaheadClassHighlightFilter.$inject = ['$sce'];

function gtTypeaheadClassHighlightFilter($sce) {
    function escapeRegexp(queryToEscape) {
        return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }
    return function (matchItem, query) {
        if (!query) {
            return matchItem;
        }
        matchItem = matchItem.replace(new RegExp('^' + escapeRegexp(query), 'gi'), '<strong>$&</strong>');
        matchItem = matchItem.replace(new RegExp('\\.(' + escapeRegexp(query) + ')', 'gi'), '.<strong>$1</strong>');
        matchItem = matchItem.replace(new RegExp('\\$(' + escapeRegexp(query) + ')', 'gi'), '$<strong>$1</strong>');
        return $sce.trustAsHtml(matchItem);
    };
}
