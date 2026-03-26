/**
 * Tenant-Aware Policy Evaluator
 * 
 * Wraps the global policy evaluator with multi-tenant isolation.
 * Each tenant evaluates only their own policies.
 */

import { NextRequest } from 'next/server';
import { Policy, PolicyContext, PolicyAction } from '../policy/types';
import { resolveTenantId, DEFAULT_TENANT_ID } from './tenantContext';
import { getPolicyStore } from './policyStore';

// Re-export types
export type { Policy, PolicyContext, PolicyAction };

// Import condition evaluation logic (keep identical to original)
function evaluateConditionField(ctx: PolicyContext, field: string): unknown {
  const parts = field.split(".");
  let result: unknown = ctx;
  for (const key of parts) {
    if (result && typeof result === "object") {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return result;
}

function checkCondition(
  fieldValue: unknown,
  operator: "eq" | "neq" | "in" | "gt" | "lt",
  conditionValue: unknown
): boolean {
  switch (operator) {
    case "eq":
      return fieldValue === conditionValue;
    case "neq":
      return fieldValue !== conditionValue;
    case "in":
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
    case "gt":
      return typeof fieldValue === "number" && typeof conditionValue === "number" && fieldValue > conditionValue;
    case "lt":
      return typeof fieldValue === "number" && typeof conditionValue === "number" && fieldValue < conditionValue;
    default:
      return false;
  }
}

function checkPolicy(policy: Policy, ctx: PolicyContext): boolean {
  return policy.conditions.every((cond) => {
    const fieldValue = evaluateConditionField(ctx, cond.field);
    return checkCondition(fieldValue, cond.operator, cond.value);
  });
}

/**
 * Get a tenant-scoped policy evaluator
 */
export function getEvaluator(tenantId: string) {
  const store = getPolicyStore(tenantId);
  
  return {
    /**
     * Evaluate policies against context and return matched actions
     */
    async evaluate(ctx: PolicyContext): Promise<PolicyAction[]> {
      const actions: PolicyAction[] = [];
      
      // Get tenant-specific policies sorted by priority
      const policies = store.listPolicies().sort((a, b) => a.priority - b.priority);
      
      for (const policy of policies) {
        if (!policy.enabled) continue;
        
        if (checkPolicy(policy, ctx)) {
          // Attach policy metadata to each action
          for (const action of policy.actions) {
            actions.push({
              ...action,
              policyId: policy.id,
              policyName: policy.name,
            });
          }
        }
      }
      
      console.log(`[Tenant:${tenantId}] Evaluated ${policies.length} policies, triggered ${actions.length} actions`);
      return actions;
    },
  };
}

/**
 * Get evaluator from request
 */
export function getEvaluatorFromRequest(request: Request | NextRequest): ReturnType<typeof getEvaluator> {
  const tenantId = resolveTenantId(request);
  return getEvaluator(tenantId);
}