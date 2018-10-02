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
package org.glowroot.agent.plugin.servlet;

import java.lang.reflect.Method;

import org.glowroot.agent.plugin.api.Logger;
import org.glowroot.agent.plugin.api.checker.Nullable;
import org.glowroot.agent.plugin.api.util.Reflection;

public class ResponseInvoker {

    private static final Logger logger = Logger.getLogger(ResponseInvoker.class);

    // ServletResponse.getContentType() was introduced in Servlet 2.4
    private final @Nullable Method getContentTypeMethod;
    // HttpServletResponse.getHeader() was introduced in Servlet 3.0
    private final @Nullable Method getHeaderMethod;
    // HttpServletResponse.getStatus() was introduced in Servlet 3.0
    private final @Nullable Method getStatusMethod;

    public ResponseInvoker(Class<?> clazz) {
        Class<?> servletResponseClass = getServletResponseClass(clazz);
        getContentTypeMethod = Reflection.getMethod(servletResponseClass, "getContentType");
        Class<?> httpServletResponseClass = getHttpServletResponseClass(clazz);
        getHeaderMethod = Reflection.getMethod(httpServletResponseClass, "getHeader", String.class);
        getStatusMethod = Reflection.getMethod(httpServletResponseClass, "getStatus");
    }

    boolean hasGetContentTypeMethod() {
        return getContentTypeMethod != null;
    }

    String getContentType(Object response) {
        return Reflection.invokeWithDefault(getContentTypeMethod, response, "");
    }

    boolean hasGetHeaderMethod() {
        return getHeaderMethod != null;
    }

    String getHeader(Object response, String name) {
        return Reflection.invokeWithDefault(getHeaderMethod, response, "", name);
    }

    boolean hasGetStatusMethod() {
        return getStatusMethod != null;
    }

    int getStatus(Object response) {
        return Reflection.invokeWithDefault(getStatusMethod, response, -1);
    }

    // visible for testing
    static @Nullable Class<?> getServletResponseClass(Class<?> clazz) {
        try {
            return Class.forName("javax.servlet.ServletResponse", false, clazz.getClassLoader());
        } catch (ClassNotFoundException e) {
            logger.warn(e.getMessage(), e);
        }
        return null;
    }

    // visible for testing
    static @Nullable Class<?> getHttpServletResponseClass(Class<?> clazz) {
        try {
            return Class.forName("javax.servlet.http.HttpServletResponse", false,
                    clazz.getClassLoader());
        } catch (ClassNotFoundException e) {
            logger.warn(e.getMessage(), e);
        }
        return null;
    }
}
