/*
 * Copyright 2015-2016 the original author or authors.
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

angular
        .module('GtApp')
        .factory('locationChanges', LocationChangesFactory);

LocationChangesFactory.$inject = ['$location'];

/**
 * Watching for location changes is important for handling browser back/forward buttons
 *
 * @param {type} $location
 * @returns {LocationChangesFactory.location-changesAnonym$0}
 */
function LocationChangesFactory($location) {

    function on($scope, callback) {
        var path = $location.path();
        $scope.$on('$locationChangeSuccess', function () {
            if ($location.path() === path) {
                callback();
            }
        });
        callback();
    }

    return {
        on: on
    };
}