import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";

/**
 * GET /api/v1/admin/settings/ips
 *
 * Returns backend outgoing IP (for FastShift whitelist) and client IP.
 * Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const ipRes = await fetch("https://api.ipify.org?format=json", {
      headers: { Accept: "application/json" },
    });
    const ipData = (await ipRes.json()) as { ip?: string };
    const backendIp = ipData?.ip ?? "—";

    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp =
      (forwarded?.split(",")[0]?.trim()) || realIp || "—";

    return NextResponse.json({
      backendIp,
      clientIp,
      note: "backendIp — исходящий IP сервера (для FastShift whitelist). clientIp — IP админа.",
    });
  } catch {
    return NextResponse.json(
      { backendIp: "—", clientIp: "—", error: "Failed to fetch IPs" },
      { status: 500 }
    );
  }
}
