import { NextRequest, NextResponse } from "next/server";
import { 
  requireAdminAuth, 
  adminSuccess, 
  adminError,
} from "@/lib/adminAuth";
import { getPolicy, updatePolicy, deletePolicy } from "@/lib/policy/store/policyStore";
import { PolicySchema } from "@/lib/policy/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const { id } = await params;
  const policy = getPolicy(id);

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

  const { id } = await params;
  const body = await request.json();

  const updated = updatePolicy(id, body);

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

  const { id } = await params;
  const deleted = deletePolicy(id);

  if (!deleted) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
