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
            'GtCommon',
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


AppConfig.$inject = ['blockUIConfig', '$httpProvider', '$locationProvider', '$urlMatcherFactoryProvider'];

/**
 * App configuration
 *
 * @param {type} blockUIConfig
 * @param {type} $httpProvider
 * @param {type} $locationProvider
 * @returns {undefined}
 */
function AppConfig(blockUIConfig, $httpProvider, $locationProvider, $urlMatcherFactoryProvider) {

    // Non-URI-Encoded URL Type
    function valToString(val) {
        return val !== null ? val.toString() : val;
    }

    $urlMatcherFactoryProvider.type('nonURIEncoded', {
        encode: valToString,
        decode: valToString,
        is: function () {
            return true;
        }
    });

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
    '$rootScope', '$state', '$http', '$location', '$timeout', 'login',
    'queryStrings', 'model'
];


/**
 * App inicialization
 *
 */
function AppRun($rootScope, $state, $http, $location, $timeout, login, queryStrings, model) {

    // Common vars
    $rootScope.$state = $state;
    $rootScope.model = model;
    $rootScope.range = model.range;

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
        $rootScope.stateParams = $rootScope.buildStateParams();
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

    $rootScope.buildQueryObject = function (baseQuery) {
        var query = angular.copy(baseQuery || $location.search());
        if ($rootScope.layout && $rootScope.layout.central) {
            var agentRollup = $rootScope.layout.agentRollups[$rootScope.agentRollupId];
            if (agentRollup) {
                if (agentRollup.agent) {
                    query['agent-id'] = $rootScope.agentRollupId;
                } else {
                    query['agent-rollup-id'] = $rootScope.agentRollupId;
                }
            }
        }
        query['transaction-type'] = $rootScope.model.transactionType;
        query['transaction-name'] = $rootScope.model.transactionName;
        if (!$rootScope.range.last) {
            query.from = Math.floor($rootScope.range.chartFrom / 60000) * 60000;
            query.to = Math.ceil($rootScope.range.chartTo / 60000) * 60000;
            delete query.last;
        }
//        else if ($rootScope.range.last !== 4 * 60 * 60 * 1000) {
//            query.last = $rootScope.range.last;
//            delete query.from;
//            delete query.to;
//        }
        if ($rootScope.summarySortOrder !== $rootScope.defaultSummarySortOrder) {
            query['summary-sort-order'] = $rootScope.summarySortOrder;
        } else {
            delete query['summary-sort-order'];
        }
        return query;
    };

    /**
     * Generate object used in $state.go and ui-sref
     *
     * @param {type} baseParams
     * @returns {unresolved}
     */
    $rootScope.buildStateParams = function (baseParams) {
        // Input camelCase
        var params = angular.merge({}, (function (searchParams) {
            var out = {};
            for (var a in searchParams) {
                if (searchParams.hasOwnProperty(a)) {
                    out[a.replace(/-(.)/g, function ($0, $1) {
                        return $1.toUpperCase();
                    })] = searchParams[a];
                }
            }
            return out;
        })($location.search()), baseParams);

        if ($rootScope.layout && $rootScope.layout.central) {
            var agentRollup = $rootScope.layout.agentRollups[$rootScope.agentRollupId];
            if (agentRollup) {
                if (agentRollup.agent) {
                    params.agentId = $rootScope.agentRollupId;
                } else {
                    params.agentRollupId = $rootScope.agentRollupId;
                }
            }
        }
        if (!$rootScope.range.last) {
            params.from = Math.floor($rootScope.range.chartFrom / 60000) * 60000;
            params.to = Math.ceil($rootScope.range.chartTo / 60000) * 60000;
            delete params.last;
        } else if ($rootScope.range.last !== 4 * 60 * 60 * 1000) {
            params.last = $rootScope.range.last;
            delete params.from;
            delete params.to;
        }
        if ($rootScope.summarySortOrder !== $rootScope.defaultSummarySortOrder) {
            params.summarySortOrder = $rootScope.summarySortOrder;
        } else {
            delete params.summarySortOrder;
        }

        // Output as name-param:value
        var out = (function (params) {
            var out = {};
            for (var a in params) {
                if (params.hasOwnProperty(a)) {
                    out[a.replace(/([A-Z])/g, function ($0, $1) {
                        return '-' + $1.toLowerCase();
                    })] = params[a];
                }
            }
            return out;
        })(params);

        return out;
    };

    $rootScope.buildUiSref = function (baseQuery) {
        var out = $state.current.name + '(' + JSON.stringify($rootScope.buildStateParams(baseQuery)) + ')';
        console.log('out', out);
        return out;
    };


    // with responsive design, container width doesn't change on every window resize event
    $(window).resize((function (fn, delay) {
        var timeout = null;

        return function () {
            window.clearTimeout(timeout);
            var that = this;
            var args = Array.prototype.slice.call(arguments);

            timeout = window.setTimeout(function () {
                fn.apply(that, args);
            }, delay);
        };
    })(function () {
        $rootScope.$broadcast('resize');
    }, 50));

    $rootScope.forceResize = function () {
        $rootScope.$broadcast('resize');
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
        $http.get('backend/layout').then(function (response) {
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
}
