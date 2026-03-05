import { NextRequest, NextResponse } from "next/server";
import { 
  requireAdminAuth, 
  adminSuccess, 
  adminError,
} from "@/lib/adminAuth";
import { listPolicies, createPolicy } from "@/lib/policy/store/policyStore";
import { PolicySchema } from "@/lib/policy/types";

export const dynamic = "force-dynamic";

/**
 * Admin Policies API Route
 * 
 * CRUD operations for policy engine.
 * 
 * Security features:
 * - JWT/OIDC authentication (primary)
 * - API key authentication (development fallback)
 * - Rate limiting (30 requests/minute per IP)
 */

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const policies = listPolicies();
  return NextResponse.json({ policies });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const parsed = PolicySchema.parse(body);
    const created = createPolicy(parsed);
    return NextResponse.json({ policy: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid policy data" }, { status: 400 });
  }
}
