import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const variant = await db.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            translations: { select: { slug: true } },
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Variant not found",
          status: 404,
          detail: `Variant with id '${id}' not found`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    const available = variant.stock > 0 && variant.published === true;
    const productSlug =
      (variant as { product?: { translations?: Array<{ slug?: string }> } }).product?.translations?.[0]?.slug ?? "";

    return NextResponse.json({
      id: variant.id,
      productId: variant.productId,
      productSlug: productSlug || undefined,
      stock: variant.stock,
      available: available,
    });
  } catch (error: any) {
    console.error("❌ [PRODUCTS] Get variant error:", error);
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

