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
        .module('GtApp')
        .config(TransactionsRoutes);


TransactionsRoutes.$inject = ['$provide', '$stateProvider', '$urlRouterProvider'];

function TransactionsRoutes($provide, $stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('page.transaction.detail', {
                abstract: true,
                views: {
                    sidebar: {
                        templateUrl: urlTemplate('Sidebar', 'GtTransaction')
                    },
                    tabs: {
                        templateUrl: urlTemplate('Tabs', 'GtTransaction')
                    },
                    main: {
                        template: '<ui-view></ui-view>'
                    }
                }
            })
            .state('page.transaction.detail.time', {
                abstract: true,
                template: '<ui-view></ui-view>'
            })
            .state('page.transaction.detail.time.average', {
                url: '/average',
                templateUrl: urlTemplate('TabTimeAverage', 'GtTransaction')
            })
            .state('page.transaction.detail.time.percentiles', {
                url: '/percentiles',
                templateUrl: urlTemplate('TabTimePercentiles', 'GtTransaction')
            })
            .state('page.transaction.detail.time.throughput', {
                url: '/throughput',
                templateUrl: urlTemplate('TabTimeThroughput', 'GtTransaction')
            })
            .state('page.transaction.detail.traces', {
                url: '/traces',
                templateUrl: urlTemplate('TabTraces', 'GtTransaction'),
                resolve: {
                    mdlTrace: resolveModule('GtTrace'),
                }
            })
            .state('page.transaction.detail.queries', {
                url: '/queries',
                templateUrl: urlTemplate('TabQueries', 'GtTransaction')
            })
            .state('page.transaction.detail.services', {
                url: '/services',
                templateUrl: urlTemplate('TabServices', 'GtTransaction')
            })
            .state('page.transaction.detail.threadProfile', {
                url: '/thread-profile',
                templateUrl: urlTemplate('TabProfile', 'GtTransaction')
            })
//            .state('page.transaction-thread-flame-graph', {
//                url: '/transaction/thread-flame-graph',
//                templateUrl: 'views/transaction/flame-graph.html',
//                controller: 'TransactionFlameGraphCtrl',
//                resolve: {
//                    waitForD3: ['$q', '$timeout',
//                        function waitForD3($q, $timeout) {
//                            var deferred = $q.defer();
//
//                            function checkForD3() {
//                                if (window.d3) {
//                                    deferred.resolve();
//                                } else {
//                                    $timeout(checkForD3, 100);
//                                }
//                            }
//
//                            $timeout(checkForD3, 100);
//                            return deferred.promise;
//                        }
//                    ],
//                    waitForLayout: WaitForLayoutResolver(true)
//                }
//            })
            ;

}
