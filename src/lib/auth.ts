/**
 * OIDC/JWT Authentication Middleware
 * 
 * Provides JWT-based authentication for admin APIs with role-based access control.
 * In development, falls back to API key auth if OIDC is not configured.
 * 
 * Environment variables:
 * - OIDC_ISSUER_URL: URL of the OIDC provider (e.g., https://login.microsoftonline.com/{tenant}/v2.0)
 * - OIDC_CLIENT_ID: Client ID for this application
 * - OIDC_JWKS_URI: JWKS URI for token verification (defaults to {issuer}/.well-known/jwks.json)
 * - OIDC_AUDIENCE: Expected audience claim (optional, defaults to client ID)
 * - ADMIN_API_KEY: API key for admin authentication when API key auth is enabled
 * - ENABLE_DEV_BYPASS: Set to "true" to allow API key fallback from JWT mode in non-production
 */

import { NextRequest, NextResponse } from "next/server";
import { JWK, jwtVerify, createRemoteJWKSet } from "jose";
import { randomBytes, timingSafeEqual } from "crypto";
import { fetchWithTimeout, TIMEOUT_PRESETS } from "./utils/fetchWithTimeout";

// ============================================================================
// Types
// ============================================================================

export interface JWTPayload {
  // Standard claims
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  
  // Microsoft Entra ID / Azure AD claims
  roles?: string[];
  groups?: string[];
  department?: string;
  upn?: string;
  email?: string;
  name?: string;
  
  // Custom claims
  [key: string]: unknown;
}

export interface AuthConfig {
  mode: 'jwt' | 'api-key';
  issuer?: string;
  audience?: string;
  jwksUri?: string;
}

// ============================================================================
// Configuration
// ============================================================================

let authConfig: AuthConfig | null = null;
let jwks: JWK[] | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes (reduced from 1 hour)

/**
 * Invalidate JWKS cache - call when verification fails due to key rotation
 */
function invalidateJWKSCache(): void {
  jwks = null;
  jwksCacheTime = 0;
  console.log('[AUTH] JWKS cache invalidated - will refresh on next request');
}

/**
 * Get authentication configuration based on environment
 * Export this so adminAuth can check auth mode
 */
export function getAuthConfig(): AuthConfig {
  if (authConfig) {
    return authConfig;
  }
  
  const issuerUrl = process.env.OIDC_ISSUER_URL;
  const clientId = process.env.OIDC_CLIENT_ID;
  const jwksUri = process.env.OIDC_JWKS_URI;
  const audience = process.env.OIDC_AUDIENCE || clientId;
  const enableDevBypass = process.env.ENABLE_DEV_BYPASS === 'true';
  
  // Check if OIDC is properly configured
  if (issuerUrl && clientId) {
    authConfig = {
      mode: 'jwt',
      issuer: issuerUrl,
      audience: audience,
      jwksUri: jwksUri || `${issuerUrl}/.well-known/jwks.json`,
    };
    console.log(`[AUTH] OIDC mode enabled - Issuer: ${issuerUrl}`);
  } else if (enableDevBypass || process.env.NODE_ENV !== 'production') {
    // Development fallback
    authConfig = { mode: 'api-key' };
    console.log('[AUTH] API key mode (development fallback)');
  } else {
    // Production without OIDC - this is a misconfiguration
    console.error('[AUTH] CRITICAL: OIDC not configured in production!');
    authConfig = { mode: 'api-key' }; // Will fail at runtime
  }
  
  return authConfig;
}

// ============================================================================
// JWKS Management
// ============================================================================

/**
 * Fetch and cache JWKS from the OIDC provider with timeout protection
 */
async function fetchJWKS(jwksUri: string): Promise<JWK[]> {
  const now = Date.now();
  
  if (jwks && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwks;
  }
  
  try {
    const response = await fetchWithTimeout(jwksUri, {
      timeoutMs: TIMEOUT_PRESETS.jwks,
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status}`);
    }
    
    const data = await response.json() as { keys: JWK[] };
    jwks = data.keys;
    jwksCacheTime = now;
    
    console.log(`[AUTH] JWKS refreshed from ${jwksUri}, ${jwks.length} keys`);
    return jwks!;
  } catch (error) {
    console.error('[AUTH] JWKS fetch error:', error);
    // Return cached if available, even if stale
    if (jwks) {
      return jwks;
    }
    throw error;
  }
}

// ============================================================================
// JWT Verification
// ============================================================================

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  const config = getAuthConfig();
  
  if (config.mode !== 'jwt') {
    return null;
  }
  
  try {
    const jwksSet = createRemoteJWKSet(new URL(config.jwksUri!));
    
    const { payload } = await jwtVerify(token, jwksSet, {
      issuer: config.issuer,
      audience: config.audience,
    });
    
    // Verify issuer
    if (config.issuer && payload.iss !== config.issuer) {
      console.warn(`[AUTH] Issuer mismatch: expected ${config.issuer}, got ${payload.iss}`);
      return null;
    }
    
    // Verify audience
    if (config.audience) {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(config.audience)) {
        console.warn(`[AUTH] Audience mismatch: expected ${config.audience}`);
        return null;
      }
    }
    
    return payload;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AUTH] JWT verification failed:', errorMessage);
    
    // Check for "kid not found" errors indicating key rotation
    if (errorMessage.includes('kid not found') || errorMessage.includes('Unable to find key')) {
      console.warn('[AUTH] Key rotation detected - invalidating JWKS cache');
      invalidateJWKSCache();
      // Record audit event for monitoring
      console.log('[AUDIT] JWKS cache invalidated due to key rotation');
    }
    
    return null;
  }
}

/**
 * Extract roles from JWT payload
 * Supports both standard 'roles' claim and Microsoft 'roles' claim
 */
export function extractRoles(payload: JWTPayload): string[] {
  if (Array.isArray(payload.roles)) {
    return payload.roles;
  }
  return [];
}

/**
 * Check if user has required role
 */
export function hasRole(payload: JWTPayload, requiredRole: string): boolean {
  const roles = extractRoles(payload);
  return roles.includes(requiredRole);
}

// ============================================================================
// API Key Fallback (Development)
// ============================================================================

/**
 * Timing-safe string comparison
 */
function timingSafeCompare(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  
  return timingSafeEqual(bufA, bufB);
}

/**
 * Get admin API key from environment
 */
function getAdminApiKey(): string | null {
  const envKey = process.env.ADMIN_API_KEY;
  
  if (envKey && envKey.length > 0) {
    return envKey;
  }

  return null;
}

function allowDevApiKeyFallback(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_BYPASS === 'true';
}

/**
 * Verify API key (development fallback)
 */
function verifyApiKey(providedKey: string | null): boolean {
  const validKey = getAdminApiKey();
  if (!validKey) return false;
  return timingSafeCompare(providedKey, validKey);
}

// ============================================================================
// Request Authentication
// ============================================================================

export interface AuthResult {
  authenticated: boolean;
  method: 'jwt' | 'api-key' | null;
  payload?: JWTPayload;
  roles?: string[];
  error?: string;
}

/**
 * Authenticate a request using JWT or API key
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const config = getAuthConfig();
  
  // Try JWT first if OIDC is configured
  if (config.mode === 'jwt') {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyJWT(token);
      
      if (payload) {
        return {
          authenticated: true,
          method: 'jwt',
          payload,
          roles: extractRoles(payload),
        };
      }
    }
    
    // JWT failed, optionally allow API key fallback only in explicitly-enabled dev bypass mode
    if (allowDevApiKeyFallback()) {
      const apiKey = request.headers.get('x-admin-api-key');
      if (verifyApiKey(apiKey)) {
        return {
          authenticated: true,
          method: 'api-key',
          roles: ['admin'], // API key grants full access
        };
      }
    }
    
    return {
      authenticated: false,
      method: 'jwt',
      error: 'Invalid or missing authentication token',
    };
  }
  
  // API key mode
  const apiKey = request.headers.get('x-admin-api-key');
  if (verifyApiKey(apiKey)) {
    return {
      authenticated: true,
      method: 'api-key',
      roles: ['admin'],
    };
  }
  
  return {
    authenticated: false,
    method: 'api-key',
    error: 'Invalid or missing API key',
  };
}

/**
 * Authenticate admin routes with legacy-compatible API-key behavior in dev.
 */
export async function authenticateAdminRequest(request: NextRequest): Promise<AuthResult> {
  return authenticateRequest(request);
}

// ============================================================================
// Role-Based Access Control
// ============================================================================

export type RequiredRole = 'admin' | 'operator' | 'viewer';

/**
 * Require specific role for access
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: RequiredRole
): Promise<NextResponse | null> {
  const auth = await authenticateRequest(request);
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // API key mode grants all roles
  if (auth.method === 'api-key') {
    return null;
  }
  
  // Check roles for JWT mode
  const roles = auth.roles || [];
  const roleHierarchy: Record<RequiredRole, number> = {
    'admin': 3,
    'operator': 2,
    'viewer': 1,
  };
  
  const userLevel = Math.max(...roles.map(r => roleHierarchy[r as RequiredRole] || 0));
  
  if (userLevel < roleHierarchy[requiredRole]) {
    return NextResponse.json(
      { error: `Forbidden: requires ${requiredRole} role` },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(request, 'admin');
}

/**
 * Require operator role or above
 */
export async function requireOperator(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(request, 'operator');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  request: NextRequest,
  event: string,
  success: boolean,
  details?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  
  console.log(JSON.stringify({
    timestamp,
    event: `auth:${event}`,
    ip,
    success,
    ...details,
  }));
}
