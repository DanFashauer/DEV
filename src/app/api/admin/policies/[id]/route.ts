import { NextRequest, NextResponse } from "next/server";
import { 
  requireAdminAuth, 
  requireStepUpAuth,
  adminSuccess, 
  adminError,
} from "@/lib/adminAuth";
import { resolveTenantId } from "@/lib/tenant/tenantContext";
import { getPolicyStore } from "@/lib/tenant/policyStore";
import { PolicySchema } from "@/lib/policy/types";

export const dynamic = "force-dynamic";

/**
 * Check if the update includes enabling a policy
 */
function includesEnable(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const obj = body as Record<string, unknown>;
  return 'enabled' in obj && obj.enabled === true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const tenantId = resolveTenantId(request);
  const store = getPolicyStore(tenantId);
  
  const { id } = await params;
  const policy = store.getPolicy(id);

  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json({ policy });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const tenantId = resolveTenantId(request);
  const store = getPolicyStore(tenantId);
  
  const { id } = await params;
  const body = await request.json();

  // Check if this update enables the policy - require step-up
  if (includesEnable(body)) {
    const stepUpError = await requireStepUpAuth(request, 'policy_enable');
    if (stepUpError) return stepUpError;
  } else {
    // Policy edit (non-enable) also requires step-up for safety
    const stepUpError = await requireStepUpAuth(request, 'policy_edit');
    if (stepUpError) return stepUpError;
  }

  const updated = store.updatePolicy(id, body);

  if (!updated) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json({ policy: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  // Require step-up for policy deletion
  const stepUpError = await requireStepUpAuth(request, 'policy_edit');
  if (stepUpError) return stepUpError;

  const tenantId = resolveTenantId(request);
  const store = getPolicyStore(tenantId);
  
  const { id } = await params;
  const deleted = store.deletePolicy(id);

  if (!deleted) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}