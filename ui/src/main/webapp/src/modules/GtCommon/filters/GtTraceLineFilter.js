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
        CLASS: 'style="color:#FF4444;font-weight: bold;"',
        METHOD: 'style="color:#000;font-weight: bold;"',
        LINE: 'style="color:#4463B5;font-weight: bold;"'
    };
    return function (input) {
        if (!input) {
            return '';
        }
        
        if(input.indexOf('Native Method') >= 0){
            return $sce.trustAsHtml(input.replace(/\.([a-z$_][a-z0-9$_]*)\.([a-z$_][a-z0-9$_]*)\(Native Method\)\s*$/i, function ($0, $1, $2) {
                return [
                    '.<span '+STYLE.CLASS+'>' + $1 + '</span>',
                    '.<span '+STYLE.METHOD+'>' + $2 + '</span>',
                    '(Native Method)'
                ].join('');
            }));            
        }
        return $sce.trustAsHtml(input.replace(/\.([a-z$_][a-z0-9$_]*)\.([a-z$_][a-z0-9$_]*)\(([a-z$_][a-z0-9$_]*).java\:(\d+)\)\s*$/i, function ($0, $1, $2, $3, $4) {
            return [
                '.<span '+STYLE.CLASS+'>' + $1 + '</span>',
                '.<span '+STYLE.METHOD+'>' + $2 + '</span>',
                '(<span '+STYLE.CLASS+'>' + $3 + '</span>.java',
                ':<span '+STYLE.LINE+'>' + $4 + '</span>)'
            ].join('');
        }));
    };
}



