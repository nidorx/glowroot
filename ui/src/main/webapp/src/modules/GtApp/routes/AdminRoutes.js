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
        .config(AdministrationRoutes);


AdministrationRoutes.$inject = ['$provide', '$stateProvider', '$urlRouterProvider'];


function AdministrationRoutes($provide, $stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('page.admin.agentList', {
                url: '/agent-list',
                templateUrl: 'views/admin/agent-list.html',
                controller: 'AdminAgentListCtrl'
            })
            .state('page.admin.agent', {
                url: '/agent',
                templateUrl: 'views/admin/agent.html',
                controller: 'AdminAgentCtrl'
            })
            .state('page.admin.userList', {
                url: '/user-list',
                templateUrl: 'views/admin/user-list.html',
                controller: 'AdminUserListCtrl'
            })
            .state('page.admin.user', {
                url: '/user',
                templateUrl: 'views/admin/user.html',
                controller: 'AdminUserCtrl'
            })
            .state('page.admin.roleList', {
                url: '/role-list',
                templateUrl: 'views/admin/role-list.html',
                controller: 'AdminRoleListCtrl'
            })
            .state('page.admin.role', {
                url: '/role',
                templateUrl: 'views/admin/role.html',
                controller: 'AdminRoleCtrl'
            })
            .state('page.admin.web', {
                url: '/web',
                templateUrl: 'views/admin/web.html',
                controller: 'AdminWebCtrl'
            })
            .state('page.admin.storage', {
                url: '/storage',
                templateUrl: 'views/admin/storage.html',
                controller: 'AdminStorageCtrl'
            })
            .state('page.admin.smtp', {
                url: '/smtp',
                templateUrl: 'views/admin/smtp.html',
                controller: 'AdminSmtpCtrl'
            })
            .state('page.admin.ldap', {
                url: '/ldap',
                templateUrl: 'views/admin/ldap.html',
                controller: 'AdminLdapCtrl'
            });


}
