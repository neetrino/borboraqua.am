import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { productsService } from "@/lib/services/products.service";

const PRODUCT_BY_SLUG_REVALIDATE = 120;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const result = await unstable_cache(
      () => productsService.findBySlug(slug, lang),
      ["product-slug", slug, lang],
      { revalidate: PRODUCT_BY_SLUG_REVALIDATE }
    )();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [PRODUCTS] Error:", error);
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

