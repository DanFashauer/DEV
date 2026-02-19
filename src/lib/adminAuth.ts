import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";

// In-memory rate limit store (for single-instance deployments)
// In production with multiple instances, use Redis/Upstash
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX = 30; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Get the admin API key from environment
 * - In development: allows a dev default
 * - In production: fails if not configured
 */
function getAdminApiKey(): string | null {
  const envKey = process.env.ADMIN_API_KEY;
  
  if (envKey && envKey.length > 0) {
    return envKey;
  }
  
  // No key configured
  if (process.env.NODE_ENV === "production") {
    // In production, require explicit configuration
    return null;
  }
  
  // In development, allow fallback (but warn)
  return "dev-admin-key-12345";
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
 * Get client IP from request (handles proxies)
 */
function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Fallback - this might be the server IP in some configs
  return "unknown";
}

/**
 * Rate limiting check
 * Returns true if request is allowed, false if rate limited
 */
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    // Rate limited
    return false;
  }
  
  record.count++;
  return true;
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
 * Returns NextResponse with error if not authorized, null if authorized
 */
export function requireAdminAuth(request: NextRequest): NextResponse<{ error: string }> | null {
  const path = new URL(request.url).pathname;
  
  // 1. Check rate limit first (before auth to prevent brute force)
  const rateLimitKey = `admin:${getClientIp(request)}`;
  if (!checkRateLimit(rateLimitKey)) {
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
  
  // 2. Get configured API key
  const adminApiKey = getAdminApiKey();
  
  // 3. If no API key configured in production, fail closed
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
  
  // 4. Get API key from request header (normalize to lowercase)
  const providedKey = request.headers.get("x-admin-api-key");
  
  // 5. Timing-safe comparison
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
