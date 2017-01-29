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


JvmRoutes.$inject = ['$stateProvider'];

function JvmRoutes($stateProvider) {

    $stateProvider
            .state('page.jvm.gauges', {
                url: '/gauges?&last&from&to',
                templateUrl: urlTemplate('GaugeValues', 'GtJvm')
            })
            .state('page.jvm.threadDump', {
                url: '/thread-dump',
                templateUrl: urlTemplate('ThreadDum', 'GtJvm')
            })
            .state('page.jvm.heapDump', {
                url: '/heap-dump',
                templateUrl: urlTemplate('HeapDump', 'GtJvm')
            })
            .state('page.jvm.heapHistogram', {
                url: '/heap-histogram',
                templateUrl: urlTemplate('HeapHistogram', 'GtJvm')
            })
            .state('page.jvm.mbeanTree', {
                url: '/mbean-tree',
                templateUrl: urlTemplate('MBeanTree', 'GtJvm')
            })
            .state('page.jvm.systemProperties', {
                url: '/system-properties',
                templateUrl: urlTemplate('SystemProperties', 'GtJvm')
            })
            .state('page.jvm.environment', {
                url: '/environment',
                templateUrl: urlTemplate('Environment', 'GtJvm')
            })
            .state('page.jvm.jstack', {
                url: '/jstack',
                templateUrl: urlTemplate('Jstack', 'GtJvm')
            })
            .state('page.jvm.gc', {
                url: '/gc',
                templateUrl: urlTemplate('Gc', 'GtJvm')
            })
            .state('page.jvm.capabilities', {
                url: '/capabilities',
                templateUrl: urlTemplate('Capabilities', 'GtJvm')
            });
}
