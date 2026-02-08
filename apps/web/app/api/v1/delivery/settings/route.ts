import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/delivery/settings
 * Get delivery settings for checkout (public endpoint)
 * Returns schedule and time slots without sensitive data
 */
export async function GET(req: NextRequest) {
  try {
    console.log("🚚 [DELIVERY SETTINGS] GET request");
    const settings = await adminService.getDeliverySettings();
    console.log("✅ [DELIVERY SETTINGS] Delivery settings fetched");

    // Return only schedule and time slots (no locations for public endpoint)
    return NextResponse.json({
      schedule: settings.schedule,
      timeSlots: settings.timeSlots?.filter(slot => slot.enabled) || [],
    });
  } catch (error: any) {
    console.error("❌ [DELIVERY SETTINGS] GET Error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
      type: error?.type,
      title: error?.title,
      status: error?.status,
      detail: error?.detail,
      fullError: error,
    });
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 }
    );
  }
}


