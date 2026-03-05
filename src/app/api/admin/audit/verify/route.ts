import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import { verifyLedger } from "@/lib/auditLedger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10000", 10), 10000);

  const result = await verifyLedger(limit);

  return NextResponse.json(result);
}
