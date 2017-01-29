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
'use strict';

/* global angular, moment, $ */


angular
        .module('GtTransaction')
        .factory('model', ModelFactory);


/**
 * Allows Controllers to share the same Range object
 * 
 * @returns {ModelFactory.ModelRangeFactoryAnonym$0}
 */
function ModelFactory() {
    return {
        transactionType:null,
        transactionName:null,
        range: {
            last: null,
            chartFrom: null,
            chartTo: null,
            chartRefresh: null
        }
    };
}

