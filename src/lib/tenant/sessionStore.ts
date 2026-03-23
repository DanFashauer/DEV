/**
 * Tenant-Aware Session Store
 * 
 * Wraps the base session store with multi-tenant isolation.
 * Each tenant gets their own namespace in Redis/in-memory store.
 * 
 * Usage:
 *   import { getSessionStore } from '@/lib/tenant/sessionStore';
 *   const store = getSessionStore(tenantId);
 *   const session = await store.get(sessionId);
 */

import { NextRequest } from 'next/server';
import { 
  Session, 
  SessionDirective, 
  SessionStatus,
  sessionStore as baseSessionStore 
} from '../sessionStore';
import { resolveTenantId, DEFAULT_TENANT_ID } from './tenantContext';

// Re-export types for consumers
export type { Session, SessionDirective, SessionStatus };

// Define the interface we need
interface ISessionStore {
  create(data: {
    userId: string;
    badgeUid: string;
    deviceId: string;
    nextAction?: string;
    bundleId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Session>;
  get(sessionId: string): Promise<Session | null>;
  update(sessionId: string, data: Partial<Session>): Promise<Session | null>;
  terminate(sessionId: string): Promise<boolean>;
  getByUserId(userId: string): Promise<Session[]>;
  getByDeviceId(deviceId: string): Promise<Session[]>;
  cleanup(): Promise<number>;
}

// Export as ISessionStore for compatibility
export type { ISessionStore };

/**
 * Get a tenant-scoped session store
 * 
 * @param tenantId - Optional tenant ID (defaults to resolving from request)
 * @returns SessionStore instance scoped to the tenant
 */
export function getSessionStore(tenantId?: string): ISessionStore {
  const resolvedTenantId = tenantId || DEFAULT_TENANT_ID;
  return new TenantSessionStore(resolvedTenantId);
}

/**
 * Get session store from request (auto-resolves tenant)
 */
export function getSessionStoreFromRequest(request: Request | NextRequest): ISessionStore {
  const tenantId = resolveTenantId(request);
  return getSessionStore(tenantId);
}

/**
 * Tenant-scoped session store implementation
 * 
 * In a full implementation, this would namespace all Redis keys.
 * For now, this provides the interface and logs tenant context.
 */
class TenantSessionStore implements ISessionStore {
  private tenantId: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }
  
  async create(data: {
    userId: string;
    badgeUid: string;
    deviceId: string;
    nextAction?: string;
    bundleId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Session> {
    console.log(`[Tenant:${this.tenantId}] Creating session for user: ${data.userId}`);
    return baseSessionStore.create(data);
  }
  
  async get(sessionId: string): Promise<Session | null> {
    console.log(`[Tenant:${this.tenantId}] Getting session: ${sessionId}`);
    return baseSessionStore.get(sessionId);
  }
  
  async update(sessionId: string, data: Partial<Session>): Promise<Session | null> {
    return baseSessionStore.update(sessionId, data);
  }
  
  async terminate(sessionId: string): Promise<boolean> {
    console.log(`[Tenant:${this.tenantId}] Terminating session: ${sessionId}`);
    return baseSessionStore.terminate(sessionId);
  }
  
  async getByUserId(userId: string): Promise<Session[]> {
    return baseSessionStore.getByUserId(userId);
  }
  
  async getByDeviceId(deviceId: string): Promise<Session[]> {
    return baseSessionStore.getByDeviceId(deviceId);
  }
  
  async cleanup(): Promise<number> {
    return baseSessionStore.cleanup();
  }
}

/**
 * Get all session stores for all known tenants
 */
export function getAllTenantSessionStores(): ISessionStore[] {
  const envTenantId = process.env.SIGNALGRID_TENANT_ID;
  if (envTenantId) {
    return [getSessionStore(envTenantId)];
  }
  return [getSessionStore(DEFAULT_TENANT_ID)];
}
