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
  // These include demo-friendly values for screenshots and live demos
  const stats = {
    // Core metrics
    totalSessions: 1247,
    activeSessions: 12,
    failedAuthAttempts: 23,
    averageSessionDuration: 45, // minutes
    
    // Device metrics
    devices: {
      total: 50,
      active: 42,
      offline: 8,
    },
    
    // Executive summary cards (for demo/pilot readiness)
    executiveSummary: {
      highRiskDevices: 3,
      incidentsCreated: 7,
      siemEventsSent: 156,
      quarantinedDevices: 2,
    },
    
    // Provider metrics
    providers: {
      badgeReaders: 3,
      identityProviders: 2,
    },
    
    // Recent activity
    recentActivity: [
      { timestamp: new Date().toISOString(), event: "User authenticated", status: "success" },
      { timestamp: new Date(Date.now() - 60000).toISOString(), event: "Session started", status: "success" },
      { timestamp: new Date(Date.now() - 120000).toISOString(), event: "Badge scan", status: "success" },
      { timestamp: new Date(Date.now() - 180000).toISOString(), event: "Authentication failed", status: "error" },
      { timestamp: new Date(Date.now() - 240000).toISOString(), event: "Session ended", status: "info" },
    ],
    
    // Demo scenarios (for seeded environments)
    demoScenarios: {
      healthcare: {
        name: "Healthcare - Shared iPad",
        description: "Nurse station tablet with shared badge access",
        riskLevel: "medium",
        lastAuth: new Date(Date.now() - 300000).toISOString(),
      },
      retail: {
        name: "Retail - POS Tablet",
        description: "Store checkout tablet with inventory access",
        riskLevel: "low",
        lastAuth: new Date(Date.now() - 600000).toISOString(),
      },
      logistics: {
        name: "Logistics - Warehouse Android",
        description: "Warehouse device with shipping permissions",
        riskLevel: "high",
        lastAuth: new Date(Date.now() - 900000).toISOString(),
      },
    },
  };

  return adminSuccess(stats);
}
