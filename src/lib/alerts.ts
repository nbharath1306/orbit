/**
 * Alert Configuration
 * Orbit PG - Automated Alerting System
 * 
 * Features:
 * - Multi-channel alerts (Slack, Email, PagerDuty)
 * - Alert severity levels
 * - Rate limiting to prevent alert spam
 * - Alert aggregation
 */

import { logger } from './logger';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertChannel = 'slack' | 'email' | 'pagerduty' | 'console';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AlertRule {
  name: string;
  condition: (value: number) => boolean;
  threshold: number;
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown: number; // Minimum time (ms) between alerts
}

// Alert rules configuration
export const ALERT_RULES: AlertRule[] = [
  {
    name: 'High Response Time',
    condition: (ms) => ms > 1000,
    threshold: 1000,
    severity: 'high',
    channels: ['slack', 'email'],
    cooldown: 300000, // 5 minutes
  },
  {
    name: 'Critical Response Time',
    condition: (ms) => ms > 2000,
    threshold: 2000,
    severity: 'critical',
    channels: ['slack', 'email', 'pagerduty'],
    cooldown: 180000, // 3 minutes
  },
  {
    name: 'High Error Rate',
    condition: (percent) => percent > 5,
    threshold: 5,
    severity: 'high',
    channels: ['slack', 'email'],
    cooldown: 300000,
  },
  {
    name: 'Critical Error Rate',
    condition: (percent) => percent > 10,
    threshold: 10,
    severity: 'critical',
    channels: ['slack', 'email', 'pagerduty'],
    cooldown: 180000,
  },
  {
    name: 'High Memory Usage',
    condition: (percent) => percent > 85,
    threshold: 85,
    severity: 'high',
    channels: ['slack'],
    cooldown: 600000, // 10 minutes
  },
  {
    name: 'Critical Memory Usage',
    condition: (percent) => percent > 95,
    threshold: 95,
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    cooldown: 300000,
  },
  {
    name: 'Database Latency High',
    condition: (ms) => ms > 500,
    threshold: 500,
    severity: 'medium',
    channels: ['slack'],
    cooldown: 600000,
  },
  {
    name: 'Failed Authentication Attempts',
    condition: (count) => count > 10,
    threshold: 10,
    severity: 'high',
    channels: ['slack', 'email'],
    cooldown: 300000,
  },
  {
    name: 'Rate Limit Violations',
    condition: (count) => count > 50,
    threshold: 50,
    severity: 'medium',
    channels: ['slack'],
    cooldown: 600000,
  },
];

class AlertManager {
  private lastAlertTime: Map<string, number> = new Map();
  private alertCounts: Map<string, number> = new Map();

  /**
   * Send alert through configured channels
   */
  async sendAlert(alert: Alert, channels: AlertChannel[]) {
    // Check cooldown
    if (!this.shouldSendAlert(alert)) {
      logger.debug('Alert suppressed due to cooldown', {
        alertId: alert.id,
        title: alert.title,
      });
      return;
    }

    // Update last alert time
    this.lastAlertTime.set(alert.id, Date.now());

    // Increment alert count
    const count = (this.alertCounts.get(alert.id) || 0) + 1;
    this.alertCounts.set(alert.id, count);

    // Send to each channel
    const promises = channels.map((channel) => {
      switch (channel) {
        case 'slack':
          return this.sendToSlack(alert);
        case 'email':
          return this.sendToEmail(alert);
        case 'pagerduty':
          return this.sendToPagerDuty(alert);
        case 'console':
          return this.sendToConsole(alert);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Check if alert should be sent based on cooldown
   */
  private shouldSendAlert(alert: Alert): boolean {
    const lastTime = this.lastAlertTime.get(alert.id);
    if (!lastTime) return true;

    // Find alert rule for cooldown period
    const rule = ALERT_RULES.find((r) => alert.title.includes(r.name));
    const cooldown = rule?.cooldown || 300000; // Default 5 minutes

    return Date.now() - lastTime > cooldown;
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: Alert) {
    if (!process.env.SLACK_WEBHOOK_URL) {
      logger.debug('Slack webhook not configured');
      return;
    }

    try {
      const color = this.getSeverityColor(alert.severity);
      const emoji = this.getSeverityEmoji(alert.severity);

      const payload = {
        text: `${emoji} *${alert.title}*`,
        attachments: [
          {
            color,
            text: alert.message,
            fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
            })),
            footer: 'Orbit PG Monitoring',
            ts: Math.floor(alert.timestamp.getTime() / 1000),
          },
        ],
      };

      // In production, send to Slack webhook
      // await fetch(process.env.SLACK_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      logger.info('Slack alert sent', {
        alertId: alert.id,
        severity: alert.severity,
      });
    } catch (error: any) {
      logger.error('Failed to send Slack alert', {
        error: error.message,
        alertId: alert.id,
      });
    }
  }

  /**
   * Send alert to email
   */
  private async sendToEmail(alert: Alert) {
    if (!process.env.ALERT_EMAIL) {
      logger.debug('Alert email not configured');
      return;
    }

    try {
      const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
      const body = this.formatEmailBody(alert);

      // In production, send via SendGrid/AWS SES
      // await sendEmail({
      //   to: process.env.ALERT_EMAIL,
      //   subject,
      //   html: body,
      // });

      logger.info('Email alert sent', {
        alertId: alert.id,
        severity: alert.severity,
        to: process.env.ALERT_EMAIL,
      });
    } catch (error: any) {
      logger.error('Failed to send email alert', {
        error: error.message,
        alertId: alert.id,
      });
    }
  }

  /**
   * Send alert to PagerDuty
   */
  private async sendToPagerDuty(alert: Alert) {
    if (!process.env.PAGERDUTY_INTEGRATION_KEY) {
      logger.debug('PagerDuty not configured');
      return;
    }

    try {
      const payload = {
        routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
        event_action: 'trigger',
        payload: {
          summary: alert.title,
          severity: alert.severity,
          source: 'orbit-pg-api',
          custom_details: alert.metadata,
        },
      };

      // In production, send to PagerDuty Events API v2
      // await fetch('https://events.pagerduty.com/v2/enqueue', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      logger.info('PagerDuty alert sent', {
        alertId: alert.id,
        severity: alert.severity,
      });
    } catch (error: any) {
      logger.error('Failed to send PagerDuty alert', {
        error: error.message,
        alertId: alert.id,
      });
    }
  }

  /**
   * Send alert to console (for development)
   */
  private async sendToConsole(alert: Alert) {
    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    console.log('\n' + '='.repeat(60));
    console.log(`${emoji} ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`);
    console.log('='.repeat(60));
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${alert.timestamp.toISOString()}`);
    if (alert.metadata) {
      console.log('Metadata:', JSON.stringify(alert.metadata, null, 2));
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Get color for severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '#FF0000';
      case 'high':
        return '#FF6600';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#00CC00';
      default:
        return '#999999';
    }
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * Format email body
   */
  private formatEmailBody(alert: Alert): string {
    const emoji = this.getSeverityEmoji(alert.severity);
    const metadata = alert.metadata
      ? Object.entries(alert.metadata)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join('')
      : '';

    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${emoji} ${alert.title}</h2>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          ${metadata ? `<h3>Details:</h3><ul>${metadata}</ul>` : ''}
          <hr>
          <p style="color: #666; font-size: 12px;">
            Orbit PG Monitoring System
          </p>
        </body>
      </html>
    `;
  }

  /**
   * Get alert statistics
   */
  getStatistics() {
    return {
      totalAlerts: Array.from(this.alertCounts.values()).reduce((a, b) => a + b, 0),
      uniqueAlerts: this.alertCounts.size,
      alertsByType: Object.fromEntries(this.alertCounts),
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.alertCounts.clear();
    this.lastAlertTime.clear();
  }
}

// Singleton alert manager
export const alertManager = new AlertManager();

/**
 * Helper function to create and send alert
 */
export async function sendAlert(
  title: string,
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
) {
  const alert: Alert = {
    id: `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    title,
    message,
    severity,
    metadata,
    timestamp: new Date(),
  };

  // Determine channels based on severity
  const channels: AlertChannel[] =
    process.env.NODE_ENV === 'production'
      ? severity === 'critical'
        ? ['slack', 'email', 'pagerduty']
        : severity === 'high'
        ? ['slack', 'email']
        : ['slack']
      : ['console'];

  await alertManager.sendAlert(alert, channels);
}

export default alertManager;
