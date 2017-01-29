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


/* global angular, Glowroot, $, Spinner, moment */

angular
        .module('GtApp')
        .directive('gtDatePicker', GtDatePickerDirective);


GtDatePickerDirective.$inject = ['$timeout'];

function GtDatePickerDirective($timeout) {
    return {
        scope: {
            gtModel: '=',
            gtId: '@'
        },
        templateUrl: 'modules/GtApp/templates/GtDatePicker.html',
        link: function (scope, iElement) {
            var dateElement = iElement.find('.date');
            var icons = {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right'
            };
            var dateElementPicker = dateElement.datetimepicker({
                icons: icons,
                format: 'L'
            });
            scope.$watch('gtModel', function (newValue) {
                dateElement.data('DateTimePicker').date(moment(newValue));
            });
            dateElementPicker.on('dp.change', function (event) {
                $timeout(function () {
                    scope.gtModel = event.date.valueOf();
                });
            });
        }
    };
}
