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
        .config(ConfigurationRoutes);


ConfigurationRoutes.$inject = ['$provide', '$stateProvider', '$urlRouterProvider'];


function ConfigurationRoutes($provide, $stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('page.config.transaction', {
                url: '/transaction?agent-id',
                templateUrl: 'views/config/transaction.html',
                controller: 'ConfigCommonCtrl',
                resolve: {
                    backendUrl: function () {
                        return 'backend/config/transaction';
                    }
                }
            })
            .state('page.config.gaugeList', {
                url: '/gauge-list?agent-id',
                templateUrl: 'views/config/gauge-list.html',
                controller: 'ConfigGaugeListCtrl'
            })
            .state('page.config.gauge', {
                url: '/gauge?agent-id&v',
                templateUrl: 'views/config/gauge.html',
                controller: 'ConfigGaugeCtrl'
            })
            .state('page.config.alertList', {
                url: '/alert-list?agent-id',
                templateUrl: 'views/config/alert-list.html',
                controller: 'ConfigAlertListCtrl'
            })
            .state('page.config.alert', {
                url: '/alert?agent-id&v',
                templateUrl: 'views/config/alert.html',
                controller: 'ConfigAlertCtrl'
            })
            .state('page.config.ui', {
                url: '/ui',
                templateUrl: 'views/config/ui.html',
                controller: 'ConfigUiCtrl'
            })
            .state('page.config.pluginList', {
                url: '/plugin-list?agent-id',
                templateUrl: 'views/config/plugin-list.html',
                controller: 'ConfigPluginListCtrl'
            })
            .state('page.config.plugin', {
                url: '/plugin?agent-id&plugin-id',
                templateUrl: 'views/config/plugin.html',
                controller: 'ConfigPluginCtrl'
            })
            .state('page.config.instrumentationList', {
                url: '/instrumentation-list?agent-id',
                templateUrl: 'views/config/instrumentation-list.html',
                controller: 'ConfigInstrumentationListCtrl'
            })
            .state('page.config.instrumentation', {
                url: '/instrumentation?agent-id&v',
                templateUrl: 'views/config/instrumentation.html',
                controller: 'ConfigInstrumentationCtrl'
            })
            .state('page.config.userRecording', {
                url: '/user-recording',
                templateUrl: 'views/config/user-recording.html',
                controller: 'ConfigUserRecordingCtrl'
            })
            .state('page.config.advanced', {
                url: '/advanced?agent-id',
                templateUrl: 'views/config/advanced.html',
                controller: 'ConfigCommonCtrl',
                resolve: {
                    backendUrl: function () {
                        return 'backend/config/advanced';
                    }
                }
            });

    $stateProvider.state('page.profile', {
        url: '/profile',
        templateUrl: 'views/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
            waitForLayout: WaitForLayoutResolver(false)
        }
    });
    $stateProvider.state('page.profile.changePassword', {
        url: '/change-password',
        templateUrl: 'views/profile/change-password.html',
        controller: 'ProfileChangePasswordCtrl'
    });
    $stateProvider.state('page.login', {
        url: '/login',
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        resolve: {
            waitForLayout: WaitForLayoutResolver(false)
        }
    });

}
