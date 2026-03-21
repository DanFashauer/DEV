# Quick Reference: Critical Fixes

## 1. Remove Hardcoded Secrets (5 minutes)

### ❌ Before: [src/lib/adminAuth.ts](src/lib/adminAuth.ts#L23-L30)
```typescript
function getAdminApiKey(): string | null {
  const envKey = process.env.ADMIN_API_KEY;
  if (envKey && envKey.length > 0) {
    return envKey;
  }
  return "dev-admin-key-12345"; // ❌ HARDCODED
}
```

### ✅ After
```typescript
function getAdminApiKey(): string | null {
  const envKey = process.env.ADMIN_API_KEY;
  
  if (!envKey || envKey.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[AUTH] CRITICAL: ADMIN_API_KEY not configured in production');
    }
    throw new Error('[AUTH] ADMIN_API_KEY must be explicitly set (even in development)');
  }
  
  return envKey;
}
```

---

## 2. Add Timeouts to Fetch Calls (10 minutes per file)

### Pattern: Unsafe Fetch
```typescript
// ❌ ALL these need timeout:
const response = await fetch(jwksUri, { headers: {...} });
const response = await fetch(url, { method: 'POST', body: ... });
```

### ✅ Timeout Pattern
```typescript
function withTimeout(ms: number = 10000) {
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      return await fn();
    } finally {
      clearTimeout(timeout);
    }
  };
}

// Usage
const result = await withTimeout(10000)(async () => {
  return fetch(jwksUri, {
    signal: AbortController.signal,
    headers: { 'Accept': 'application/json' },
  });
});
```

### ✅ Direct Pattern
```typescript
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms to ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

**Files Needing This:** 8 files in `src/lib/integrations/`
- `auth.ts`
- `itsm/jira.ts`
- `itsm/servicenow.ts`
- `uem/workspace-one.ts`
- `uem/jamf.ts`
- `uem/intune.ts`
- `telemetry/fleetdm.ts`
- `webhooks/dispatch.ts` (optional - internal)

---

## 3. Add Security Headers to Next.js (5 minutes)

### ✅ Updated [next.config.ts](next.config.ts)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      // API routes with stricter CSP
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; script-src 'self'; style-src 'self'",
          },
        ],
      },
    ];
  },

  async redirects() {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_HTTP) {
      return [
        {
          source: "/",
          destination: "https://:host",
          permanent: true,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
```

---

## 4. Fix In-Memory Rate Limiting (30 minutes)

### ❌ Before: [src/lib/adminAuth.ts](src/lib/adminAuth.ts#L8-L14)
```typescript
// Single instance in-memory - won't work at scale
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}
```

### ✅ After: Redis-Backed Rate Limitingcreate new file: [src/lib/rateLimit.ts](src/lib/rateLimit.ts)
```typescript
import Redis from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 30, windowMs: 60000 }
): Promise<boolean> {
  if (!redis) {
    // In development without Redis, use in-memory (not for production)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Redis required for production rate limiting');
    }
    // Fall back to in-memory only in dev
    return checkRateLimitMemory(identifier, options);
  }

  const key = `${options.keyPrefix || 'ratelimit'}:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, Math.ceil(options.windowMs / 1000));
  }

  return current <= options.maxRequests;
}

// In-memory fallback for development only
const memoryStore = new Map<string, { count: number; resetTime: number }>();
function checkRateLimitMemory(identifier: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    memoryStore.set(identifier, { 
      count: 1, 
      resetTime: now + options.windowMs 
    });
    return true;
  }

  if (record.count >= options.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
```

### ✅ Update adminAuth.ts to use it
```typescript
import { checkRateLimit } from './rateLimit';

// Instead of:
// if (!checkRateLimit(key)) return error;

// Use:
const allowed = await checkRateLimit(`admin:${clientIp}`, { 
  maxRequests: 30, 
  windowMs: 60 * 1000 
});
if (!allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

---

## 5. Fix Request ID Context Logging (10 minutes)

### ❌ Before
```typescript
catch (error) {
  console.error('[BadgeList] Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### ✅ After
```typescript
import { getRequestId } from '@/lib/observability';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    // ...
  } catch (error) {
    console.error(`[BadgeList] ${requestId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}
```

**Create helper:** [src/lib/logging.ts](src/lib/logging.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export function createErrorResponse(
  error: unknown,
  requestId: string,
  statusCode: number = 500,
  context?: string
) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[API] ${requestId} ${context || 'Error'}:`, message);
  
  return NextResponse.json(
    { 
      error: statusCode === 500 ? 'Internal server error' : message,
      requestId,
    },
    { status: statusCode }
  );
}
```

---

## 6. Fix JWKS Cache Staleness (15 minutes)

### ❌ Before: [src/lib/auth.ts](src/lib/auth.ts#L107-L128)
```typescript
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour
if (jwks && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
  return jwks; // Could be stale for entire hour!
}
```

### ✅ After
```typescript
const JWKS_CACHE_TTL = 15 * 60 * 1000; // Reduce to 15 minutes
const JWKS_MIN_CACHE_AGE = 5 * 60 * 1000; // Wait 5 min between refreshes

let jwksLastRefreshError: Error | null = null;
let jwksRefreshScheduled = false;

async function fetchJWKS(jwksUri: string): Promise<JWK[]> {
  const now = Date.now();
  
  // Check if cache is still valid
  if (jwks && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwks;
  }
  
  // Don't hammer the server if last refresh failed
  if (jwksLastRefreshError && (now - jwksCacheTime) < JWKS_MIN_CACHE_AGE) {
    if (jwks) return jwks;
    throw jwksLastRefreshError;
  }
  
  try {
    const response = await fetchWithTimeout(jwksUri, {
      headers: { 'Accept': 'application/json' },
    }, 5000); // 5s timeout for JWKS fetch
    
    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status}`);
    }
    
    const data = (await response.json()) as { keys: JWK[] };
    jwks = data.keys;
    jwksCacheTime = now;
    jwksLastRefreshError = null;
    
    return jwks;
  } catch (error) {
    jwksLastRefreshError = error instanceof Error ? error : new Error(String(error));
    
    // If we have cached data, return it (even if stale)
    if (jwks) {
      console.warn('[AUTH] JWKS refresh failed, using stale cache:', jwksLastRefreshError.message);
      return jwks;
    }
    
    throw jwksLastRefreshError;
  }
}

// Add to verifyJWT function:
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    // ... existing code ...
  } catch (error) {
    // On verification failure, try refreshing JWKS
    // (key might have been rotated)
    if (error instanceof Error && error.message.includes('kid not found')) {
      console.warn('[AUTH] Key not found in JWKS, refreshing...');
      try {
        // Force refresh by clearing cache
        jwks = null;
        jwksCacheTime = 0;
        const newJwks = await fetchJWKS(config.jwksUri!);
        // Retry verification with fresh JWKS
        return await verifyJWTWithKeys(token, newJwks, config);
      } catch (refreshError) {
        console.error('[AUTH] JWKS refresh failed:', refreshError);
      }
    }
    throw error;
  }
}
```

---

## 7. Create `.env.example` (5 minutes)

### File: .env.example
```bash
# ============================================================================
# OIDC/JWT Authentication
# ============================================================================
OIDC_ISSUER_URL=https://login.microsoftonline.com/{tenant}/v2.0
OIDC_CLIENT_ID=your-client-id
OIDC_JWKS_URI=https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
OIDC_AUDIENCE=your-audience
ENABLE_DEV_BYPASS=false

# ============================================================================
# Admin API Key (use secure random string)
# Generate: openssl rand -hex 32
# ============================================================================
ADMIN_API_KEY=your-secure-admin-key-change-me

# ============================================================================
# Backend Request Signing
# Generate: openssl rand -hex 32
# ============================================================================
BACKEND_SIGNING_SECRET=your-backend-secret-change-me

# ============================================================================
# Redis
# ============================================================================
REDIS_URL=redis://localhost:6379

# ============================================================================
# Session Configuration
# ============================================================================
SESSION_TTL_SECONDS=28800
STEPUP_TTL_SECONDS=300

# ============================================================================
# Network & Security
# ============================================================================
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
ALLOW_HTTP=false

# ============================================================================
# Integration Endpoints
# ============================================================================
INTUNE_TENANT_ID=
INTUNE_CLIENT_ID=
INTUNE_CLIENT_SECRET=

JAMF_INSTANCE_URL=
JAMF_CLIENT_ID=
JAMF_CLIENT_SECRET=

WORKSPACE_ONE_API_URL=
WORKSPACE_ONE_API_KEY=

FLEETDM_API_URL=
FLEETDM_API_TOKEN=

SERVICENOW_INSTANCE_URL=
SERVICENOW_CLIENT_ID=
SERVICENOW_CLIENT_SECRET=

# ============================================================================
# Build & Environment
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
WEBPACK_CACHE=false
```

---

## 8. Enable TypeScript Strict Mode (5 minutes)

### ✅ Updated [tsconfig.json](tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": false,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", "vitest.config.ts"]
}
```

---

## Checklist: Critical Fixes (Execute in Order)

- [ ] 1. Remove hardcoded secrets from [src/lib/adminAuth.ts](src/lib/adminAuth.ts)
- [ ] 2. Remove hardcoded test key from [scripts/webhook-test.ts](scripts/webhook-test.ts)
- [ ] 3. Create [src/lib/rateLimit.ts](src/lib/rateLimit.ts) with Redis backing
- [ ] 4. Add timeouts to 8+ fetch calls (copy-paste pattern above)
- [ ] 5. Update [next.config.ts](next.config.ts) with security headers
- [ ] 6. Create [src/lib/logging.ts](src/lib/logging.ts) helper
- [ ] 7. Add request ID to all catch blocks (10 min)
- [ ] 8. Create `.env.example` file
- [ ] 9. Update [tsconfig.json](tsconfig.json) to enable strict mode
- [ ] 10. Run `bun run typecheck` to find type errors

**Total Time: 90-120 minutes**

---

## Verification Commands

```bash
# After fixes, run:
bun run typecheck        # Should have zero errors
bun run lint             # Should have zero errors
bun run test:security    # Run security tests
bun run audit:verify     # Verify dependencies
```

---

**Last Updated:** March 19, 2026
