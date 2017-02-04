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
        .module('GtJvm')
        .controller('JvmMBeanTreeCtrl', JvmMBeanTreeCtrl);


JvmMBeanTreeCtrl.$inject = ['$scope', '$location', '$http'];

function JvmMBeanTreeCtrl($scope, $location, $http) {

    // Page header
    $scope.page.title = 'JVM - MBean tree';
    $scope.page.subTitle = '';
    $scope.page.helpPopoverTemplate = '';
    $scope.page.breadcrumb = null;

    if ($scope.hideMainContent()) {
        return;
    }

    var expandedObjectNames = $location.search().expanded || [];
    if (!angular.isArray(expandedObjectNames)) {
        expandedObjectNames = [expandedObjectNames];
    }

    function updateLocation() {
        var query = {};
        if ($scope.layout.central) {
            query['agent-id'] = $scope.agentId;
        }
        query.expanded = expandedObjectNames;
        $location.search(query).replace();
    }

    $scope.refresh = function () {
        $scope.loaded = false;
        $http.get('backend/jvm/mbean-tree', {
            params: {
                'agent-id': $scope.agentId,
                expanded: expandedObjectNames
            }
        }).then(function (response) {
            $scope.agentNotConnected = response.data.agentNotConnected;
            if ($scope.agentNotConnected) {
                return;
            }

            $scope.loaded = true;

            var flattened = [];
            var SEQ = 1;
            function recurse(list, depth, parent) {
                angular.forEach(list, function (node) {
                    node.depth = depth;
                    node.id = SEQ++;
                    node.parent = parent;
                    flattened.push(node);
                    if (node.childNodes) {
                        recurse(node.childNodes, depth + 1, node.id);
                    }
                });
            }
            recurse(response.data, 0);
            $scope.data = flattened;
        }, function (response) {
            $scope.$emit('httpError', response);
        });
    };

    $scope.isSimpleValue = function (value) {
        if (angular.isObject(value) || angular.isArray(value)) {
            return false;
        }
        return true;
    };

    $scope.toggleAttributes = function (node) {
        node.expanded = !node.expanded;

        if (node.expanded) {
            expandedObjectNames.push(node.objectName);
        } else {
            var idx = expandedObjectNames.indexOf(node.objectName);
            if (idx >= 0) {
                expandedObjectNames.splice(idx, 1);
            }
        }
        updateLocation();

        if (node.attributeMap) {
            return;
        }

        $http.get('backend/jvm/mbean-attribute-map', {
            params: {
                'agent-id': $scope.agentId,
                'object-name': node.objectName
            }
        }).then(function (response) {
            node.attributeMap = response.data;
        }, function (response) {
            $scope.$emit('httpError', response);
        });
    };

    $scope.refresh();
}

