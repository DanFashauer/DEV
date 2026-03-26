/**
 * Tenant-Aware Policy Store
 * 
 * Wraps the global policy store with multi-tenant isolation.
 * Each tenant has their own policies in memory.
 */

import { NextRequest } from 'next/server';
import { Policy } from '../policy/types';
import { resolveTenantId, DEFAULT_TENANT_ID } from './tenantContext';

// Re-export types
export type { Policy };

// Import global store functions
import { 
  listPolicies as globalListPolicies,
  getPolicy as globalGetPolicy,
  createPolicy as globalCreatePolicy,
  updatePolicy as globalUpdatePolicy,
  deletePolicy as globalDeletePolicy
} from '../policy/store/policyStore';

// In-memory policy store per tenant
const tenantPolicies = new Map<string, Policy[]>();

function generatePolicyId(): string {
  return `policy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTenantPolicies(tenantId: string): Policy[] {
  if (!tenantPolicies.has(tenantId)) {
    tenantPolicies.set(tenantId, []);
  }
  return tenantPolicies.get(tenantId)!;
}

/**
 * Get a tenant-scoped policy store
 */
export function getPolicyStore(tenantId: string) {
  return {
    listPolicies(): Policy[] {
      return [...getTenantPolicies(tenantId)].sort((a, b) => a.priority - b.priority);
    },
    
    getPolicy(id: string): Policy | undefined {
      return getTenantPolicies(tenantId).find((p) => p.id === id);
    },
    
    createPolicy(p: Policy): Policy {
      const policy = {
        ...p,
        id: p.id || generatePolicyId(),
      };
      getTenantPolicies(tenantId).push(policy);
      console.log(`[Tenant:${tenantId}] Created policy: ${policy.id}`);
      return policy;
    },
    
    updatePolicy(id: string, data: Partial<Policy>): Policy | null {
      const policies = getTenantPolicies(tenantId);
      const p = policies.find((pol) => pol.id === id);
      if (!p) return null;
      Object.assign(p, data);
      console.log(`[Tenant:${tenantId}] Updated policy: ${id}`);
      return p;
    },
    
    deletePolicy(id: string): boolean {
      const policies = getTenantPolicies(tenantId);
      const i = policies.findIndex((p) => p.id === id);
      if (i >= 0) {
        policies.splice(i, 1);
        console.log(`[Tenant:${tenantId}] Deleted policy: ${id}`);
        return true;
      }
      return false;
    },
  };
}

/**
 * Get policy store from request
 */
export function getPolicyStoreFromRequest(request: Request | NextRequest): ReturnType<typeof getPolicyStore> {
  const tenantId = resolveTenantId(request);
  return getPolicyStore(tenantId);
}

/**
 * Get all tenant policy stores
 */
export function getAllTenantPolicyStores(): ReturnType<typeof getPolicyStore>[] {
  const envTenantId = process.env.SIGNALGRID_TENANT_ID;
  if (envTenantId) {
    return [getPolicyStore(envTenantId)];
  }
  return [getPolicyStore(DEFAULT_TENANT_ID)];
}