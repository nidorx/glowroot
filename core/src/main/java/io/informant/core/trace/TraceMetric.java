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

import io.informant.api.Timer;
import io.informant.core.util.PartiallyThreadSafe;

import javax.annotation.concurrent.Immutable;

import com.google.common.base.Objects;
import com.google.common.base.Ticker;

/**
 * Element of MetricData.
 * 
 * All timing data is measured in nanoseconds.
 * 
 * @author Trask Stalnaker
 * @since 0.5
 */
@PartiallyThreadSafe("getSnapshot() can be called from any thread")
public class TraceMetric implements Timer {

    private final String name;
    // nanosecond rollover (292 years) isn't a concern for total time on a single trace
    private long total;
    private long min = Long.MAX_VALUE;
    private long max = Long.MIN_VALUE;
    private long count;

    private long startTick;
    // selfNestingLevel is written after any non-volatile fields are written and it is read before
    // any non-volatile fields are read, creating a memory barrier and making the latest values of
    // the non-volatile fields visible to the reading thread
    private volatile int selfNestingLevel;
    // this field cannot piggyback on the volatility of selfNestingLevel like the others, but that
    // is ok since it is primarily read (cheap for volatile) and rarely updated ('expensive' for
    // volatile)
    private volatile boolean firstStart = true;

    private final Ticker ticker;

    TraceMetric(String name, Ticker ticker) {
        this.name = name;
        this.ticker = ticker;
    }

    // safe to be called from another thread
    public Snapshot getSnapshot() {
        // try to grab a quick, consistent snapshot, but no guarantees on consistency if trace is
        // active

        // selfNestingLevel is read first since it is used as a memory barrier so that the
        // non-volatile fields below will be visible to this thread
        boolean active = selfNestingLevel > 0;

        if (active) {
            long currentTick = ticker.read();
            long curr = currentTick - startTick;
            if (count == 0) {
                return new Snapshot(name, curr, curr, curr, 1, true, true, true);
            } else if (curr > max) {
                return new Snapshot(name, total + curr, min, curr, count + 1, true, false, true);
            } else {
                return new Snapshot(name, total + curr, min, max, count + 1, true, false, false);
            }
        } else {
            return new Snapshot(name, total, min, max, count, false, false, false);
        }
    }

    public void end() {
        end(ticker.read());
    }

    boolean isFirstStart() {
        return firstStart;
    }

    void firstStartSeen() {
        firstStart = false;
    }

    // start() avoids a ticker read in some cases, so don't just implement as start(ticker.read())
    void start() {
        if (selfNestingLevel == 0) {
            this.startTick = ticker.read();
        }
        // selfNestingLevel is incremented after updating startTick since selfNestingLevel is used
        // as a memory barrier so startTick will be visible to other threads in copyOf()
        selfNestingLevel++;
    }

    void start(long startTick) {
        if (selfNestingLevel == 0) {
            this.startTick = startTick;
        }
        // selfNestingLevel is incremented after updating startTick since selfNestingLevel is used
        // as a memory barrier so startTick will be visible to other threads in copyOf()
        selfNestingLevel++;
    }

    void end(long endTick) {
        if (selfNestingLevel == 1) {
            recordData(endTick - startTick);
        }
        // selfNestingLevel is decremented after recording data since it is volatile and creates a
        // memory barrier so that all updated fields will be visible to other threads in copyOf()
        selfNestingLevel--;
    }

    long getCount() {
        return count;
    }

    private void recordData(long time) {
        if (time > max) {
            max = time;
        }
        if (time < min) {
            min = time;
        }
        count++;
        total += time;
    }

    @Override
    public String toString() {
        return Objects.toStringHelper(this)
                .add("name", name)
                .add("total", total)
                .add("min", min)
                .add("max", max)
                .add("count", count)
                .add("startTick", startTick)
                .add("selfNestingLevel", selfNestingLevel)
                .add("firstStart", firstStart)
                .toString();
    }

    @Immutable
    public static class Snapshot {

        private final String name;
        private final long total;
        private final long min;
        private final long max;
        private final long count;
        private final boolean active;
        private final boolean minActive;
        private final boolean maxActive;

        private Snapshot(String name, long total, long min, long max, long count, boolean active,
                boolean minActive, boolean maxActive) {

            this.name = name;
            this.total = total;
            this.min = min;
            this.max = max;
            this.count = count;
            this.active = active;
            this.minActive = minActive;
            this.maxActive = maxActive;
        }

        public String getName() {
            return name;
        }

        public long getTotal() {
            return total;
        }

        public long getMin() {
            return min;
        }

        public long getMax() {
            return max;
        }

        public long getCount() {
            return count;
        }

        public boolean isActive() {
            return active;
        }

        public boolean isMinActive() {
            return minActive;
        }

        public boolean isMaxActive() {
            return maxActive;
        }
    }
}