/**
 * Tenant-Aware Badge Registry
 * 
 * Per-tenant in-memory storage keyed by tenantId.
 */

import { NextRequest } from 'next/server';
import { BadgeMapping, BadgeEnrollmentRequest, BadgeRegistry as BadgeRegistryInterface } from '../badgeRegistry';
import { resolveTenantId, DEFAULT_TENANT_ID } from './tenantContext';

export type { BadgeMapping, BadgeEnrollmentRequest, BadgeRegistryInterface as IBadgeRegistry };

// Per-tenant in-memory badge storage
const tenantBadgeStores = new Map<string, Map<string, BadgeMapping>>();

function getTenantStore(tenantId: string): Map<string, BadgeMapping> {
  if (!tenantBadgeStores.has(tenantId)) {
    tenantBadgeStores.set(tenantId, new Map());
  }
  return tenantBadgeStores.get(tenantId)!;
}

export function getBadgeRegistry(tenantId?: string): BadgeRegistryInterface {
  const resolvedTenantId = tenantId || DEFAULT_TENANT_ID;
  return new TenantBadgeRegistry(resolvedTenantId);
}

export function getBadgeRegistryFromRequest(request: Request | NextRequest): BadgeRegistryInterface {
  const tenantId = resolveTenantId(request);
  return getBadgeRegistry(tenantId);
}

class TenantBadgeRegistry implements BadgeRegistryInterface {
  private tenantId: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }
  
  private get store(): Map<string, BadgeMapping> {
    return getTenantStore(this.tenantId);
  }
  
  async enroll(request: BadgeEnrollmentRequest): Promise<BadgeMapping> {
    const mapping: BadgeMapping = {
      badgeUid: request.badgeUid,
      userId: request.userId,
      userName: request.userName,
      department: request.department,
      enrolledAt: new Date().toISOString(),
      active: true,
    };
    this.store.set(mapping.badgeUid, mapping);
    return mapping;
  }
  
  async get(badgeUid: string): Promise<BadgeMapping | null> {
    return this.store.get(badgeUid) || null;
  }
  
  async updateLastUsed(badgeUid: string): Promise<void> {
    const mapping = this.store.get(badgeUid);
    if (mapping) {
      mapping.lastUsedAt = new Date().toISOString();
    }
  }
  
  async list(): Promise<BadgeMapping[]> {
    return Array.from(this.store.values());
  }
  
  async remove(badgeUid: string): Promise<boolean> {
    return this.store.delete(badgeUid);
  }
  
  async deactivate(badgeUid: string): Promise<boolean> {
    const mapping = this.store.get(badgeUid);
    if (!mapping) return false;
    mapping.active = false;
    return true;
  }
}

export function getAllTenantBadgeRegistries(): BadgeRegistryInterface[] {
  const envTenantId = process.env.SIGNALGRID_TENANT_ID;
  if (envTenantId) {
    return [getBadgeRegistry(envTenantId)];
  }
  return [getBadgeRegistry(DEFAULT_TENANT_ID)];
}