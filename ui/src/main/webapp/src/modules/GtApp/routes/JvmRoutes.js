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
        .config(JvmRoutes);


JvmRoutes.$inject = ['$provide', '$stateProvider', '$urlRouterProvider'];


function JvmRoutes($provide, $stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('page.jvm.gauges', {
                url: '/gauges?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/gauge-values.html',
                controller: 'JvmGaugeValuesCtrl'
            })
            .state('page.jvm.threadDump', {
                url: '/thread-dump?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/thread-dump.html',
                controller: 'JvmThreadDumpCtrl'
            })
            .state('page.jvm.jstack', {
                url: '/jstack?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/jstack.html',
                controller: 'JvmJstackCtrl'
            })
            .state('page.jvm.heapDump', {
                url: '/heap-dump?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/heap-dump.html',
                controller: 'JvmHeapDumpCtrl'
            })
            .state('page.jvm.heapHistogram', {
                url: '/heap-histogram?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/heap-histogram.html',
                controller: 'JvmHeapHistogramCtrl'
            })
            .state('page.jvm.gc', {
                url: '/gc?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/gc.html',
                controller: 'JvmGcCtrl'
            })
            .state('page.jvm.mbeanTree', {
                url: '/mbean-tree?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/mbean-tree.html',
                controller: 'JvmMBeanTreeCtrl'
            })
            .state('page.jvm.systemProperties', {
                url: '/system-properties?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/system-properties.html',
                controller: 'JvmSystemPropertiesCtrl'
            })
            .state('page.jvm.environment', {
                url: '/environment?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/environment.html',
                controller: 'JvmEnvironmentCtrl'
            })
            .state('page.jvm.capabilities', {
                url: '/capabilities?agent-id&agent-rollup-id',
                templateUrl: 'views/jvm/capabilities.html',
                controller: 'JvmCapabilitiesCtrl'
            });

}
