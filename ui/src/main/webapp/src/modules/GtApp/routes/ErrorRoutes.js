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
        .config(ErrorRoutes);


ErrorRoutes.$inject = ['$provide', '$stateProvider', '$urlRouterProvider'];

function ErrorRoutes($provide, $stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('page.error.detail', {
                abstract: true,
                views: {
                    sidebar: {
                        templateUrl: urlTemplate('Sidebar', 'GtTransaction')
                    },
                    tabs: {
                        templateUrl: urlTemplate('TabsError', 'GtTransaction')
                    },
                    main: {
                        template: '<ui-view></ui-view>'
                    }
                }
            })
            .state('page.error.detail.messages', {
                url: '/messages',
                templateUrl: urlTemplate('TabErrorMessages', 'GtTransaction')
            })
            .state('page.error.detail.traces', {
                url: '/traces',
                templateUrl: urlTemplate('TabTraces', 'GtTransaction'),
                resolve: {
                    mdlTrace: resolveModule('GtTrace'),
                }
            });

}
