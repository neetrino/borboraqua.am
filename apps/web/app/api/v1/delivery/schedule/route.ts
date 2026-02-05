import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/delivery/schedule
 * Public endpoint to get delivery schedule (enabled weekdays)
 */
export async function GET(req: NextRequest) {
  try {
    console.log("🚚 [DELIVERY SCHEDULE] GET request");
    const settings = await adminService.getDeliverySettings();

    const enabledWeekdays =
      settings.schedule?.enabledWeekdays && settings.schedule.enabledWeekdays.length > 0
        ? settings.schedule.enabledWeekdays
        : [2, 4];

    console.log("✅ [DELIVERY SCHEDULE] Returning schedule:", enabledWeekdays);

    return NextResponse.json({
      enabledWeekdays,
    });
  } catch (error: any) {
    console.error("❌ [DELIVERY SCHEDULE] GET Error:", {
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
        type: error?.type || "https://api.shop.am/problems/internal-error",
        title: error?.title || "Internal Server Error",
        status: error?.status || 500,
        detail: error?.detail || error?.message || "An error occurred",
        instance: req.url,
      },
      { status: error?.status || 500 },
    );
  }
}


