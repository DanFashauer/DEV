import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { authenticateRequest, getAuthConfig } from "./auth";
import { verifyStepUpSession, StepUpChallenge, requiresStepUp, createStepUpSession } from "./auth/stepUpStore";
import { checkRateLimit, rateLimitPresets } from "./utils/rateLimit";

// Rate limiting configuration
const RATE_LIMIT_MAX = 30; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Get the admin API key from environment
 * Both development and production require explicit configuration
 */
function getAdminApiKey(): string {
  const envKey = process.env.ADMIN_API_KEY?.trim();
  
  if (!envKey || envKey.length === 0) {
    const errorMsg = process.env.NODE_ENV === "production"
      ? "[SECURITY] CRITICAL: ADMIN_API_KEY must be set in production"
      : "[SECURITY] ADMIN_API_KEY must be explicitly set (export ADMIN_API_KEY='your-key')";
    throw new Error(errorMsg);
  }
  
  if (envKey.length < 32) {
    console.warn("[SECURITY] WARNING: ADMIN_API_KEY should be 32+ characters");
  }
  
  return envKey;
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by always comparing full length
 */
function timingSafeCompare(a: string | null, b: string | null): boolean {
  if (!a || !b) {
    return false;
  }
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  // If lengths differ, fail immediately (but do constant-time compare anyway)
  if (bufA.length !== bufB.length) {
    // Do a constant-time comparison of mismatched lengths to avoid leaking length info
    // Compare against itself to waste time without leaking
    timingSafeEqual(bufA, bufA);
    return false;
  }
  
  return timingSafeEqual(bufA, bufB);
}

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
  const directIp = request.ip || request.headers.get("cf-connecting-ip");
  return directIp || "unknown";
}

/**
 * Rate limiting check
 * Returns true if request is allowed, false if rate limited
 */
async function checkRateLimit(clientIp: string): Promise<boolean> {
  try {
    const result = await rateLimitPresets.normal.check(clientIp);
    return result.success;
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Allow request on rate limit check failure to avoid blocking legitimate users
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
  const rateLimitKey = `admin:${getClientIp(request)}`;
  if (!(await checkRateLimit(rateLimitKey))) {
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
  
  // 2. Try JWT authentication first (if OIDC is configured)
  const authConfig = getAuthConfig();
  
  if (authConfig.mode === 'jwt') {
    const auth = await authenticateRequest(request);
    
    if (auth.authenticated) {
      logAuthAttempt(request, path, true, `authorized via ${auth.method}`);
      return null;
    }
    
    // JWT failed - check if we should fall back to API key
    const apiKey = request.headers.get("x-admin-api-key");
    if (apiKey) {
      // Try API key as fallback
      const adminApiKey = getAdminApiKey();
      if (adminApiKey && timingSafeCompare(apiKey, adminApiKey)) {
        logAuthAttempt(request, path, true, "authorized via api-key fallback");
        return null;
      }
    }
    
    logAuthAttempt(request, path, false, "invalid JWT");
    return NextResponse.json(
      { error: auth.error || "Unauthorized: Invalid or missing authentication token" },
      { 
        status: 401,
        headers: getSecurityHeaders(),
      }
    );
  }
  
  // 3. API key mode (development fallback)
  const adminApiKey = getAdminApiKey();
  
  // If no API key configured in production, fail closed
  if (!adminApiKey) {
    logAuthAttempt(request, path, false, "misconfiguration");
    console.error(
      `[SECURITY] Admin API key not configured in ${process.env.NODE_ENV} environment`
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: getSecurityHeaders(),
      }
    );
  }
  
  // Get API key from request header
  const providedKey = request.headers.get("x-admin-api-key");
  
  // Timing-safe comparison
  if (!timingSafeCompare(providedKey, adminApiKey)) {
    logAuthAttempt(request, path, false, "invalid_key");
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing API key" },
      { 
        status: 401,
        headers: getSecurityHeaders(),
      }
    );
  }
  
  // Authorized
  logAuthAttempt(request, path, true, "authorized");
  return null;
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
