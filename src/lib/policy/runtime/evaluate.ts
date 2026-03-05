import { listPolicies } from "../store/policyStore";
import { Policy, Action, PolicyContext } from "../types";

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

export function evaluatePolicies(ctx: PolicyContext): Action[] {
  const actions: Action[] = [];

  for (const policy of listPolicies()) {
    if (!policy.enabled) continue;

    if (checkPolicy(policy, ctx)) {
      actions.push(...policy.actions);
    }
  }

  return actions;
}
