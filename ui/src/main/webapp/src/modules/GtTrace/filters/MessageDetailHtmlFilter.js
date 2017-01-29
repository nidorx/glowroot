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
        .filter('messageDetailHtml', ExceptionHtmlFilter);


ExceptionHtmlFilter.$inject = ['$sce'];

function ExceptionHtmlFilter($sce) {
    function messageDetailHtml(detail) {
        function dt(propName) {
            return '<dt>' + propName + ':</dt>';
        }
        
        function dd(value) {
            return '<dd>' + value + '</dd>';
        }

        var html = '<dl class="dl-horizontal">';
        angular.forEach(detail, function (value, key) {
            if (angular.isArray(value)) {
                // array values are supported to simulate multimaps, e.g. for http request parameters and http headers, both
                // of which can have multiple values for the same key
                angular.forEach(value, function (i, propv) {
                    var subdetail = {};
                    subdetail[key] = propv;
                    html += messageDetailHtml(subdetail);
                });
            } else if (typeof value === 'object' && value !== null) {
                html += dt(key);
                html += dd(messageDetailHtml(value));
            } else {
                html += dt(key);
                html += dd(value);
            }
        });
        html += '</dl>';
        return $sce.trustAsHtml(html);
    }
    
    return messageDetailHtml;
}
