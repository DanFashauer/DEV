/**
 * Tenant Context
 * 
 * Provides tenant ID resolution for multi-tenant isolation.
 * 
 * Tenant ID is resolved in priority order:
 * 1. x-tenant-id header (set by API gateway/load balancer)
 * 2. SIGNALGRID_TENANT_ID env var (self-hosted single-tenant)
 * 3. "default" (backward-compatible fallback)
 */

import { NextRequest } from 'next/server';

/**
 * Default tenant ID for dev/single-tenant deployments
 */
export const DEFAULT_TENANT_ID = 'default';

/**
 * Validate and normalize tenant ID
 * Must be lowercase alphanumeric with hyphens allowed
 */
export function normalizeTenantId(tenantId: string): string {
  // Convert to lowercase
  let normalized = tenantId.toLowerCase();
  
  // Replace underscores with hyphens
  normalized = normalized.replace(/_/g, '-');
  
  // Remove any non-alphanumeric characters except hyphens
  normalized = normalized.replace(/[^a-z0-9-]/g, '');
  
  // Ensure not empty after normalization
  if (!normalized || normalized.length === 0) {
    return DEFAULT_TENANT_ID;
  }
  
  return normalized;
}

/**
 * Get tenant ID from environment variable
 */
export function getTenantIdFromEnv(): string {
  const envTenantId = process.env.SIGNALGRID_TENANT_ID;
  if (envTenantId && envTenantId.trim().length > 0) {
    return normalizeTenantId(envTenantId.trim());
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Resolve tenant ID from request
 * Priority: x-tenant-id header > env var > default
 */
export function resolveTenantId(request: Request | NextRequest): string {
  // 1. Check header (from API gateway, load balancer, or client)
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId && headerTenantId.trim().length > 0) {
    return normalizeTenantId(headerTenantId.trim());
  }
  
  // 2. Check environment variable
  return getTenantIdFromEnv();
}

/**
 * Build a namespaced Redis key
 * Format: t:{tenantId}:{store}:{id}
 */
export function buildTenantKey(tenantId: string, store: string, id: string): string {
  return `t:${tenantId}:${store}:${id}`;
}

/**
 * Build a namespaced index key for a store
 * Format: t:{tenantId}:{store}:index
 */
export function buildTenantIndexKey(tenantId: string, store: string): string {
  return `t:${tenantId}:${store}:index`;
}

/**
 * Validate tenant ID format
 * Returns true if valid, false otherwise
 */
export function isValidTenantId(tenantId: string): boolean {
  if (!tenantId || tenantId.length === 0) {
    return false;
  }
  
  // Must be lowercase alphanumeric with hyphens
  const validPattern = /^[a-z0-9][a-z0-9-]*$/;
  return validPattern.test(tenantId);
}

/**
 * Build a namespaced key - alias for buildTenantKey
 * Format: t:{tenantId}:{store}:{id}
 */
export function tenantKey(tenantId: string, store: string, id: string): string {
  return buildTenantKey(tenantId, store, id);
}
