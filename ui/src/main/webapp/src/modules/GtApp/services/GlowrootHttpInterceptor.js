
angular.module('GtApp')
        .factory('GlowrootHttpInterceptor', GlowrootHttpInterceptor);


GlowrootHttpInterceptor.$inject = ['$rootScope', '$injector', '$location', '$q', '$timeout', 'login'];

/**
 *
 * @param {type} $rootScope
 * @param {type} $injector
 * @param {type} $location
 * @param {type} $q
 * @param {type} $timeout
 * @param {type} login
 * @returns {GlowrootHttpInterceptor.GlowrootHttpInterceptorAnonym$0}
 */
function GlowrootHttpInterceptor($rootScope, $injector, $location, $q, $timeout, login) {
    return {
        response: function (response) {
            var layoutVersion = response.headers('Glowroot-Layout-Version');
            if (layoutVersion && $rootScope.layout && layoutVersion !== $rootScope.layout.version) {
                $injector.get('$http').get('backend/layout')
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
            return response;
        },
        responseError: function (response) {
            if (response.status === 401) {
                var path = $location.path();
                // only act on the first 401 response in case more than one request was triggered
                if (path === '/login') {
                    // return a never-resolving promise
                    return $q.defer().promise;
                }
                if (response.data.timedOut) {
                    login.goToLogin('Your session has timed out');
                } else {
                    login.goToLogin();
                }
                // return a never-resolving promise
                return $q.defer().promise;
            }
            if (response.status === 0) {
                // this can be caused by the user hitting F5 refresh in the middle of an ajax request (which seems not
                // that uncommon if ajax response happens to be slow), so defer the rejection a bit so the error will not
                // be displayed in this case
                //
                // the other common case for status === 0 is when the server is down altogether, and the message for this
                // case is generated downstream in http-errors (after the slight delay)
                var deferred = $q.defer();
                $timeout(function () {
                    deferred.reject(response);
                }, 500);
                return deferred.promise;
            }
            return $q.reject(response);
        }
    };
}

