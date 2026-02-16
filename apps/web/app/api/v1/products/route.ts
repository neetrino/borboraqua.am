import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { productsService } from "@/lib/services/products.service";

const PRODUCTS_LIST_CACHE_REVALIDATE = 60;

const isDbUnavailableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string; code?: string };
  return (
    e.name === "PrismaClientInitializationError" ||
    e.code === "P1001" ||
    e.code === "P1002" ||
    (typeof e.message === "string" &&
      (e.message.includes("does not exist on the database server") ||
        e.message.includes("Can't reach database server")))
  );
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 24;

  try {
    const filters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      filter: searchParams.get("filter") || searchParams.get("filters") || undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      colors: searchParams.get("colors") || undefined,
      sizes: searchParams.get("sizes") || undefined,
      brand: searchParams.get("brand") || undefined,
      sort: searchParams.get("sort") || "createdAt",
      page,
      limit,
      lang: searchParams.get("lang") || "en",
    };

    const cacheKey = [
      "products-list",
      filters.lang ?? "en",
      String(filters.page),
      String(filters.limit),
      filters.search ?? "",
      filters.filter ?? "",
      filters.category ?? "",
      String(filters.minPrice ?? ""),
      String(filters.maxPrice ?? ""),
      filters.sort ?? "createdAt",
    ];
    const result = await unstable_cache(
      () => productsService.findAll(filters),
      cacheKey,
      { revalidate: PRODUCTS_LIST_CACHE_REVALIDATE }
    )();
    console.log('✅ [PRODUCTS API] Result:', {
      dataLength: result.data?.length || 0,
      total: result.meta?.total || 0,
      page: result.meta?.page || 0,
      totalPages: result.meta?.totalPages || 0
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isDbUnavailableError(error)) {
      console.warn("⚠️ [PRODUCTS] Database unavailable, returning empty list:", (error as Error).message);
      return NextResponse.json({
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      });
    }
    console.error("❌ [PRODUCTS] Error:", error);
    const e = error as { type?: string; title?: string; status?: number; detail?: string; message?: string };
    return NextResponse.json(
      {
        type: e.type || "https://api.shop.am/problems/internal-error",
        title: e.title || "Internal Server Error",
        status: e.status || 500,
        detail: e.detail || e.message || "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

