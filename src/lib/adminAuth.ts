import { NextRequest, NextResponse } from "next/server";
import { authenticateAdminRequest } from "./auth";
import { verifyStepUpSession, StepUpChallenge, createStepUpSession } from "./auth/stepUpStore";
import { rateLimitPresets } from "./utils/rateLimit";

/**
 * Get client IP from request with proxy trust validation
 * 
 * Only trusts x-forwarded-for if running behind a trusted proxy.
 * This prevents IP spoofing attacks used to bypass rate limiting.
 * 
 * Set TRUSTED_PROXIES environment variable to comma-separated list of trusted proxy IPs
 */
function getClientIp(request: NextRequest): string {
  const trustedProxies = process.env.TRUSTED_PROXIES?.split(',').map(ip => ip.trim()) || [];
  
  // If trust-proxy is configured, use x-forwarded-for
  if (trustedProxies.length > 0) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      // Get the first IP (original client), others are proxy IPs
      const clientIp = forwarded.split(",")[0].trim();
      // Basic IP format validation
      if (/^[\d.]+$/.test(clientIp) || /^[\da-f:]+$/.test(clientIp)) {
        return clientIp;
      }
    }
    
    const realIp = request.headers.get("x-real-ip");
    if (realIp && (/^[\d.]+$/.test(realIp) || /^[\da-f:]+$/.test(realIp))) {
      return realIp;
    }
  }
  
  // Fallback to direct connection IP
  const directIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(',')[0];
  return directIp || "unknown";
}

/**
 * Admin API rate limiting check
 * Returns true if request is allowed, false if rate limited
 */
async function checkAdminRateLimit(clientIp: string): Promise<boolean> {
  try {
    const result = await rateLimitPresets.normal.check(clientIp);
    return result.success;
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    return true;
  }
}

/**
 * Audit logging helper (does not log secrets)
 */
function logAuthAttempt(
  request: NextRequest,
  path: string,
  authorized: boolean,
  reason?: string
): void {
  const timestamp = new Date().toISOString();
  const ip = getClientIp(request);
  
  // Never log the API key itself
  console.log(
    JSON.stringify({
      timestamp,
      event: "admin_api_access",
      path,
      ip,
      authorized,
      reason: reason || (authorized ? "authorized" : "unauthorized"),
      userAgent: request.headers.get("user-agent") || "unknown",
    })
  );
}

/**
 * Security headers for all responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Caching prevention
    "Cache-Control": "no-store, max-age=0, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    // Security headers
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };
}

/**
 * Require admin authentication for a request
 * Supports both JWT (OIDC) and API key authentication.
 * Returns NextResponse with error if not authorized, null if authorized
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse<{ error: string }> | null> {
  const path = new URL(request.url).pathname;
  
  // 1. Check rate limit first (before auth to prevent brute force)
  const clientIp = getClientIp(request);
  if (!(await checkAdminRateLimit(clientIp))) {
    logAuthAttempt(request, path, false, "rate_limited");
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": "60",
          ...getSecurityHeaders(),
        },
      }
    );
  }
  
  // 2. Authenticate through shared admin auth path
  const auth = await authenticateAdminRequest(request);

  if (auth.authenticated) {
    logAuthAttempt(request, path, true, `authorized via ${auth.method}`);
    return null;
  }

  const errorMessage =
    auth.method === "jwt"
      ? auth.error || "Unauthorized: Invalid or missing authentication token"
      : "Unauthorized: Invalid or missing API key";

  logAuthAttempt(request, path, false, auth.error || "unauthorized");
  return NextResponse.json(
    { error: errorMessage },
    {
      status: 401,
      headers: getSecurityHeaders(),
    }
  );
}

/**
 * Create a standardized error response with security headers
 */
export function adminError(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error: message },
    { 
      status,
      headers: getSecurityHeaders(),
    }
  );
}

/**
 * Create a standardized success response with security headers
 */
export function adminSuccess(data: unknown): NextResponse {
  return NextResponse.json(data, {
    headers: getSecurityHeaders(),
  });
}

// ============================================================================
// Step-Up Authentication Middleware
// ============================================================================

/**
 * Get user ID from authenticated request
 * Returns null if not authenticated
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // Check for user ID in custom header (set after authentication)
  const userId = request.headers.get("x-user-id");
  if (userId) {
    return userId;
  }
  
  // For API key mode, use a derived key (not the actual key)
  const apiKey = request.headers.get("x-admin-api-key");
  if (apiKey) {
    // Use a hash of the API key as a stable identifier
    const hash = require("crypto").createHash("sha256").update(apiKey).digest("hex").substring(0, 16);
    return `api-key-user:${hash}`;
  }
  
  return null;
}

/**
 * Get request ID from request or generate one
 * Request ID is used to bind step-up sessions to specific requests
 */
export function getRequestId(request: NextRequest): string {
  // Check if request has existing request ID
  const existingId = request.headers.get("x-request-id");
  if (existingId) {
    return existingId;
  }
  
  // Generate new request ID
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Require step-up authentication for high-risk operations
 * 
 * @param request - The incoming request
 * @param challenge - The type of step-up challenge required
 * @returns NextResponse with error if step-up required but not verified, null if authorized
 */
export async function requireStepUpAuth(
  request: NextRequest,
  challenge: StepUpChallenge
): Promise<NextResponse | null> {
  const path = new URL(request.url).pathname;
  const userId = getUserIdFromRequest(request);
  const requestId = getRequestId(request);
  
  if (!userId) {
    // Can't require step-up if we don't know who the user is
    return null;
  }
  
  // Check for step-up session in header
  const stepUpSessionId = request.headers.get("x-step-up-session-id");
  
  if (!stepUpSessionId) {
    // No step-up session - require it
    console.log(`[StepUp] Step-up required for ${challenge} on ${path}, no session provided`);
    return NextResponse.json(
      { 
        error: "Step-up authentication required for this operation",
        stepUpRequired: true,
        challenge,
      },
      { 
        status: 401,
        headers: {
          ...getSecurityHeaders(),
          "X-Step-Up-Required": "true",
          "X-Step-Up-Challenge": challenge,
        },
      }
    );
  }
  
  // Verify the step-up session
  const session = await verifyStepUpSession(stepUpSessionId, userId, requestId, challenge);
  
  if (!session) {
    // Invalid or expired step-up session
    console.log(`[StepUp] Invalid step-up session ${stepUpSessionId} for ${challenge}`);
    return NextResponse.json(
      { 
        error: "Step-up session invalid or expired. Please re-authenticate.",
        stepUpRequired: true,
        challenge,
      },
      { 
        status: 401,
        headers: {
          ...getSecurityHeaders(),
          "X-Step-Up-Required": "true",
        },
      }
    );
  }
  
  // Step-up verified - continue
  console.log(`[StepUp] Step-up verified for user ${userId}, challenge: ${challenge}`);
  return null;
}

/**
 * Initiate step-up authentication flow
 * This creates a pending step-up session that can be verified via WebAuthn
 * 
 * @param userId - The user requesting step-up
 * @param requestId - The current request ID
 * @param challenge - The type of step-up challenge
 * @returns The created step-up session
 */
export async function initiateStepUp(
  userId: string,
  requestId: string,
  challenge: StepUpChallenge
): Promise<{ stepUpSessionId: string; expiresAt: string }> {
  const session = await createStepUpSession(userId, requestId, challenge);
  return {
    stepUpSessionId: session.stepUpSessionId,
    expiresAt: session.expiresAt,
  };
}
