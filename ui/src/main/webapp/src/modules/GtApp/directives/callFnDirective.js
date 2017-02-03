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
        .directive('callFn', CallFnDirective);

window.minhaFuncaoA = function () {
    console.log('minhaFuncaoA', arguments);
};

window.teste = {
    funcaoB: function (arg1, arg2) {
        console.log('teste.funcaoB', arg1, arg2);
    },
    filho: {
        funcao: function (arg1, arg2, arg3) {
            console.log('teste.filho.funcao', arg1, arg2, arg3);

        }
    }
};

// <button call-fn="minhaFuncaoA">minhaFuncaoA</button>
// <button call-fn="minhaFuncaoA({{'\'maria\''}})">minhaFuncaoA({{'\'maria\''}})</button>
// <button call-fn="minhaFuncaoA(2+2)">minhaFuncaoA(2+2)</button>
// 
// <button call-fn="teste.funcaoB">teste.funcaoB</button>
// <button call-fn="teste.funcaoB({{'\'maria\''}},{{'\'joana\''}})">
//     teste.funcaoB({{'\'maria\''}},{{'\'joana\''}})
// </button>
// <button call-fn="teste.funcaoB(2+2,3+3)">teste.funcaoB(2+2,3+3)</button>
// 
// <button call-fn="teste.filho.funcao">teste.filho.funcao</button>
// <button call-fn="teste.filho.funcao({{'\'maria\''}},{{'\'joana\''}}, 3+1)">
//     teste.filho.funcao({{'maria'}},{{'\'joana\''}}, 3+1)
// </button>
// <button call-fn="teste.filho.funcao(2+2,3+3, '\'jose\'')">
//     teste.filho.funcao(2+2,3+3, '\'jose\'')
// </button>

CallFnDirective.$inject = ['$rootScope'];
function CallFnDirective($rootScope) {
    return {
        link: function ($scope, $el, $attrs) {
            var parts = $attrs.callFn.match(/([a-z_$][a-z0-9_$.]*)(?:\((.*)?\))?/i);
            var path = parts[1].split('.');
            var args = parts[2];
            $el.bind('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var root = window;
                var action = null;
                for (var a = 0, l = path.length; a < l; a++) {
                    var part = path[a];
                    if (a === l - 1) {
                        // last
                        if (typeof root[part] === 'function') {
                            action = root[part];
                        }
                    } else {
                        if (angular.isObject(root[part])) {
                            root = root[part];
                        } else {
                            // Not found
                            break;
                        }
                    }
                }

                if (action) {
                    var argsArray = [];
                    if (args) {
                        argsArray = $scope.$eval('[' + args + ']');
                    }
                    action.apply(root, argsArray);
                } else {
                    $rootScope.$broadcast($attrs.callFn);
                }
            });
        }
    };
}