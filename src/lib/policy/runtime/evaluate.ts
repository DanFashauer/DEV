import { listPolicies } from "../store/policyStore";
import { Policy, Action, PolicyContext, PolicyAction } from "../types";

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
 * Evaluate policies against context and return matched actions
 * with policy metadata attached
 */
export function evaluatePolicies(ctx: PolicyContext): PolicyAction[] {
  const actions: PolicyAction[] = [];

  // Sort policies by priority
  const policies = listPolicies().sort((a, b) => a.priority - b.priority);

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

  return actions;
}
