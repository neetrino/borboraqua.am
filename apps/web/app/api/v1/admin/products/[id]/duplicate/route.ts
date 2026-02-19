import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * POST /api/v1/admin/products/[id]/duplicate
 * Duplicate a product (create a copy as draft)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    console.log("📋 [ADMIN PRODUCTS] Duplicate request:", id);

    // Get the original product
    const originalProduct = await adminService.getProductById(id);
    if (!originalProduct) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Not Found",
          status: 404,
          detail: "Product not found",
          instance: req.url,
        },
        { status: 404 }
      );
    }

    // Generate new slug with -copy suffix
    const generateNewSlug = (originalSlug: string): string => {
      const timestamp = Date.now();
      return `${originalSlug}-copy-${timestamp}`;
    };

    // Prepare duplicate data
    const duplicateData = {
      slug: generateNewSlug(originalProduct.slug || `product-${id}`),
      translations: originalProduct.translations?.map((t: any) => ({
        locale: t.locale,
        title: `${t.title} (Copy)`,
        slug: generateNewSlug(t.slug || originalProduct.slug || `product-${id}`),
        descriptionHtml: t.descriptionHtml || null,
      })) || [],
      brandId: originalProduct.brandId || undefined,
      primaryCategoryId: originalProduct.primaryCategoryId || undefined,
      categoryIds: originalProduct.categoryIds || [],
      published: false, // Always create as draft
      featured: false, // Don't copy featured status
      minimumOrderQuantity: originalProduct.minimumOrderQuantity || 1,
      orderQuantityIncrement: originalProduct.orderQuantityIncrement || 1,
      media: originalProduct.media || [], // Copy media/images
      labels: originalProduct.labels || [],
      attributeIds: originalProduct.attributeIds || [],
      variants: originalProduct.variants?.map((variant: any) => ({
        price: variant.price || 0,
        compareAtPrice: variant.compareAtPrice || undefined,
        stock: variant.stock || 0,
        sku: variant.sku ? `${variant.sku}-copy` : undefined,
        color: variant.color || undefined,
        size: variant.size || undefined,
        imageUrl: variant.imageUrl || undefined,
        published: true, // Variants are published by default
        options: variant.options || [],
      })) || [],
    };

    // Create the duplicate product
    const duplicatedProduct = await adminService.createProduct(duplicateData);
    console.log("✅ [ADMIN PRODUCTS] Product duplicated:", {
      originalId: id,
      newId: duplicatedProduct?.id,
    });

    // Return the product with id for navigation
    return NextResponse.json(
      { id: duplicatedProduct?.id, ...duplicatedProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] Duplicate Error:", error);
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

