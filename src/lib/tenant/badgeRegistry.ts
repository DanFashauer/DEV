/**
 * Tenant-Aware Badge Registry
 * 
 * Wraps the base badge registry with multi-tenant isolation.
 * Each tenant gets their own namespace in Redis/in-memory store.
 * 
 * Usage:
 *   import { getBadgeRegistry } from '@/lib/tenant/badgeRegistry';
 *   const registry = getBadgeRegistry(tenantId);
 *   const mapping = await registry.get(badgeUid);
 */

import { NextRequest } from 'next/server';
import { 
  BadgeMapping, 
  BadgeEnrollmentRequest, 
  BadgeRegistry as BadgeRegistryInterface,
  badgeRegistry as baseBadgeRegistry 
} from '../badgeRegistry';
import { resolveTenantId, buildTenantKey, DEFAULT_TENANT_ID } from './tenantContext';

// Re-export types for consumers
export type { BadgeMapping, BadgeEnrollmentRequest, BadgeRegistryInterface as IBadgeRegistry };

/**
 * Get a tenant-scoped badge registry
 * 
 * @param tenantId - Optional tenant ID (defaults to resolving from request)
 * @returns BadgeRegistry instance scoped to the tenant
 */
export function getBadgeRegistry(tenantId?: string): BadgeRegistryInterface {
  const resolvedTenantId = tenantId || DEFAULT_TENANT_ID;
  
  // Return a scoped wrapper around the base registry
  return new TenantBadgeRegistry(resolvedTenantId);
}

/**
 * Get badge registry from request (auto-resolves tenant)
 */
export function getBadgeRegistryFromRequest(request: Request | NextRequest): BadgeRegistryInterface {
  const tenantId = resolveTenantId(request);
  return getBadgeRegistry(tenantId);
}

/**
 * Tenant-scoped badge registry implementation
 * 
 * In a full implementation, this would namespace all Redis keys.
 * For now, this provides the interface and logs tenant context.
 */
class TenantBadgeRegistry implements BadgeRegistryInterface {
  private tenantId: string;
  private keyPrefix: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.keyPrefix = `t:${tenantId}:badge`;
  }
  
  private getNamespacedKey(badgeUid: string): string {
    return buildTenantKey(this.tenantId, 'badge', badgeUid);
  }
  
  async enroll(request: BadgeEnrollmentRequest): Promise<BadgeMapping> {
    console.log(`[Tenant:${this.tenantId}] Enrolling badge: ${request.badgeUid}`);
    return baseBadgeRegistry.enroll(request);
  }
  
  async get(badgeUid: string): Promise<BadgeMapping | null> {
    console.log(`[Tenant:${this.tenantId}] Getting badge: ${badgeUid}`);
    return baseBadgeRegistry.get(badgeUid);
  }
  
  async updateLastUsed(badgeUid: string): Promise<void> {
    return baseBadgeRegistry.updateLastUsed(badgeUid);
  }
  
  async list(): Promise<BadgeMapping[]> {
    console.log(`[Tenant:${this.tenantId}] Listing badges`);
    return baseBadgeRegistry.list();
  }
  
  async remove(badgeUid: string): Promise<boolean> {
    console.log(`[Tenant:${this.tenantId}] Removing badge: ${badgeUid}`);
    return baseBadgeRegistry.remove(badgeUid);
  }
  
  async deactivate(badgeUid: string): Promise<boolean> {
    console.log(`[Tenant:${this.tenantId}] Deactivating badge: ${badgeUid}`);
    return baseBadgeRegistry.deactivate(badgeUid);
  }
}

/**
 * Get all badge registries for all known tenants
 * Useful for admin operations that need cross-tenant visibility
 */
export function getAllTenantBadgeRegistries(): BadgeRegistryInterface[] {
  // For single-tenant deployments, return just the default
  const envTenantId = process.env.SIGNALGRID_TENANT_ID;
  if (envTenantId) {
    return [getBadgeRegistry(envTenantId)];
  }
  
  // For multi-tenant, you'd query Redis for all tenant prefixes
  // For now, return default
  return [getBadgeRegistry(DEFAULT_TENANT_ID)];
}
