'use strict';

angular
        .module('GtApp')
        .config(AppConfig);


AppConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

/**
 * Configurações das rotas da aplicação
 *
 * @param {type} $stateProvider
 * @param {type} $urlRouterProvider
 * @returns {undefined}
 */
function AppConfig($stateProvider, $urlRouterProvider) {

    /*========================================================================================
     * Rotas
     * ACCESS_LEVEL: Ver assets\admin\modules\base\RBAC.js
     *----------------------------------------------------------------------------------------*/

    // Tela de relatórios é a inicial
    //$urlRouterProvider.otherwise('/transactions');

    $urlRouterProvider.otherwise(function ($injector) {
        var $rootScope = $injector.get('$rootScope');
        // TODO revisit this, especially for server
        if (!$rootScope.layout) {
            // don't seem able to return promise for 'otherwise', oh well, this is only for grunt serve anyways
            return 'transaction/average';
        }
        if ($rootScope.layout.showNavbarTransaction) {
            return 'transaction/average';
        } else if ($rootScope.layout.showNavbarError) {
            return 'error/messages';
        } else if ($rootScope.layout.showNavbarJvm) {
            if (!$rootScope.layout.central) {
                var jvmPermissions = $rootScope.layout.agentRollups[''].permissions.jvm;
                if (jvmPermissions.gauges) {
                    return 'jvm/gauges';
                } else if (jvmPermissions.threadDump) {
                    return 'jvm/thread-dump';
                } else if (jvmPermissions.heapDump) {
                    return 'jvm/heap-dump';
                } else if (jvmPermissions.heapHistogram) {
                    return 'jvm/heap-histogram';
                } else if (jvmPermissions.mbeanTree) {
                    return 'jvm/mbean-tree';
                } else if (jvmPermissions.systemProperties) {
                    return 'jvm/system-properties';
                } else {
                    // only remaining option when showNavbarJvm is true
                    return 'jvm/environment';
                }
            } else {
                // TODO this will not work if user has access to other JVM pages, but not gauges
                // (deal with this when revisiting entire 'otherwise', see comment above)
                return 'jvm/gauges';
            }
        } else if ($rootScope.layout.showNavbarConfig) {
            return 'config/transaction';
        } else if ($rootScope.layout.adminView) {
            return 'admin/agent-list';
        } else if ($rootScope.layout.loggedIn && !$rootScope.layout.ldap) {
            return 'profile/change-password';
        } else {
            // give up
            return 'transaction/average';
        }
    });


    $stateProvider
            /*----------------------------------------------------------------------------------------*/
            // Rotas de acesso privado
            /*----------------------------------------------------------------------------------------*/
            .state('page', {
                abstract: true,
                templateUrl: urlTemplate('Page', 'GtApp'),
                resolve: {
                    components: resolveModule('GtCommon')
                }
            })
            .state('page.transaction', {
                abstract: true,
                url: '/transaction?agent-id&agent-rollup-id&transaction-type&transaction-name&last&from&to',
                templateUrl: urlTemplate('Transaction', 'GtTransaction'),
                resolve: {
                    mdl: resolveModule('GtTransaction'),
                    waitForLayout: WaitForLayoutResolver(true)
                }
            })
            .state('page.error', {
                abstract: true,
                url: '/error?agent-id&agent-rollup-id&transaction-type&transaction-name&last&from&to',
                templateUrl: urlTemplate('GtTransaction', 'GtTransaction'),
                resolve: {
                    mdl: resolveModule('GtTransaction'),
                    waitForLayout: WaitForLayoutResolver(true)
                }
            })
            .state('page.jvm', {
                url: '/jvm',
                templateUrl: urlTemplate('jvm', 'Jvm'),
                resolve: {
                    waitForLayout: WaitForLayoutResolver(false)
                }
            })
            .state('page.report', {
                url: '/report',
                templateUrl: urlTemplate('report', 'Report'),
                resolve: {
                    waitForLayout: WaitForLayoutResolver(false)
                }
            })
            .state('page.config', {
                url: '/config',
                templateUrl: urlTemplate('config', 'Config'),
                controller: 'ConfigCtrl',
                resolve: {
                    waitForLayout: WaitForLayoutResolver(false)
                }
            })
            .state('page.admin', {
                url: '/admin',
                templateUrl: urlTemplate('admin', 'Admin'),
                resolve: {
                    waitForLayout: WaitForLayoutResolver(false)
                }
            })
            ;
}


var WaitForLayoutResolver = function (needsTransactionType) {
    return [
        '$q', '$rootScope', '$location',
        function ($q, $rootScope, $location) {
            if (window.layout) {
                if ($location.path() === '/login') {
                    // no need to add transaction-type to url
                    return;
                }
                var hasAgent = !$rootScope.layout.central || $location.search()['agent-id'] || $location.search()['agent-rollup-id'];
                if (hasAgent && needsTransactionType && !$location.search()['transaction-type']) {
                    $location.search('transaction-type', $rootScope.defaultTransactionType());
                    $location.replace();
                }
                return function () {};
            } else {
                var deferred = $q.defer();
                var unregisterWatch = $rootScope.$watch('layout', function (value) {
                    if (!value) {
                        return;
                    }
                    if ($location.path() === '/login') {
                        // no need to add transaction-type to url
                        deferred.resolve();
                        unregisterWatch();
                        return;
                    }
                    var hasAgent = !$rootScope.layout.central || $location.search()['agent-id'] || $location.search()['agent-rollup-id'];
                    if (hasAgent && needsTransactionType && !$location.search()['transaction-type']) {
                        $location.search('transaction-type', $rootScope.defaultTransactionType());
                        $location.replace();
                    }
                    deferred.resolve();
                    unregisterWatch();
                });
                return deferred.promise;
            }
        }
    ];
};



/**
 * Faz a resolução para o módulo solicitado
 *
 * @param {type} module
 * @returns {Array}
 */
function resolveModule(module) {
    return [
        '$q', '$ocLazyLoad',
        function ($q, $ocLazyLoad) {
            if (window.__BUNDLED__MODULES__) {
                return $ocLazyLoad.load({
                    name: module,
                    files: ['modules/' + module + '/' + module + '.bundle.min.js']
                });
            } else {
                var deferred = $q.defer();
                setTimeout(function () {
                    $ocLazyLoad.load({
                        name: module
                    });
                    deferred.resolve(true);
                });
                return deferred.promise;
            }
        }
    ];
}

/**
 * Facilitador de criação de endereços para templates
 *
 * @param {type} page
 * @param {type} module
 * @returns {String}
 */
function urlTemplate(page, module) {
    return 'modules/' + module + '/templates/' + page + '.html';
}

