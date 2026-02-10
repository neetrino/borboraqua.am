import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { cartService } from "@/lib/services/cart.service";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    // Get language from query parameter or cookie, fallback to user locale or 'en'
    const langParam = req.nextUrl.searchParams.get('lang');
    const langCookie = req.cookies.get('shop_language');
    const locale = langParam || langCookie?.value || user.locale || 'en';

    const result = await cartService.getCart(user.id, locale);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [CART] Error:", error);
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

