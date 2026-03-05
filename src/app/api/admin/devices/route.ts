import { NextRequest, NextResponse } from "next/server";
import { 
  requireAdminAuth, 
  adminSuccess, 
  adminError,
  getSecurityHeaders 
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Admin Devices API Route
 * 
 * Returns mock device data for the admin dashboard.
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

// GET /api/admin/devices - List all registered devices
export async function GET(request: NextRequest) {
  // Check authentication (includes rate limiting)
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  // Mock device data - replace with database query in production
  const devices = [
    {
      id: "device-001",
      name: "Kiosk Alpha",
      status: "active",
      lastSeen: "2026-02-18T05:00:00Z",
      osVersion: "17.2",
      appVersion: "1.0.0",
    },
    {
      id: "device-002",
      name: "Kiosk Beta",
      status: "inactive",
      lastSeen: "2026-02-17T12:30:00Z",
      osVersion: "17.2",
      appVersion: "1.0.0",
    },
    {
      id: "device-003",
      name: "Kiosk Gamma",
      status: "pending",
      lastSeen: "2026-02-18T04:45:00Z",
      osVersion: "17.1",
      appVersion: "0.9.5",
    },
  ];

  return adminSuccess({ devices });
}

// POST /api/admin/devices - Register a new device
export async function POST(request: NextRequest) {
  // Check authentication (includes rate limiting)
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const { name, deviceId } = body;

    if (!name || !deviceId) {
      return adminError("Missing required fields: name, deviceId", 400);
    }

    // In production, save to database
    const newDevice = {
      id: deviceId,
      name,
      status: "pending",
      lastSeen: new Date().toISOString(),
      osVersion: "unknown",
      appVersion: "unknown",
    };

    return adminSuccess({ device: newDevice });
  } catch {
    return adminError("Invalid request body", 400);
  }
}
