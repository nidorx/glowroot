/*
 * Copyright 2016-2017 the original author or authors.
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
        .module('GtAdmin')
        .controller('AdminSmtpCtrl', AdminSmtpCtrl);


AdminSmtpCtrl.$inject = ['$scope', '$http', 'modals', 'confirmIfHasChanges', 'httpErrors'];

function AdminSmtpCtrl($scope, $http, modals, confirmIfHasChanges, httpErrors) {

    // initialize page binding object
    $scope.page = {};

    $scope.hasChanges = function () {
        return $scope.originalConfig && !angular.equals($scope.config, $scope.originalConfig);
    };
    $scope.$on('$locationChangeStart', confirmIfHasChanges($scope));

    function onNewData(data) {
        $scope.loaded = true;
        $scope.config = data.config;
        $scope.originalConfig = angular.copy(data.config);
        if (data.config.passwordExists) {
            $scope.password = '********';
        }
        $scope.localServerName = data.localServerName;
    }

    $scope.onPasswordChange = function () {
        $scope.config.newPassword = $scope.password;
        $scope.config.passwordExists = $scope.password !== '';
    };

    $scope.onPasswordClick = function () {
        $('#password').select();
    };

    $scope.save = function (deferred) {
        $http.post('backend/admin/smtp', $scope.config)
                .then(function (response) {
                    onNewData(response.data);
                    deferred.resolve('Saved');
                }, function (response) {
                    httpErrors.handle(response, $scope, deferred);
                });
    };

    $scope.sendTestEmail = function (deferred) {
        var postData = angular.copy($scope.config);
        postData.testEmailRecipient = $scope.page.testEmailRecipient;
        $http.post('backend/admin/send-test-email', postData)
                .then(function (response) {
                    if (response.data.error) {
                        deferred.reject(response.data.message);
                    } else {
                        deferred.resolve('Sent');
                    }
                }, function (response) {
                    httpErrors.handle(response, $scope, deferred);
                });
    };

    $http.get('backend/admin/smtp')
            .then(function (response) {
                onNewData(response.data);
            }, function (response) {
                $scope.$emit('httpError', response);
            });
}
