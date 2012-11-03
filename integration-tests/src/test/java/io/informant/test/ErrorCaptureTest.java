/**
 * Copyright 2011-2012 the original author or authors.
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
package io.informant.test;

import static org.fest.assertions.api.Assertions.assertThat;
import io.informant.test.plugin.LogCauseExceptionAspect;
import io.informant.test.plugin.LogCauseExceptionAspect.LogCauseExceptionAdvice;
import io.informant.testkit.AppUnderTest;
import io.informant.testkit.InformantContainer;
import io.informant.testkit.Trace;
import io.informant.testkit.Trace.CapturedException;
import io.informant.testkit.TraceMarker;

import java.util.Set;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import com.google.common.collect.Sets;

/**
 * @author Trask Stalnaker
 * @since 0.5
 */
public class ErrorCaptureTest {

    private static InformantContainer container;

    @BeforeClass
    public static void setUp() throws Exception {
        container = InformantContainer.create();
    }

    @AfterClass
    public static void tearDown() throws Exception {
        container.close();
    }

    @After
    public void afterEachTest() throws Exception {
        container.getInformant().cleanUpAfterEachTest();
    }

    @Test
    public void shouldShouldCaptureError() throws Exception {
        // given
        container.getInformant().setStoreThresholdMillis(10000);
        // when
        container.executeAppUnderTest(ShouldCaptureError.class);
        // then
        Trace trace = container.getInformant().getLastTrace();
        assertThat(trace.getError()).isNotNull();
        assertThat(trace.getSpans()).hasSize(3);
        assertThat(trace.getSpans().get(0).getError()).isNotNull();
        assertThat(trace.getSpans().get(1).getError()).isNull();
        assertThat(trace.getSpans().get(2).getError()).isNull();
    }

    @Test
    public void shouldShouldCaptureErrorWithSpanStackTrace() throws Exception {
        // given
        container.getInformant().setStoreThresholdMillis(0);
        // when
        container.executeAppUnderTest(ShouldCaptureErrorWithSpanStackTrace.class);
        // then
        Trace trace = container.getInformant().getLastTrace();
        assertThat(trace.getError()).isNull();
        assertThat(trace.getSpans()).hasSize(2);
        assertThat(trace.getSpans().get(1).getError()).isNotNull();
        assertThat(trace.getSpans().get(1).getMessage().getText()).isEqualTo("ERROR -- abc");
        CapturedException exception = trace.getSpans().get(1).getError().getException();
        assertThat(exception.getStackTrace().get(0)).startsWith(
                ShouldCaptureErrorWithSpanStackTrace.class.getName() + ".traceMarker(");
    }

    @Test
    public void shouldShouldCaptureErrorWithCausalChain() throws Exception {
        // given
        container.getInformant().setStoreThresholdMillis(0);
        // when
        container.executeAppUnderTest(ShouldCaptureErrorWithCausalChain.class);
        // then
        Trace trace = container.getInformant().getLastTrace();
        assertThat(trace.getError()).isNull();
        assertThat(trace.getSpans()).hasSize(2);
        assertThat(trace.getSpans().get(1).getError()).isNotNull();
        assertThat(trace.getSpans().get(1).getMessage().getText()).isEqualTo("ERROR -- abc");
        CapturedException exception = trace.getSpans().get(1).getError().getException();
        assertThat(exception.getDisplay()).isEqualTo(
                "java.lang.Exception: java.lang.IllegalArgumentException: Cause 3");
        assertThat(exception.getStackTrace().get(0)).startsWith(
                LogCauseExceptionAdvice.class.getName() + ".onAfter(");
        assertThat(exception.getFramesInCommonWithCaused()).isZero();
        CapturedException cause = exception.getCause();
        assertThat(cause.getDisplay()).isEqualTo("java.lang.IllegalArgumentException: Cause 3");
        assertThat(cause.getStackTrace().get(0)).startsWith(
                LogCauseExceptionAspect.class.getName() + ".<clinit>(");
        assertThat(cause.getFramesInCommonWithCaused()).isGreaterThan(0);
        Set<Integer> causeExceptionLineNumbers = Sets.newHashSet();
        causeExceptionLineNumbers.add(getFirstLineNumber(cause));
        cause = cause.getCause();
        assertThat(cause.getDisplay()).isEqualTo("java.lang.RuntimeException: Cause 2");
        assertThat(cause.getStackTrace().get(0)).startsWith(
                LogCauseExceptionAspect.class.getName() + ".<clinit>(");
        assertThat(cause.getFramesInCommonWithCaused()).isGreaterThan(0);
        causeExceptionLineNumbers.add(getFirstLineNumber(cause));
        cause = cause.getCause();
        assertThat(cause.getDisplay()).isEqualTo("java.lang.IllegalStateException: Cause 1");
        assertThat(cause.getStackTrace().get(0)).startsWith(
                LogCauseExceptionAspect.class.getName() + ".<clinit>(");
        assertThat(cause.getFramesInCommonWithCaused()).isGreaterThan(0);
        causeExceptionLineNumbers.add(getFirstLineNumber(cause));
        // make sure they are all different line numbers
        assertThat(causeExceptionLineNumbers).hasSize(3);
    }

    private static int getFirstLineNumber(CapturedException cause) {
        String element = cause.getStackTrace().get(0);
        return Integer.parseInt(element.substring(element.lastIndexOf(':') + 1,
                element.length() - 1));
    }

    public static class ShouldCaptureError implements AppUnderTest {
        public void executeApp() throws Exception {
            Exception expected = new Exception();
            try {
                new LevelOne(expected).call("a", "b");
            } catch (Exception e) {
                if (e != expected) {
                    // suppress expected exception
                    throw e;
                }
            }
        }
    }

    public static class ShouldCaptureErrorWithSpanStackTrace implements AppUnderTest, TraceMarker {
        public void executeApp() throws Exception {
            traceMarker();
        }
        public void traceMarker() throws Exception {
            new LogError().log("abc");
        }
    }

    public static class ShouldCaptureErrorWithCausalChain implements AppUnderTest, TraceMarker {
        public void executeApp() throws Exception {
            traceMarker();
        }
        public void traceMarker() throws Exception {
            new LogCauseException().log("abc");
        }
    }
}