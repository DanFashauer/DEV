import { NextResponse } from "next/server";
import { 
  requireAdminAuth, 
  adminSuccess, 
  adminError 
} from "@/lib/adminAuth";
import { createLocationStore } from "@/lib/location/store";

export const dynamic = "force-dynamic";

/**
 * Admin Location API
 * 
 * Returns the last known location for a device.
 * Requires admin authentication.
 * 
 * Security:
 * - JWT/OIDC authentication (primary)
 * - API key authentication (development fallback)
 * - Timing-safe comparison to prevent timing attacks
 * - Rate limiting (future)
 * - Fails closed if API key not configured in production
 */
export async function GET(request: Request) {
  // Check authentication
  const authError = await requireAdminAuth(request as any);
  if (authError) {
    return authError;
  }

  const url = new URL(request.url);
  const deviceId = url.searchParams.get("deviceId");
  if (!deviceId) {
    return adminError("deviceId required", 400);
  }

  const store = await createLocationStore();
  const last = await store.getLast(deviceId);

  return adminSuccess({ deviceId, last });
}
