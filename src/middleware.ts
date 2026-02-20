import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function getAdminUiKey(): Buffer | null {
  const k = process.env.ADMIN_UI_KEY;
  if (k && k.length > 0) return Buffer.from(k);
  if (process.env.NODE_ENV === "production") return null;
  return Buffer.from("dev-ui-key-12345");
}

function secureCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b) === true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin UI routes
  if (pathname.startsWith("/admin")) {
    const expected = getAdminUiKey();
    if (!expected) {
      return NextResponse.json(
        { error: "Admin UI not configured" },
        { status: 500 }
      );
    }

    // Get header and compare securely
    const provided = req.headers.get("x-admin-ui-key");
    if (!provided) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const providedBuffer = Buffer.from(provided);
    if (!secureCompare(providedBuffer, expected)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
