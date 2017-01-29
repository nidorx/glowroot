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
/* global SqlPrettyPrinter */

'use strict';

angular
        .module('GtTrace')
        .directive('entryMessage', EntryMessageDirective);


EntryMessageDirective.$inject = ['$http'];

function EntryMessageDirective($http) {

    return {
        scope: {
            entry: '=',
            agentRollupId: '='
        },
        templateUrl: 'modules/GtTrace/templates/EntryMessage.html',
        replace: true,
        link: function ($scope) {

            $scope.$watch('entry', function () {
                if (!$scope.entry) {
                    return;
                }
                var queryMessage = $scope.entry.queryMessage;
                if (queryMessage) {
                    if (queryMessage.sharedQueryText.fullText) {
                        $scope.message = formatSql(queryMessage.sharedQueryText.fullText, queryMessage.suffix);
                    } else if (queryMessage.sharedQueryText.fullTextSha1) {

                        $http.get('backend/transaction/full-query-text', {
                            params: {
                                'agent-rollup-id': $scope.gentRollupId || '',
                                'full-text-sha1': queryMessage.sharedQueryText.fullTextSha1
                            }
                        }).then(function (response) {
                            var data = response.data;
                            if (data.expired) {
                                $scope.message = {
                                    text: 'The full query text has expired'
                                };
                            } else {
                                if (queryMessage.prefix === 'jdbc execution: ') {
                                    $scope.message = formatSql(data.fullText, queryMessage.suffix.trim());
                                } else {
                                    $scope.message = {
                                        text: queryMessage.prefix + data.fullText + queryMessage.suffix
                                    };
                                }

                                // so other trace entries with same shared query text don't need to go to server
                                queryMessage.sharedQueryText.fullText = data.fullText;
                            }
                        }, function (response) {
                            if (response.status === 401) {
                                //goToLogin(response.responseJSON.timedOut);
                            } else {
                                // An error occurred retrieving the full query text
                            }
                        });
                    } else {
                        // @TODO: Check for this
                    }
                } else if ($scope.entry.error) {
                    $scope.message = {
                        text: $scope.entry.error.message
                    };
                } else {
                    $scope.message = {
                        text: $scope.entry.message
                    };
                }
            });
        }
    };

    function formatSql(queryText, suffix) {
        var comment;
        var parameters;
        var rows;
        var sql;
        if (queryText.lastIndexOf('/*', 0) === 0) {
            var endOfCommentIndex = queryText.indexOf('*/') + 2;
            comment = queryText.substring(0, endOfCommentIndex) + '\n';
            sql = queryText.substring(endOfCommentIndex).trim();
        } else {
            comment = '';
            sql = queryText;
        }
        var formatted = window.sqlFormatter.format(sql);
        if (comment.length) {
            var spaces = '';
            for (var i = 0; i < formatted.length; i++) {
                if (formatted[i] === ' ') {
                    spaces += ' ';
                } else {
                    break;
                }
            }
            formatted = spaces + comment + formatted;
        }
        var parts = suffix.match(/(.*)?\s*=> ([0-9]+) rows?$/);
        if (parts) {
            parameters = parts[1] ? parts[1].replace(/(^\s*)|(\s*$)/g, '') : '';
            rows = parts[2];
        }

        return {
            text: [
                '<strong>JDBC execution:</strong>',
                '    ' + (formatted.replace(/(^\s*)|(\s*$)/g, '').replace(/\n/g, '\n    ')),
                ((parameters && parameters !== '') ? '<strong>parameters:</strong>\n    ' + parameters : ''),
                (rows ? '<strong>rows:</strong> ' + rows : '')
            ].join('\n')
        };
    }

}
