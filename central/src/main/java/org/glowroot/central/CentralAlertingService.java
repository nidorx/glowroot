/*
 * Copyright 2017-2018 the original author or authors.
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
package org.glowroot.central;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.google.common.base.Stopwatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.glowroot.agent.api.Instrumentation;
import org.glowroot.agent.api.Instrumentation.AlreadyInTransactionBehavior;
import org.glowroot.central.repo.ConfigRepositoryImpl;
import org.glowroot.common2.repo.ConfigRepository.AgentConfigNotFoundException;
import org.glowroot.common2.repo.util.AlertingService;
import org.glowroot.wire.api.model.AgentConfigOuterClass.AgentConfig.AlertConfig;
import org.glowroot.wire.api.model.AgentConfigOuterClass.AgentConfig.AlertConfig.AlertCondition;

import static java.util.concurrent.TimeUnit.MINUTES;
import static java.util.concurrent.TimeUnit.SECONDS;

class CentralAlertingService {

    private static final Logger logger = LoggerFactory.getLogger(CentralAlertingService.class);

    private final ConfigRepositoryImpl configRepository;
    private final AlertingService alertingService;
    private final HeartbeatAlertingService heartbeatAlertingService;

    private final ExecutorService alertCheckingExecutor;

    private final Stopwatch stopwatch = Stopwatch.createStarted();

    private volatile boolean closed;

    CentralAlertingService(ConfigRepositoryImpl configRepository, AlertingService alertingService,
            HeartbeatAlertingService heartbeatAlertingService) {
        this.configRepository = configRepository;
        this.alertingService = alertingService;
        this.heartbeatAlertingService = heartbeatAlertingService;
        alertCheckingExecutor = Executors.newSingleThreadExecutor();
    }

    void close() throws InterruptedException {
        closed = true;
        // shutdownNow() is needed here to send interrupt to alert checking thread
        alertCheckingExecutor.shutdownNow();
        if (!alertCheckingExecutor.awaitTermination(10, SECONDS)) {
            throw new IllegalStateException(
                    "Timed out waiting for alert checking thread to terminate");
        }
    }

    void checkForDeletedAlerts(String agentRollupId, String agentRollupDisplay)
            throws InterruptedException {
        try {
            alertingService.checkForDeletedAlerts(agentRollupId);
        } catch (InterruptedException e) {
            // probably shutdown requested
            throw e;
        } catch (Exception e) {
            logger.error("{} - {}", agentRollupDisplay, e.getMessage(), e);
        }
    }

    void checkForAllDeletedAlerts() throws InterruptedException {
        try {
            alertingService.checkForAllDeletedAlerts();
        } catch (InterruptedException e) {
            // probably shutdown requested
            throw e;
        } catch (Exception e) {
            logger.error("{}", e.getMessage(), e);
        }
    }

    void checkAggregateAlertsAsync(String agentId, String agentDisplay, long endTime)
            throws InterruptedException {
        List<AlertConfig> alertConfigs;
        try {
            alertConfigs = configRepository.getAlertConfigs(agentId);
        } catch (InterruptedException e) {
            // probably shutdown requested
            throw e;
        } catch (AgentConfigNotFoundException e) {
            // be lenient if agent_config table is messed up
            logger.debug(e.getMessage(), e);
            return;
        } catch (Exception e) {
            logger.error("{} - {}", agentDisplay, e.getMessage(), e);
            return;
        }
        List<AlertConfig> aggregateAlertConfigs = new ArrayList<>();
        for (AlertConfig alertConfig : alertConfigs) {
            AlertCondition condition = alertConfig.getCondition();
            if (isAggregateMetricCondition(condition)) {
                aggregateAlertConfigs.add(alertConfig);
            }
        }
        checkAlertsAsync(agentId, agentDisplay, endTime, aggregateAlertConfigs);
    }

    void checkGaugeAndHeartbeatAlertsAsync(String agentId, String agentDisplay, long endTime)
            throws InterruptedException {
        List<AlertConfig> alertConfigs;
        try {
            alertConfigs = configRepository.getAlertConfigs(agentId);
        } catch (InterruptedException e) {
            // probably shutdown requested
            throw e;
        } catch (AgentConfigNotFoundException e) {
            // be lenient if agent_config table is messed up
            logger.debug(e.getMessage(), e);
            return;
        } catch (Exception e) {
            logger.error("{} - {}", agentDisplay, e.getMessage(), e);
            return;
        }
        List<AlertConfig> gaugeAndHeartbeatAlertConfigs = new ArrayList<>();
        for (AlertConfig alertConfig : alertConfigs) {
            AlertCondition condition = alertConfig.getCondition();
            if (isGaugeMetricCondition(condition)
                    || condition.getValCase() == AlertCondition.ValCase.HEARTBEAT_CONDITION) {
                gaugeAndHeartbeatAlertConfigs.add(alertConfig);
            }
        }
        checkAlertsAsync(agentId, agentDisplay, endTime, gaugeAndHeartbeatAlertConfigs);
    }

    @Instrumentation.Transaction(transactionType = "Background", transactionName = "Check alert",
            traceHeadline = "Check alerts: {{0}}", timer = "check alerts",
            alreadyInTransactionBehavior = AlreadyInTransactionBehavior.CAPTURE_NEW_TRANSACTION)
    void checkAggregateAndGaugeAndHeartbeatAlertsAsync(String agentRollupId,
            String agentRollupDisplay, long endTime) throws InterruptedException {
        List<AlertConfig> alertConfigs;
        try {
            alertConfigs = configRepository.getAlertConfigs(agentRollupId);
        } catch (InterruptedException e) {
            // probably shutdown requested
            throw e;
        } catch (AgentConfigNotFoundException e) {
            // be lenient if agent_config table is messed up
            logger.debug(e.getMessage(), e);
            return;
        } catch (Exception e) {
            logger.error("{} - {}", agentRollupDisplay, e.getMessage(), e);
            return;
        }
        List<AlertConfig> aggregateAndGaugeAndHeartbeatAlertConfigs = new ArrayList<>();
        for (AlertConfig alertConfig : alertConfigs) {
            AlertCondition condition = alertConfig.getCondition();
            if (condition.getValCase() == AlertCondition.ValCase.METRIC_CONDITION
                    || condition.getValCase() == AlertCondition.ValCase.HEARTBEAT_CONDITION) {
                aggregateAndGaugeAndHeartbeatAlertConfigs.add(alertConfig);
            }
        }
        checkAlertsAsync(agentRollupId, agentRollupDisplay, endTime,
                aggregateAndGaugeAndHeartbeatAlertConfigs);
    }

    private void checkAlertsAsync(String agentRollupId, String agentRollupDisplay, long endTime,
            List<AlertConfig> alertConfigs) {
        if (closed) {
            return;
        }
        alertCheckingExecutor.execute(() -> {
            for (AlertConfig alertConfig : alertConfigs) {
                try {
                    checkAlert(agentRollupId, agentRollupDisplay, endTime, alertConfig);
                } catch (InterruptedException e) {
                    // probably shutdown requested (see close method above)
                    logger.debug(e.getMessage(), e);
                    return;
                } catch (Throwable t) {
                    logger.error("{} - {}", agentRollupDisplay, t.getMessage(), t);
                }
            }
        });
    }

    private void checkAlert(String agentRollupId, String agentDisplay, long endTime,
            AlertConfig alertConfig) throws Exception {
        AlertCondition alertCondition = alertConfig.getCondition();
        switch (alertCondition.getValCase()) {
            case METRIC_CONDITION:
                alertingService.checkMetricAlert(
                        configRepository.getCentralAdminGeneralConfig().centralDisplayName(),
                        agentRollupId, agentDisplay, alertConfig,
                        alertCondition.getMetricCondition(), endTime);
                break;
            case HEARTBEAT_CONDITION:
                if (stopwatch.elapsed(MINUTES) >= 4) {
                    // give agents plenty of time to re-connect after central start-up, needs to be
                    // at least enough time for grpc max reconnect backoff which is 2 minutes
                    // +/- 20% jitter (see io.grpc.internal.ExponentialBackoffPolicy) but better to
                    // give a bit extra (4 minutes above) to avoid false heartbeat alert
                    heartbeatAlertingService.checkHeartbeatAlert(agentRollupId, agentDisplay,
                            alertConfig, alertCondition.getHeartbeatCondition(), endTime);
                }
                break;
            default:
                throw new IllegalStateException(
                        "Unexpected alert condition: " + alertCondition.getValCase().name());
        }
    }

    private static boolean isAggregateMetricCondition(AlertCondition alertCondition) {
        if (alertCondition.getValCase() != AlertCondition.ValCase.METRIC_CONDITION) {
            return false;
        }
        String metric = alertCondition.getMetricCondition().getMetric();
        return metric.startsWith("transaction:") || metric.startsWith("error:");
    }

    private static boolean isGaugeMetricCondition(AlertCondition alertCondition) {
        return alertCondition.getValCase() == AlertCondition.ValCase.METRIC_CONDITION
                && alertCondition.getMetricCondition().getMetric().startsWith("gauge:");
    }
}
