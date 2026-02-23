import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/delivery/price
 * Get delivery price by regionId (or by city for backward compat with old orders)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const regionId = searchParams.get('regionId');
    const city = searchParams.get('city');

    if (!regionId && (!city || !city.trim())) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "regionId or city parameter is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    let price: number | null = null;
    if (regionId) {
      price = await adminService.getDeliveryPriceByRegionId(regionId);
    } else if (city?.trim()) {
      price = await adminService.getDeliveryPriceByRegionName(city.trim());
    }

    console.log("🚚 [DELIVERY PRICE] GET request:", { regionId, city });
    console.log("✅ [DELIVERY PRICE] Delivery price fetched:", price);

    return NextResponse.json({ price });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; type?: string; title?: string; detail?: string };
    console.error("❌ [DELIVERY PRICE] GET Error:", err);
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}

