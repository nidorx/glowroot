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
        .module('GtApp', [
//            'ngRoute',
            'ui.router',
            'ui.bootstrap',
//            'patternfly',
            'blockUI',
            'oc.lazyLoad',
            'ngMessages',
            'ngSanitize',
            // old
//            'ui.select'
        ])
        .config(AppConfig)
        .run(AppRun);


AppConfig.$inject = ['blockUIConfig', '$httpProvider', '$locationProvider'];

/**
 * App configuration
 *
 * @param {type} blockUIConfig
 * @param {type} $httpProvider
 * @param {type} $locationProvider
 * @returns {undefined}
 */
function AppConfig(blockUIConfig, $httpProvider, $locationProvider) {

    //$locationProvider.html5Mode(true);
    $locationProvider.html5Mode(false).hashPrefix('');

    /*========================================================================================
     * Requisições protegidas
     *----------------------------------------------------------------------------------------*/
    $httpProvider.interceptors.push('GlowrootHttpInterceptor');
    /*========================================================================================*/


    /*========================================================================================
     * BlockUI
     *----------------------------------------------------------------------------------------*/
    blockUIConfig.message = 'Carregando...';
    blockUIConfig.delay = 100;
    blockUIConfig.autoInjectBodyBlock = false;
    blockUIConfig.template = [
        '<div class="block-ui-overlay"></div>',
        '<div class="block-ui-message-container" aria-live="assertive" aria-atomic="true">',
        '    <div class="block-ui-message" ng-class="$_blockUiMessageClass">',
        '        <div class="spinner spinner-lg"></div>',
//        '        {{ state.message }}',
        '    </div>',
        '</div>'
    ].join('');
    /*========================================================================================*/
}



AppRun.$inject = [
    '$q', '$rootScope', '$state', '$document', '$http', '$location', '$timeout', 'login', 'queryStrings'
];


/**
 * App inicialization
 *
 * @param {type} $q
 * @param {type} $rootScope
 * @param {type} $state
 * @param {type} $document
 * @param {type} $http
 * @param {type} $location
 * @param {type} $timeout
 * @param {type} login
 * @param {type} queryStrings
 * @returns {undefined}
 */
function AppRun($q, $rootScope, $state, $document, $http, $location, $timeout, login, queryStrings) {

    // Add $state to all template
    $rootScope.$state = $state;

    /*========================================================================================
     * Eventos de rotas
     *----------------------------------------------------------------------------------------*/

    $rootScope.$on('$stateChangeSuccess', function () {
        // Ao mudar de state, rola para o topo da página
        // $document[0].body.scrollTop = $document[0].documentElement.scrollTop = 0;
    });

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {

        // Remove qualquer estilo global
        $rootScope.rootNgClass = {};

        // Limpa a lista de mensagens
        $rootScope.$emit('msgClear');

        // @todo: Verifica permissão de acesso à rota
    });
    /*========================================================================================*/



    /// OLD

    $rootScope.agentId = '';

    $rootScope.$on('$locationChangeSuccess', function () {
        $rootScope.agentId = $location.search()['agent-id'] || '';
        $rootScope.agentRollupId = $location.search()['agent-rollup-id'] || $rootScope.agentId;
        if ($rootScope.layout) {
            // layout doesn't exist on first page load when running under grunt serve
            if (!$rootScope.layout.central || $rootScope.agentRollupId) {
                var agentRollup = $rootScope.layout.agentRollups[$rootScope.agentRollupId];
                $rootScope.agentPermissions = agentRollup ? agentRollup.permissions : undefined;
            } else {
                $rootScope.agentPermissions = undefined;
            }
        }
    });

    $rootScope.agentQueryString = function () {
        if (!$rootScope.layout.central) {
            return '';
        }
        if ($rootScope.agentId) {
            return '?agent-id=' + encodeURIComponent($rootScope.agentId);
        } else if ($rootScope.agentRollupId) {
            return '?agent-rollup-id=' + encodeURIComponent($rootScope.agentRollupId);
        } else {
            return '';
        }
    };

    $rootScope.agentRollupUrl = function (agentRollup) {
        // preserve existing query string
        var search = angular.copy($location.search());
        delete search['agent-rollup-id'];
        delete search['agent-id'];
        var query = {};
        if (agentRollup.agent) {
            query['agent-id'] = agentRollup.id;
        } else {
            query['agent-rollup-id'] = agentRollup.id;
        }
        angular.merge(query, search);
        return $location.path().substring(1) + queryStrings.encodeObject(query);
    };

    $rootScope.transactionTypes = function () {
        if (!$rootScope.layout) {
            return [];
        }
        if (!$rootScope.layout.agentRollups) {
            return [];
        }
        var agentRollup = $rootScope.layout.agentRollups[$rootScope.agentRollupId];
        if (!agentRollup) {
            return [];
        }
        return agentRollup.transactionTypes;
    };

    $rootScope.defaultTransactionType = function () {
        if (!$rootScope.layout) {
            return '';
        }
        if (!$rootScope.layout.agentRollups) {
            // login page, not yet authenticated
            return '';
        }
        // can't use $rootScope.agentRollupId here because this function is called from waitForLayout() function in
        // routes.js before $rootScope.agentRollupId is set (note for testing, this is only a problem when not under grunt
        // serve)
        var agentRollupId = $location.search()['agent-rollup-id'] || $location.search()['agent-id'] || '';
        var agentRollup = $rootScope.layout.agentRollups[agentRollupId];
        if (!agentRollup) {
            return '';
        }
        return agentRollup.defaultDisplayedTransactionType;
    };

    $rootScope.goToLogin = function (event) {
        if (!event.ctrlKey) {
            login.goToLogin();
            // suppress normal hyperlink
            return false;
        }
    };

    $rootScope.signOut = function () {
        // need to collapse the navbar in mobile view
        var $navbarCollapse = $('.navbar-collapse');
        $navbarCollapse.removeClass('in');
        $navbarCollapse.addClass('collapse');
        $http.post('backend/sign-out')
                .then(function (response) {
                    $rootScope.setLayout(response.data);
                    if (!$rootScope.layout.redirectToLogin) {
                        $rootScope.displaySignOutMessage = true;
                        $timeout(function () {
                            $rootScope.displaySignOutMessage = false;
                        }, 2000);
                    }
                }, function (response) {
                    $rootScope.navbarErrorMessage = 'An error occurred signing out';
                    if (response.data.message) {
                        $rootScope.navbarErrorMessage += ': ' + response.data.message;
                    }
                    var unregisterListener = $rootScope.$on('$stateChangeSuccess', function () {
                        $rootScope.navbarErrorMessage = '';
                        unregisterListener();
                    });
                });
    };

    $rootScope.hideNavbar = function () {
        return $location.path() === '/login';
    };

    // with responsive design, container width doesn't change on every window resize event
    var $container = $('#container');
    var $window = $(window);
    $rootScope.containerWidth = $container.width();
    $rootScope.windowHeight = $window.height();
    $(window).resize(function () {
        var containerWidth = $container.width();
        var windowHeight = $window.height();
        if (containerWidth !== $rootScope.containerWidth || windowHeight !== $rootScope.windowHeight) {
            // one of the relevant dimensions has changed
            $rootScope.$apply(function () {
                $rootScope.containerWidth = containerWidth;
                $rootScope.windowHeight = windowHeight;
            });
        }
    });
    $rootScope.forceResize = function () {
        setTimeout(function () {
            var containerWidth = $container.width();
            var windowHeight = $window.height();
            // one of the relevant dimensions has changed
            $rootScope.$apply(function () {
                $rootScope.containerWidth = containerWidth;
                $rootScope.windowHeight = windowHeight;
            });
            $rootScope.$broadcast('forceResize');
        });
    };

    // check layout every 60 seconds, this will notice when session expires and sending user to /login
    function scheduleNextCheckLayout() {
        $timeout(function () {
            $http.get('backend/check-layout')
                    .then(function () {
                        // Glowroot-Layout-Version is returned and the http interceptor will notice and take appropriate action
                        scheduleNextCheckLayout();
                    }, function () {
                        // ok to ignore, e.g. temporary network disconnect
                        scheduleNextCheckLayout();
                    });
        }, 60000);
    }

    scheduleNextCheckLayout();

    $rootScope.initLayout = function () {
        // agentRollupValues is needed when using angular ng-repeat over agentRollups in case there are
        // any agent rollup ids that start with '$', because angular silently ignores object keys starting with '$'
        // see https://docs.angularjs.org/api/ng/directive/ngRepeat
        $rootScope.layout.agentRollupValues = [];
        angular.forEach($rootScope.layout.agentRollups, function (agentRollup, agentRollupId) {
            var indent = '';
            for (var i = 0; i < agentRollup.depth; i++) {
                indent += '\u00a0\u00a0\u00a0\u00a0';
            }
            agentRollup.indentedDisplay = indent + agentRollup.display;
            agentRollup.id = agentRollupId;
            $rootScope.layout.agentRollupValues.push(agentRollup);
        });
        if (!$rootScope.layout.central || $rootScope.agentRollupId) {
            var agentRollup = $rootScope.layout.agentRollups[$rootScope.agentRollupId];
            $rootScope.agentPermissions = agentRollup ? agentRollup.permissions : undefined;
        } else {
            $rootScope.agentPermissions = undefined;
        }
        var timeZoneIdMap = {};
        angular.forEach(moment.tz.names(), function (timeZoneId) {
            timeZoneIdMap[timeZoneId] = true;
        });
        var timeZoneIds = [];
        angular.forEach($rootScope.layout.timeZoneIds, function (timeZoneId) {
            if (timeZoneIdMap[timeZoneId]) {
                timeZoneIds.push(timeZoneId);
            }
        });
        $rootScope.layout.timeZoneIds = timeZoneIds;
    };

    $rootScope.setLayout = function (data) {
        $rootScope.layout = data;
        $rootScope.initLayout();
        if ($rootScope.layout.redirectToLogin) {
            login.goToLogin();
        } else if ($location.path() === '/login' && (data.loggedIn || !data.loginEnabled)) {
            // authentication is not needed
            $location.path('/').replace();
        }
    };

    if (window.layout) {
        $rootScope.setLayout(window.layout);
    } else {
        // running in dev under 'grunt serve'
        $http.get('backend/layout')
                .then(function (response) {
                    $rootScope.setLayout(response.data);
                }, function (response) {
                    $rootScope.navbarErrorMessage = 'An error occurred getting layout';
                    if (response.data.message) {
                        $rootScope.navbarErrorMessage += ': ' + response.data.message;
                    }
                    var unregisterListener = $rootScope.$on('$stateChangeSuccess', function () {
                        $rootScope.navbarErrorMessage = '';
                        unregisterListener();
                    });
                });
    }

    $rootScope.$on('$stateChangeSuccess', function () {
        // google analytics is enabled on https://demo.glowroot.org using the
        // system property glowroot.internal.googleAnalyticsTrackingId
        if (window.ga) {
            window.ga('send', 'pageview', {page: $location.path()});
        }
    });

    // tolerant of missing whole (.2) and missing decimal (2.)
    var percentileRegexp = '([1-9]?[0-9]?(\\.[0-9]*)?|100(\\.0*)?)';
    $rootScope.pattern = {
        percentile: new RegExp('^' + percentileRegexp + '$'),
        percentileList: new RegExp('^(' + percentileRegexp + ' *, *)*' + percentileRegexp + '$'),
        integer: /^(0|[1-9][0-9]*)$/,
        // tolerant of missing whole (.2) and missing decimal (2.)
        double: /^(0|[1-9][0-9]*)?(\.[0-9]*)?$/
    };

//    ZeroClipboard.config({
//        bubbleEvents: false,
//        // cache busting is not required since ZeroClipboard.swf is revved during grunt build
//        cacheBust: false
//    });
    // this is a workaround for "IE freezes when clicking a ZeroClipboard clipped element within a Bootstrap Modal"
    // see https://github.com/zeroclipboard/zeroclipboard/blob/master/docs/instructions.md#workaround-a
    $(document).on('focusin', '#global-zeroclipboard-html-bridge', false);
}
