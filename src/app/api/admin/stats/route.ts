import { NextResponse } from "next/server";

/**
 * Admin Stats API Route
 * 
 * Returns mock statistics for the admin dashboard.
 * In production, this would connect to actual data sources.
 */
export async function GET() {
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

  return NextResponse.json(stats);
}
