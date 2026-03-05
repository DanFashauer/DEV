import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import { getAuditRecords } from "@/lib/auditLedger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "1000", 10), 10000);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const records = await getAuditRecords(limit, offset);

  // Return as NDJSON (newline-delimited JSON)
  const ndjson = records.map((r) => JSON.stringify(r)).join("\n");

  return new NextResponse(ndjson, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "X-Total-Count": records.length.toString(),
    },
  });
}
