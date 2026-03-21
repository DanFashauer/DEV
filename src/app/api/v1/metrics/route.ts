/**
 * Metrics API v1
 * GET /api/v1/metrics - Get performance and usage metrics in Prometheus format
 * 
 * Exposes metrics for monitoring, alerting, and performance analysis
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiKey } from '@/lib/utils/apiKeyAuth';

export const dynamic = 'force-dynamic';

// Simple in-memory metrics store
const metrics = {
  requestsTotal: 0,
  requestsError: 0,
  requestsSuccess: 0,
  requestDurationMs: [] as number[],
  rateLimitHits: 0,
  sessionCreated: 0,
  sessionExpired: 0,
  locationReports: 0,
  policyMatches: 0,
  webhookDeliveries: 0,
  webhookFailures: 0,
};

// Global middleware to track metrics
export function trackMetric(name: keyof typeof metrics, value: number = 1) {
  if (typeof metrics[name] === 'number') {
    (metrics as any)[name] += value;
  } else if (Array.isArray(metrics[name])) {
    (metrics[name] as any[]).push(value);
  }
}

function calculatePercentile(arr: number[], percentile: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export async function GET(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    const durations = metrics.requestDurationMs;
    const p50 = calculatePercentile(durations, 50);
    const p95 = calculatePercentile(durations, 95);
    const p99 = calculatePercentile(durations, 99);
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Prometheus format output
    let prometheusMetrics = `# HELP signalgrid_requests_total Total HTTP requests
# TYPE signalgrid_requests_total counter
signalgrid_requests_total{status="all"} ${metrics.requestsTotal}
signalgrid_requests_total{status="success"} ${metrics.requestsSuccess}
signalgrid_requests_total{status="error"} ${metrics.requestsError}

# HELP signalgrid_request_duration_ms Request duration in milliseconds
# TYPE signalgrid_request_duration_ms histogram
signalgrid_request_duration_ms_p50 ${p50.toFixed(2)}
signalgrid_request_duration_ms_p95 ${p95.toFixed(2)}
signalgrid_request_duration_ms_p99 ${p99.toFixed(2)}
signalgrid_request_duration_ms_avg ${avgDuration.toFixed(2)}

# HELP signalgrid_rate_limit_hits Rate limit hits
# TYPE signalgrid_rate_limit_hits counter
signalgrid_rate_limit_hits ${metrics.rateLimitHits}

# HELP signalgrid_sessions_created Sessions created
# TYPE signalgrid_sessions_created counter
signalgrid_sessions_created ${metrics.sessionCreated}

# HELP signalgrid_sessions_expired Sessions expired
# TYPE signalgrid_sessions_expired counter
signalgrid_sessions_expired ${metrics.sessionExpired}

# HELP signalgrid_location_reports Location reports received
# TYPE signalgrid_location_reports counter
signalgrid_location_reports ${metrics.locationReports}

# HELP signalgrid_policy_matches Policy matches
# TYPE signalgrid_policy_matches counter
signalgrid_policy_matches ${metrics.policyMatches}

# HELP signalgrid_webhook_deliveries Webhook deliveries
# TYPE signalgrid_webhook_deliveries counter
signalgrid_webhook_deliveries{status="success"} ${metrics.webhookDeliveries}
signalgrid_webhook_deliveries{status="failed"} ${metrics.webhookFailures}

# HELP signalgrid_uptime_seconds Uptime in seconds
# TYPE signalgrid_uptime_seconds gauge
signalgrid_uptime_seconds ${process.uptime().toFixed(2)}
`;

    return new Response(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[MetricsAPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

export { metrics, trackMetric };
