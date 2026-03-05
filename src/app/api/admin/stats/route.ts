import { NextRequest } from "next/server";
import { 
  requireAdminAuth, 
  adminSuccess, 
  adminError,
  getSecurityHeaders 
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Admin Stats API Route
 * 
 * Returns mock statistics for the admin dashboard.
 * In production, this would connect to actual data sources.
 * 
 * Security features:
 * - JWT/OIDC authentication (primary)
 * - API key authentication (development fallback)
 * - Timing-safe comparison to prevent timing attacks
 * - Rate limiting (30 requests/minute per IP)
 * - Comprehensive cache control headers
 * - Audit logging (no secrets logged)
 * - Fails closed if API key not configured in production
 */
export async function GET(request: NextRequest) {
  // Check authentication (includes rate limiting)
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  // Mock data - replace with actual database queries in production
  const stats = {
    totalSessions: 1247,
    activeSessions: 12,
    failedAuthAttempts: 23,
    averageSessionDuration: 45, // minutes
    devices: {
      total: 50,
      active: 42,
      offline: 8,
    },
    providers: {
      badgeReaders: 3,
      identityProviders: 2,
    },
    recentActivity: [
      { timestamp: new Date().toISOString(), event: "User authenticated", status: "success" },
      { timestamp: new Date(Date.now() - 60000).toISOString(), event: "Session started", status: "success" },
      { timestamp: new Date(Date.now() - 120000).toISOString(), event: "Badge scan", status: "success" },
      { timestamp: new Date(Date.now() - 180000).toISOString(), event: "Authentication failed", status: "error" },
      { timestamp: new Date(Date.now() - 240000).toISOString(), event: "Session ended", status: "info" },
    ],
  };

  return adminSuccess(stats);
}
