/*
 * Copyright 2015-2017 the original author or authors.
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

/* global angular, moment, $ */


angular
        .module('GtApp')
        .factory('gtButtonGroupControllerFactory', GtButtonGroupControllerFactory);

GtButtonGroupControllerFactory.$inject = ['$q'];

function GtButtonGroupControllerFactory($q) {
    return {
        create: function (element, noSpinner) {
            var $element = $(element);
            var alreadyExecuting = false;
            return {
                onClick: function (fn) {
                    // handle crazy user clicking on the button
                    if (alreadyExecuting) {
                        return;
                    }
                    var $buttonMessage = $element.find('.gt-button-message');
                    var $buttonSpinner = $element.find('.gt-button-spinner');
                    // in case button is clicked again before message fades out
                    $buttonMessage.addClass('hide');
                    var spinner;
                    if (!noSpinner) {
                        spinner = Glowroot.showSpinner($buttonSpinner);
                    }

                    var deferred = $q.defer();
                    deferred.promise.then(function (message) {
                        if (spinner) {
                            spinner.stop();
                        }
                        // if message is undefined (e.g. no explicit success message), need to pass empty string,
                        // otherwise it won't overwrite old error message in $buttonMessage if there is one
                        $buttonMessage.text(message || '');
                        $buttonMessage.removeClass('gt-button-message-error');
                        $buttonMessage.addClass('gt-button-message-success');
                        Glowroot.showAndFadeSuccessMessage($buttonMessage);
                        alreadyExecuting = false;
                    }, function (message) {
                        if (spinner) {
                            spinner.stop();
                        }
                        Glowroot.cancelFadeSuccessMessage($buttonMessage);
                        $buttonMessage.text(message);
                        $buttonMessage.removeClass('gt-button-message-success');
                        $buttonMessage.addClass('gt-button-message-error');
                        $buttonMessage.removeClass('hide');
                        alreadyExecuting = false;
                    });

                    alreadyExecuting = true;
                    fn({deferred: deferred});
                }
            };
        }
    };
}
