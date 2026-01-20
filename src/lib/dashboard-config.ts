/**
 * Performance Dashboard Configuration
 * Orbit PG - Real-time Performance Monitoring
 * 
 * This file defines metrics, charts, and dashboard layout
 * Can be imported by monitoring services (Grafana, Datadog, etc.)
 */

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'timeseries' | 'gauge' | 'stat' | 'table' | 'heatmap';
  metrics: string[];
  position: { x: number; y: number; width: number; height: number };
  thresholds?: { value: number; color: string }[];
}

export interface Dashboard {
  id: string;
  title: string;
  description: string;
  refresh: string;
  widgets: DashboardWidget[];
}

/**
 * Main Performance Dashboard
 */
export const performanceDashboard: Dashboard = {
  id: 'orbit-performance',
  title: 'Orbit PG - Performance Overview',
  description: 'Real-time API performance and system metrics',
  refresh: '30s',
  widgets: [
    // Response Time Chart
    {
      id: 'response-time',
      title: 'API Response Time',
      type: 'timeseries',
      metrics: ['response.time.p50', 'response.time.p95', 'response.time.p99'],
      position: { x: 0, y: 0, width: 12, height: 8 },
      thresholds: [
        { value: 500, color: 'green' },
        { value: 1000, color: 'yellow' },
        { value: 2000, color: 'red' },
      ],
    },

    // Request Rate
    {
      id: 'request-rate',
      title: 'Requests per Second',
      type: 'timeseries',
      metrics: ['request.rate'],
      position: { x: 12, y: 0, width: 6, height: 8 },
    },

    // Error Rate
    {
      id: 'error-rate',
      title: 'Error Rate (%)',
      type: 'timeseries',
      metrics: ['error.rate'],
      position: { x: 18, y: 0, width: 6, height: 8 },
      thresholds: [
        { value: 1, color: 'green' },
        { value: 5, color: 'yellow' },
        { value: 10, color: 'red' },
      ],
    },

    // Database Latency
    {
      id: 'db-latency',
      title: 'Database Query Latency',
      type: 'timeseries',
      metrics: ['database.latency.p50', 'database.latency.p95', 'database.latency.p99'],
      position: { x: 0, y: 8, width: 12, height: 8 },
      thresholds: [
        { value: 100, color: 'green' },
        { value: 500, color: 'yellow' },
        { value: 1000, color: 'red' },
      ],
    },

    // Redis Cache Hit Rate
    {
      id: 'cache-hit-rate',
      title: 'Redis Cache Hit Rate (%)',
      type: 'gauge',
      metrics: ['cache.hit.rate'],
      position: { x: 12, y: 8, width: 6, height: 8 },
      thresholds: [
        { value: 50, color: 'red' },
        { value: 75, color: 'yellow' },
        { value: 90, color: 'green' },
      ],
    },

    // Active Connections
    {
      id: 'active-connections',
      title: 'Active Connections',
      type: 'stat',
      metrics: ['connections.active'],
      position: { x: 18, y: 8, width: 6, height: 4 },
    },

    // Memory Usage
    {
      id: 'memory-usage',
      title: 'Memory Usage (%)',
      type: 'gauge',
      metrics: ['memory.usage.percent'],
      position: { x: 18, y: 12, width: 6, height: 4 },
      thresholds: [
        { value: 70, color: 'green' },
        { value: 85, color: 'yellow' },
        { value: 95, color: 'red' },
      ],
    },

    // Top Endpoints by Response Time
    {
      id: 'slow-endpoints',
      title: 'Slowest Endpoints',
      type: 'table',
      metrics: ['response.time.by.endpoint'],
      position: { x: 0, y: 16, width: 12, height: 8 },
    },

    // Error Breakdown
    {
      id: 'error-breakdown',
      title: 'Errors by Type',
      type: 'table',
      metrics: ['error.count.by.type'],
      position: { x: 12, y: 16, width: 12, height: 8 },
    },
  ],
};

/**
 * Security Monitoring Dashboard
 */
export const securityDashboard: Dashboard = {
  id: 'orbit-security',
  title: 'Orbit PG - Security Monitoring',
  description: 'Security events, threats, and compliance',
  refresh: '1m',
  widgets: [
    // Failed Auth Attempts
    {
      id: 'failed-auth',
      title: 'Failed Authentication Attempts',
      type: 'timeseries',
      metrics: ['auth.failed.count'],
      position: { x: 0, y: 0, width: 8, height: 8 },
      thresholds: [
        { value: 5, color: 'green' },
        { value: 10, color: 'yellow' },
        { value: 20, color: 'red' },
      ],
    },

    // Rate Limit Violations
    {
      id: 'rate-limit-violations',
      title: 'Rate Limit Violations',
      type: 'timeseries',
      metrics: ['rate.limit.violations'],
      position: { x: 8, y: 0, width: 8, height: 8 },
    },

    // Security Events
    {
      id: 'security-events',
      title: 'Security Events by Severity',
      type: 'heatmap',
      metrics: ['security.events.by.severity'],
      position: { x: 16, y: 0, width: 8, height: 8 },
    },

    // Blocked IPs
    {
      id: 'blocked-ips',
      title: 'Blocked IP Addresses',
      type: 'stat',
      metrics: ['blocked.ips.count'],
      position: { x: 0, y: 8, width: 6, height: 4 },
    },

    // Active Blacklisted Users
    {
      id: 'blacklisted-users',
      title: 'Blacklisted Users',
      type: 'stat',
      metrics: ['blacklisted.users.count'],
      position: { x: 6, y: 8, width: 6, height: 4 },
    },

    // SQL/NoSQL Injection Attempts
    {
      id: 'injection-attempts',
      title: 'Injection Attack Attempts',
      type: 'timeseries',
      metrics: ['injection.attempts'],
      position: { x: 12, y: 8, width: 12, height: 8 },
    },

    // Top Attack Sources
    {
      id: 'attack-sources',
      title: 'Top Attack Source IPs',
      type: 'table',
      metrics: ['attacks.by.ip'],
      position: { x: 0, y: 12, width: 12, height: 8 },
    },

    // Admin Actions
    {
      id: 'admin-actions',
      title: 'Admin Actions Log',
      type: 'table',
      metrics: ['admin.actions'],
      position: { x: 12, y: 16, width: 12, height: 8 },
    },
  ],
};

/**
 * Business Metrics Dashboard
 */
export const businessDashboard: Dashboard = {
  id: 'orbit-business',
  title: 'Orbit PG - Business Metrics',
  description: 'Bookings, payments, and user activity',
  refresh: '5m',
  widgets: [
    // Bookings Created
    {
      id: 'bookings-created',
      title: 'Bookings Created',
      type: 'timeseries',
      metrics: ['booking.created.count'],
      position: { x: 0, y: 0, width: 8, height: 8 },
    },

    // Booking Success Rate
    {
      id: 'booking-success-rate',
      title: 'Booking Success Rate (%)',
      type: 'gauge',
      metrics: ['booking.success.rate'],
      position: { x: 8, y: 0, width: 8, height: 8 },
      thresholds: [
        { value: 80, color: 'red' },
        { value: 90, color: 'yellow' },
        { value: 95, color: 'green' },
      ],
    },

    // Payment Success Rate
    {
      id: 'payment-success-rate',
      title: 'Payment Success Rate (%)',
      type: 'gauge',
      metrics: ['payment.success.rate'],
      position: { x: 16, y: 0, width: 8, height: 8 },
      thresholds: [
        { value: 85, color: 'red' },
        { value: 92, color: 'yellow' },
        { value: 97, color: 'green' },
      ],
    },

    // Active Users
    {
      id: 'active-users',
      title: 'Active Users (Last 24h)',
      type: 'stat',
      metrics: ['users.active.24h'],
      position: { x: 0, y: 8, width: 6, height: 4 },
    },

    // New Registrations
    {
      id: 'new-registrations',
      title: 'New User Registrations',
      type: 'timeseries',
      metrics: ['user.registered.count'],
      position: { x: 6, y: 8, width: 10, height: 8 },
    },

    // Revenue Trends
    {
      id: 'revenue',
      title: 'Revenue (₹)',
      type: 'timeseries',
      metrics: ['revenue.total'],
      position: { x: 16, y: 8, width: 8, height: 8 },
    },

    // Property Views
    {
      id: 'property-views',
      title: 'Property Views',
      type: 'timeseries',
      metrics: ['property.views.count'],
      position: { x: 0, y: 16, width: 8, height: 8 },
    },

    // Reviews Created
    {
      id: 'reviews-created',
      title: 'Reviews Created',
      type: 'timeseries',
      metrics: ['review.created.count'],
      position: { x: 8, y: 16, width: 8, height: 8 },
    },

    // Average Rating
    {
      id: 'avg-rating',
      title: 'Average Property Rating',
      type: 'gauge',
      metrics: ['property.rating.avg'],
      position: { x: 16, y: 16, width: 8, height: 8 },
      thresholds: [
        { value: 3.5, color: 'red' },
        { value: 4.0, color: 'yellow' },
        { value: 4.5, color: 'green' },
      ],
    },
  ],
};

/**
 * Grafana dashboard JSON export
 */
export function exportToGrafana(dashboard: Dashboard) {
  return {
    dashboard: {
      id: null,
      uid: dashboard.id,
      title: dashboard.title,
      description: dashboard.description,
      tags: ['orbit-pg', 'monitoring'],
      timezone: 'browser',
      refresh: dashboard.refresh,
      panels: dashboard.widgets.map((widget, index) => ({
        id: index + 1,
        title: widget.title,
        type: widget.type === 'timeseries' ? 'graph' : widget.type,
        gridPos: widget.position,
        targets: widget.metrics.map((metric) => ({
          expr: metric,
          legendFormat: metric,
        })),
        ...(widget.thresholds && {
          fieldConfig: {
            defaults: {
              thresholds: {
                mode: 'absolute',
                steps: widget.thresholds.map((t) => ({
                  value: t.value,
                  color: t.color,
                })),
              },
            },
          },
        }),
      })),
    },
    overwrite: false,
  };
}

/**
 * Datadog dashboard JSON export
 */
export function exportToDatadog(dashboard: Dashboard) {
  return {
    title: dashboard.title,
    description: dashboard.description,
    layout_type: 'ordered',
    widgets: dashboard.widgets.map((widget) => ({
      definition: {
        title: widget.title,
        type: widget.type === 'timeseries' ? 'timeseries' : widget.type,
        requests: widget.metrics.map((metric) => ({
          q: metric,
          display_type: 'line',
        })),
      },
    })),
  };
}

export default {
  performanceDashboard,
  securityDashboard,
  businessDashboard,
  exportToGrafana,
  exportToDatadog,
};
