import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Stats API Route
 * 
 * Returns mock statistics for the admin dashboard.
 * In production, this would connect to actual data sources.
 * 
 * Requires API key authentication via X-Admin-Api-Key header.
 */

// Get API key from environment (in production, use environment variable)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "dev-admin-key-12345";

/**
 * Validate API key from request headers
 */
function validateApiKey(request: NextRequest): boolean {
  const providedKey = request.headers.get("X-Admin-Api-Key");
  return providedKey === ADMIN_API_KEY;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Check authentication
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing API key" },
      { status: 401 }
    );
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

  // Return with cache control headers to prevent caching
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}
