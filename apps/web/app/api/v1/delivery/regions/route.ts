import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/delivery/regions
 * Public: list delivery regions (marzer) with id, name, price for checkout dropdown
 */
export async function GET(_req: NextRequest) {
  try {
    const regions = await adminService.getDeliveryRegions();
    return NextResponse.json({ regions });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; type?: string; title?: string; detail?: string };
    console.error("❌ [DELIVERY REGIONS] GET Error:", err);
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
      },
      { status: err.status || 500 }
    );
  }
}
