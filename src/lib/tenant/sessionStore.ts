/**
 * Tenant-Aware Session Store
 * 
 * Per-tenant in-memory storage keyed by tenantId.
 */

import { NextRequest } from 'next/server';
import { Session, SessionDirective, SessionStatus, sessionStore as baseSessionStore } from '../sessionStore';
import { resolveTenantId, DEFAULT_TENANT_ID } from './tenantContext';

export type { Session, SessionDirective, SessionStatus };

// Per-tenant in-memory session storage
const tenantSessionStores = new Map<string, Map<string, Session>>();

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function getTenantStore(tenantId: string): Map<string, Session> {
  if (!tenantSessionStores.has(tenantId)) {
    tenantSessionStores.set(tenantId, new Map());
  }
  return tenantSessionStores.get(tenantId)!;
}

export function getSessionStore(tenantId?: string) {
  const resolvedTenantId = tenantId || DEFAULT_TENANT_ID;
  return new TenantSessionStore(resolvedTenantId);
}

export function getSessionStoreFromRequest(request: Request | NextRequest) {
  const tenantId = resolveTenantId(request);
  return getSessionStore(tenantId);
}

class TenantSessionStore {
  private tenantId: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }
  
  private get store(): Map<string, Session> {
    return getTenantStore(this.tenantId);
  }
  
  async create(data: {
    userId: string;
    badgeUid: string;
    deviceId: string;
    nextAction?: string;
    bundleId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Session> {
    const now = new Date();
    const ttlMs = parseInt(process.env.SESSION_TTL_SECONDS ?? '28800') * 1000;
    
    const session: Session = {
      sessionId: generateSessionId(),
      userId: data.userId,
      badgeUid: data.badgeUid,
      deviceId: data.deviceId,
      status: 'active' as SessionStatus,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      lastActivityAt: now.toISOString(),
      nextAction: data.nextAction,
      bundleId: data.bundleId,
      metadata: data.metadata,
    };
    
    this.store.set(session.sessionId, session);
    return session;
  }
  
  async get(sessionId: string): Promise<Session | null> {
    const session = this.store.get(sessionId);
    if (!session) return null;
    
    if (new Date(session.expiresAt) < new Date()) {
      session.status = 'expired';
    }
    
    return session;
  }
  
  async update(sessionId: string, data: Partial<Session>): Promise<Session | null> {
    const session = this.store.get(sessionId);
    if (!session) return null;
    Object.assign(session, data);
    return session;
  }
  
  async terminate(sessionId: string): Promise<boolean> {
    const session = this.store.get(sessionId);
    if (!session) return false;
    session.status = 'terminated';
    return true;
  }
  
  async getByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.store.values()).filter(s => s.userId === userId);
  }
  
  async getByDeviceId(deviceId: string): Promise<Session[]> {
    return Array.from(this.store.values()).filter(s => s.deviceId === deviceId);
  }
  
  async cleanup(): Promise<number> {
    const now = new Date();
    let cleaned = 0;
    for (const session of this.store.values()) {
      if (session.status === 'expired' || session.status === 'terminated' || new Date(session.expiresAt) < now) {
        session.status = 'expired';
        this.store.delete(session.sessionId);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export function getAllTenantSessionStores() {
  const envTenantId = process.env.SIGNALGRID_TENANT_ID;
  if (envTenantId) {
    return [getSessionStore(envTenantId)];
  }
  return [getSessionStore(DEFAULT_TENANT_ID)];
}