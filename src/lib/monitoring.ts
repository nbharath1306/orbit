/**
 * Monitoring Configuration
 * Orbit PG - Performance & Security Monitoring
 * 
 * Features:
 * - Log aggregation
 * - Performance metrics
 * - Security alerts
 * - Error tracking
 */

import { logger } from './logger';

// Metric thresholds for alerts
export const ALERT_THRESHOLDS = {
  // Performance thresholds
  RESPONSE_TIME_MS: 1000, // Alert if > 1s
  ERROR_RATE_PERCENT: 5, // Alert if > 5%
  CPU_PERCENT: 80, // Alert if > 80%
  MEMORY_PERCENT: 85, // Alert if > 85%
  DATABASE_LATENCY_MS: 500, // Alert if > 500ms

  // Security thresholds
  FAILED_AUTH_ATTEMPTS: 10, // Per user per hour
  RATE_LIMIT_VIOLATIONS: 50, // Per IP per hour
  BLACKLIST_ATTEMPTS: 3, // Per IP per day

  // Business metrics
  BOOKING_FAILURE_RATE: 10, // Alert if > 10%
  PAYMENT_FAILURE_RATE: 15, // Alert if > 15%
};

// Metrics collection
interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush metrics every 60 seconds
    this.flushInterval = setInterval(() => this.flush(), 60000);
  }

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    });

    // Check thresholds and alert if needed
    this.checkThresholds(name, value);
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThresholds(name: string, value: number) {
    const alerts: Record<string, number> = {
      'response.time': ALERT_THRESHOLDS.RESPONSE_TIME_MS,
      'database.latency': ALERT_THRESHOLDS.DATABASE_LATENCY_MS,
      'cpu.usage': ALERT_THRESHOLDS.CPU_PERCENT,
      'memory.usage': ALERT_THRESHOLDS.MEMORY_PERCENT,
      'error.rate': ALERT_THRESHOLDS.ERROR_RATE_PERCENT,
    };

    const threshold = alerts[name];
    if (threshold && value > threshold) {
      this.triggerAlert(name, value, threshold);
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(metric: string, value: number, threshold: number) {
    logger.warn('Metric threshold exceeded', {
      metric,
      value,
      threshold,
      severity: 'high',
    });

    // In production, send to alerting service (PagerDuty, Slack, etc.)
    // this.sendToAlertingService({ metric, value, threshold });
  }

  /**
   * Flush metrics to storage/monitoring service
   */
  private flush() {
    if (this.metrics.length === 0) return;

    // In production, send to monitoring service (Datadog, New Relic, etc.)
    logger.debug('Flushing metrics', { count: this.metrics.length });

    // For now, just log summary
    const summary = this.getSummary();
    logger.info('Metrics summary', summary);

    // Clear metrics after flush
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const byName: Record<string, number[]> = {};

    this.metrics.forEach((m) => {
      if (!byName[m.name]) byName[m.name] = [];
      byName[m.name].push(m.value);
    });

    const summary: Record<string, any> = {};
    Object.keys(byName).forEach((name) => {
      const values = byName[name];
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99),
      };
    });

    return summary;
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton metrics collector
export const metrics = new MetricsCollector();

/**
 * Middleware to track response time
 */
export function trackResponseTime(route: string, duration: number) {
  metrics.record('response.time', duration, { route });

  if (duration > ALERT_THRESHOLDS.RESPONSE_TIME_MS) {
    logger.warn('Slow response detected', {
      route,
      duration,
      threshold: ALERT_THRESHOLDS.RESPONSE_TIME_MS,
    });
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(operation: string, collection: string, duration: number) {
  metrics.record('database.latency', duration, { operation, collection });

  if (duration > ALERT_THRESHOLDS.DATABASE_LATENCY_MS) {
    logger.warn('Slow database query', {
      operation,
      collection,
      duration,
      threshold: ALERT_THRESHOLDS.DATABASE_LATENCY_MS,
    });
  }
}

/**
 * Track error rate
 */
export function trackError(type: string, route?: string) {
  metrics.record('error.count', 1, { type, route: route || 'unknown' });
}

/**
 * Track security events
 */
export function trackSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical') {
  metrics.record('security.event', 1, { event, severity });

  if (severity === 'high' || severity === 'critical') {
    logger.logSecurity(event, { severity });
  }
}

/**
 * Track business metrics
 */
export const businessMetrics = {
  bookingCreated: () => metrics.record('booking.created', 1),
  bookingFailed: () => metrics.record('booking.failed', 1),
  paymentSuccess: () => metrics.record('payment.success', 1),
  paymentFailed: () => metrics.record('payment.failed', 1),
  userRegistered: () => metrics.record('user.registered', 1),
  reviewCreated: () => metrics.record('review.created', 1),
};

/**
 * System health check
 */
export async function getSystemHealth() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percent: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
    },
    cpu: {
      user: process.cpuUsage().user / 1000000, // Convert to seconds
      system: process.cpuUsage().system / 1000000,
    },
  };

  // Check memory threshold
  if (health.memory.percent > ALERT_THRESHOLDS.MEMORY_PERCENT) {
    health.status = 'degraded';
    logger.warn('High memory usage', { percent: health.memory.percent });
  }

  return health;
}

/**
 * Alert configuration for different channels
 */
export const alertChannels = {
  /**
   * Send alert to Slack
   */
  slack: async (message: string, severity: string) => {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    try {
      // In production, send to Slack webhook
      logger.info('Slack alert', { message, severity });
    } catch (error: any) {
      logger.error('Failed to send Slack alert', { error: error.message });
    }
  },

  /**
   * Send alert to email
   */
  email: async (subject: string, body: string) => {
    if (!process.env.ALERT_EMAIL) return;

    try {
      // In production, send email via SendGrid/AWS SES
      logger.info('Email alert', { subject });
    } catch (error: any) {
      logger.error('Failed to send email alert', { error: error.message });
    }
  },

  /**
   * Send to PagerDuty
   */
  pagerduty: async (incident: any) => {
    if (!process.env.PAGERDUTY_API_KEY) return;

    try {
      // In production, send to PagerDuty API
      logger.info('PagerDuty alert', { incident });
    } catch (error: any) {
      logger.error('Failed to send PagerDuty alert', { error: error.message });
    }
  },
};

/**
 * Graceful shutdown
 */
export function shutdownMonitoring() {
  metrics.destroy();
  logger.info('Monitoring shutdown complete');
}

export default {
  metrics,
  trackResponseTime,
  trackDatabaseQuery,
  trackError,
  trackSecurityEvent,
  businessMetrics,
  getSystemHealth,
  alertChannels,
  shutdown: shutdownMonitoring,
};
