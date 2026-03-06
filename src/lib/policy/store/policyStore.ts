import { Policy } from "../types";

const policies: Policy[] = [];

function generatePolicyId(): string {
  return `policy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function listPolicies(): Policy[] {
  return [...policies].sort((a, b) => a.priority - b.priority);
}

export function getPolicy(id: string): Policy | undefined {
  return policies.find((p) => p.id === id);
}

export function createPolicy(p: Policy): Policy {
  // Ensure policy has an ID
  const policy = {
    ...p,
    id: p.id || generatePolicyId(),
  };
  policies.push(policy);
  return policy;
}

export function updatePolicy(id: string, data: Partial<Policy>): Policy | null {
  const p = getPolicy(id);
  if (!p) return null;
  Object.assign(p, data);
  return p;
}

export function deletePolicy(id: string): boolean {
  const i = policies.findIndex((p) => p.id === id);
  if (i >= 0) {
    policies.splice(i, 1);
    return true;
  }
  return false;
}
