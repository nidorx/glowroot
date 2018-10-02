/*
 * Copyright 2014-2018 the original author or authors.
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
package org.glowroot.agent.bytecode.api;

import java.lang.reflect.Array;
import java.lang.reflect.Type;
import java.util.LinkedHashSet;
import java.util.Set;

public class Util {

    private Util() {}

    public static Class<?> getArrayClass(Class<?> type, int nDimensions) {
        if (nDimensions == 0) {
            return type;
        }
        return getArrayClass(Array.newInstance(type, 0).getClass(), nDimensions - 1);
    }

    public static String[] appendToJBossModulesSystemPkgs(String[] original) {
        String[] arr = new String[original.length + 1];
        System.arraycopy(original, 0, arr, 0, original.length);
        arr[original.length] = "org.glowroot.agent";
        return arr;
    }

    public static Set<Type> stripGlowrootTypes(Set<Type> decoratedTypes) {
        boolean found = false;
        for (Type decoratedType : decoratedTypes) {
            if (isGlowrootType(decoratedType)) {
                found = true;
            }
        }
        if (!found) {
            // optimization of common case
            return decoratedTypes;
        }
        // linked hash set to preserve ordering
        Set<Type> stripped = new LinkedHashSet<Type>();
        for (Type decoratedType : decoratedTypes) {
            if (!isGlowrootType(decoratedType)) {
                stripped.add(decoratedType);
            }
        }
        return stripped;
    }

    public static Set<Class<?>> stripGlowrootClasses(Set<Class<?>> classes) {
        boolean found = false;
        for (Class<?> clazz : classes) {
            if (isGlowrootClass(clazz)) {
                found = true;
            }
        }
        if (!found) {
            // optimization of common case
            return classes;
        }
        // linked hash set to preserve ordering
        Set<Class<?>> stripped = new LinkedHashSet<Class<?>>();
        for (Class<?> clazz : classes) {
            if (!isGlowrootClass(clazz)) {
                stripped.add(clazz);
            }
        }
        return stripped;
    }

    private static boolean isGlowrootType(Type decoratedType) {
        return decoratedType instanceof Class
                && ((Class<?>) decoratedType).getName().startsWith("org.glowroot.agent.");
    }

    private static boolean isGlowrootClass(Class<?> clazz) {
        return clazz.getName().startsWith("org.glowroot.agent.");
    }
}
