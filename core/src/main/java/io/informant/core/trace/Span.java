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
package io.informant.core.trace;

import io.informant.api.ErrorMessage;
import io.informant.api.MessageSupplier;

import javax.annotation.Nullable;
import javax.annotation.concurrent.ThreadSafe;

import com.google.common.base.Objects;

/**
 * The "span" terminology is borrowed from <a
 * href="http://research.google.com/pubs/pub36356.html">Dapper</a>.
 * 
 * This must support updating by a single thread and reading by multiple threads.
 * 
 * @author Trask Stalnaker
 * @since 0.5
 */
@ThreadSafe
public class Span {

    @Nullable
    private final MessageSupplier messageSupplier;
    @Nullable
    private volatile ErrorMessage errorMessage;

    private final long traceStartTick;
    private final long startTick;
    private volatile long endTick;

    // index is per trace and starts at 0
    private final int index;
    private final int parentIndex;

    // nesting is just a convenience for output
    private final int nestingLevel;

    // associated trace metric, stored here so it can be accessed in PluginServices.endSpan(Span)
    @Nullable
    private final TraceMetric traceMetric;

    @Nullable
    private volatile StackTraceElement[] stackTrace;

    Span(@Nullable MessageSupplier messageSupplier, long traceStartTick, long startTick,
            int index, int parentIndex, int nesting, @Nullable TraceMetric traceMetric) {

        this.messageSupplier = messageSupplier;
        this.traceStartTick = traceStartTick;
        this.startTick = startTick;
        this.index = index;
        this.parentIndex = parentIndex;
        this.nestingLevel = nesting;
        this.traceMetric = traceMetric;
    }

    @Nullable
    public MessageSupplier getMessageSupplier() {
        return messageSupplier;
    }

    @Nullable
    public ErrorMessage getErrorMessage() {
        return errorMessage;
    }

    public long getStartTick() {
        return startTick;
    }

    public long getEndTick() {
        return endTick;
    }

    // offset in nanoseconds from beginning of trace
    public long getOffset() {
        return startTick - traceStartTick;
    }

    public int getIndex() {
        return index;
    }

    public int getParentIndex() {
        return parentIndex;
    }

    public int getNestingLevel() {
        return nestingLevel;
    }

    @Nullable
    public StackTraceElement[] getStackTrace() {
        return stackTrace;
    }

    @Nullable
    TraceMetric getTraceMetric() {
        return traceMetric;
    }

    void setErrorMessage(ErrorMessage errorMessage) {
        this.errorMessage = errorMessage;
    }

    void setEndTick(long endTick) {
        this.endTick = endTick;
    }

    public void setStackTrace(@Nullable StackTraceElement[] stackTrace) {
        this.stackTrace = stackTrace;
    }

    @Override
    public String toString() {
        return Objects.toStringHelper(this)
                .add("message", messageSupplier.get())
                .add("errorMessage", errorMessage)
                .add("traceStartTick", traceStartTick)
                .add("startTick", startTick)
                .add("endTick", endTick)
                .add("index", index)
                .add("parentIndex", parentIndex)
                .add("nestingLevel", nestingLevel)
                .add("traceMetric", traceMetric)
                .add("stackTrace", stackTrace)
                .toString();
    }
}