import { db } from "@white-shop/db";
import { Prisma } from "@prisma/client";
import { adminService } from "./admin.service";
import { t } from "../i18n";
import { ensureProductVariantAttributesColumn } from "../utils/db-ensure";
import {
  processImageUrl,
  smartSplitUrls,
  cleanImageUrls,
  separateMainAndVariantImages,
} from "../utils/image-utils";

interface ProductFilters {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
  lang?: string;
  /** When true, returns minimal fields for listing (e.g. home page). Keeps payload under Next.js cache limit. */
  listOnly?: boolean;
}

// Типы для продуктов с включенными отношениями
// Используем any для обхода проблем с типами Prisma
type ProductWithRelations = any;

/**
 * Get "Out of Stock" translation for a given language
 */
const getOutOfStockLabel = (lang: string = "en"): string => {
  return t(lang as any, "common.stock.outOfStock");
};

class ProductsService {
  /**
   * Get all child category IDs recursively
   */
  private async getAllChildCategoryIds(parentId: string): Promise<string[]> {
    const children = await db.category.findMany({
      where: {
        parentId: parentId,
        published: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    
    let allChildIds = children.map((c: { id: string }) => c.id);
    
    // Recursively get children of children
    for (const child of children) {
      const grandChildren = await this.getAllChildCategoryIds(child.id);
      allChildIds = [...allChildIds, ...grandChildren];
    }
    
    return allChildIds;
  }

  /**
   * Get all products with filters
   */
  async findAll(filters: ProductFilters) {
    const {
      category,
      search,
      filter,
      minPrice,
      maxPrice,
      sort = "createdAt",
      page = 1,
      limit = 24,
      lang = "en",
      listOnly = false,
    } = filters;

    const bestsellerProductIds: string[] = [];

    // Build where clause
    const where: Record<string, unknown> = {
      published: true,
      deletedAt: null,
    };

    // Price filter at DB level
    if (minPrice != null || maxPrice != null) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (minPrice != null) priceFilter.gte = minPrice;
      if (maxPrice != null) priceFilter.lte = maxPrice;
      const existingAnd = Array.isArray(where.AND) ? where.AND : [];
      where.AND = [...existingAnd, { variants: { some: { price: priceFilter } } }];
    }

    // Add search filter
    if (search && search.trim()) {
      where.OR = [
        {
          translations: {
            some: {
              title: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
          },
        },
        {
          translations: {
            some: {
              subtitle: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
          },
        },
        {
          variants: {
            some: {
              sku: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    // Add category filter
    if (category) {
      console.log('🔍 [PRODUCTS SERVICE] Looking for category:', { category, lang });
      let categoryDoc = await db.category.findFirst({
        where: {
          translations: {
            some: {
              slug: category,
              locale: lang,
            },
          },
          published: true,
          deletedAt: null,
        },
      });

      // If category not found in current language, try to find it in other languages (fallback)
      if (!categoryDoc) {
        console.warn('⚠️ [PRODUCTS SERVICE] Category not found in language:', { category, lang });
        console.log('🔄 [PRODUCTS SERVICE] Trying to find category in other languages...');
        categoryDoc = await db.category.findFirst({
          where: {
            translations: {
              some: {
                slug: category,
              },
            },
            published: true,
            deletedAt: null,
          },
        });
        
        if (categoryDoc) {
          console.log('✅ [PRODUCTS SERVICE] Category found in different language:', { 
            id: categoryDoc.id, 
            slug: category,
            foundIn: categoryDoc.translations?.find((t: { slug: string; locale: string }) => t.slug === category)?.locale || 'unknown'
          });
        }
      }

      if (categoryDoc) {
        console.log('✅ [PRODUCTS SERVICE] Category found:', { id: categoryDoc.id, slug: category });
        
        // Get all child categories (subcategories) recursively
        const childCategoryIds = await this.getAllChildCategoryIds(categoryDoc.id);
        const allCategoryIds = [categoryDoc.id, ...childCategoryIds];
        
        console.log('📂 [PRODUCTS SERVICE] Category IDs to include:', {
          parent: categoryDoc.id,
          children: childCategoryIds,
          total: allCategoryIds.length
        });
        
        // Build OR conditions for all categories (parent + children)
        const categoryConditions = allCategoryIds.flatMap((catId: string) => [
          { primaryCategoryId: catId },
          { categoryIds: { has: catId } },
        ]);
        
        if (where.OR) {
          where.AND = [
            { OR: where.OR },
            {
              OR: categoryConditions,
            },
          ];
          delete where.OR;
        } else {
          where.OR = categoryConditions;
        }
      } else {
        console.warn('⚠️ [PRODUCTS SERVICE] Category not found in any language:', { category, lang });
        // Return empty result if category not found
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }
    }

    // Add filter for new, featured, bestseller
    if (filter === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    } else if (filter === "featured") {
      where.featured = true;
    } else if (filter === "bestseller") {
      type BestsellerVariant = { variantId: string | null; _sum: { quantity: number | null } };
      const bestsellerVariants: BestsellerVariant[] = await db.orderItem.groupBy({
        by: ["variantId"],
        _sum: { quantity: true },
        where: {
          variantId: {
            not: null,
          },
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 200,
      });

      const variantIds = bestsellerVariants
        .map((item) => item.variantId)
        .filter((id): id is string => Boolean(id));

      if (variantIds.length > 0) {
        const variantProductMap = await db.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, productId: true },
        });

        const variantToProduct = new Map<string, string>();
        variantProductMap.forEach(({ id, productId }: { id: string; productId: string }) => {
          variantToProduct.set(id, productId);
        });

        const productSales = new Map<string, number>();
        bestsellerVariants.forEach((item: BestsellerVariant) => {
          const variantId = item.variantId;
          if (!variantId) return;
          const productId = variantToProduct.get(variantId);
          if (!productId) return;
          const qty = item._sum?.quantity || 0;
          productSales.set(productId, (productSales.get(productId) || 0) + qty);
        });

        bestsellerProductIds.push(
          ...Array.from(productSales.entries())
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .map(([productId]) => productId)
        );

        if (bestsellerProductIds.length > 0) {
          where.id = {
            in: bestsellerProductIds,
          };
        }
      }
    }

    const skip = (page - 1) * limit;

    // List query: only fields needed for listing (pagination + minimal payload)
    const listInclude = {
      translations: {
        select: { locale: true, slug: true, title: true, subtitle: true, descriptionHtml: true },
      },
      brand: {
        select: {
          id: true,
          translations: { select: { locale: true, name: true } },
        },
      },
      variants: {
        where: { published: true },
        select: { id: true, price: true, compareAtPrice: true, stock: true },
        orderBy: { price: 'asc' as const },
        take: 1,
      },
      labels: {
        select: { id: true, type: true, value: true, position: true, color: true },
      },
      categories: {
        select: {
          id: true,
          translations: { select: { locale: true, slug: true, title: true } },
        },
      },
      // Note: media is a scalar field (Json[]), so it's automatically included, no need to add it to include
    };

    let products: ProductWithRelations[];
    let total: number;

    if (filter === "bestseller" && bestsellerProductIds.length > 0) {
      total = bestsellerProductIds.length;
      const pageIds = bestsellerProductIds.slice(skip, skip + limit);
      if (pageIds.length === 0) {
        products = [];
      } else {
        const whereBestseller = { ...where, id: { in: pageIds } };
        products = await db.product.findMany({
          where: whereBestseller,
          include: listInclude,
        });
        const rank = new Map(pageIds.map((id, i) => [id, i]));
        products.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
      }
    } else {
      total = await db.product.count({ where });
      const orderBy =
        sort === "price"
          ? ({ variants: { _min: { price: "desc" as const } } } as const)
          : ({ createdAt: "desc" as const } as const);
      products = await db.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: listInclude,
      });
    }

    // Get discount settings
    const discountSettings = await db.settings.findMany({
      where: {
        key: {
          in: ["globalDiscount", "categoryDiscounts", "brandDiscounts"],
        },
      },
    });

    const globalDiscount =
      Number(
        discountSettings.find((s: { key: string; value: unknown }) => s.key === "globalDiscount")?.value
      ) || 0;
    
    const categoryDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "categoryDiscounts");
    const categoryDiscounts = categoryDiscountsSetting ? (categoryDiscountsSetting.value as Record<string, number>) || {} : {};
    
    const brandDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "brandDiscounts");
    const brandDiscounts = brandDiscountsSetting ? (brandDiscountsSetting.value as Record<string, number>) || {} : {};

    // Fetch all categories that are missing from relations (for products with primaryCategoryId but empty categories array)
    const primaryCategoryIds = products
      .map((p: ProductWithRelations) => (p as any).primaryCategoryId)
      .filter((id: string | null | undefined): id is string => !!id);
    
    const categoriesMap = new Map<string, { id: string; translations: Array<{ locale: string; title: string }> }>();
    if (primaryCategoryIds.length > 0) {
      try {
        const missingCategories = await db.category.findMany({
          where: {
            id: { in: primaryCategoryIds },
          },
          include: {
            translations: {
              select: { locale: true, title: true },
            },
          },
        });
        missingCategories.forEach((cat: { id: string; translations?: Array<{ locale: string; title: string }> }) => {
          categoriesMap.set(cat.id, {
            id: cat.id,
            translations: cat.translations || [],
          });
        });
      } catch (err) {
        console.warn('[ProductsService] Error fetching missing categories:', err);
      }
    }

    // Format response
    const data = products.map((product: ProductWithRelations) => {
      // Безопасное получение translation с проверкой на существование массива
      const translations = Array.isArray(product.translations) ? product.translations : [];
      const translation = translations.find((t: { locale: string }) => t.locale === lang) || translations[0] || null;
      
      // Безопасное получение brand translation
      const brandTranslations = product.brand && Array.isArray(product.brand.translations)
        ? product.brand.translations
        : [];
      const brandTranslation = brandTranslations.length > 0
        ? brandTranslations.find((t: { locale: string }) => t.locale === lang) || brandTranslations[0]
        : null;
      
      // Безопасное получение variant
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const variant = variants.length > 0
        ? variants.sort((a: { price: number }, b: { price: number }) => a.price - b.price)[0]
        : null;

      const originalPrice = variant?.price || 0;
      let finalPrice = originalPrice;
      const productDiscount = product.discountPercent || 0;
      let appliedDiscount = 0;
      if (productDiscount > 0) {
        appliedDiscount = productDiscount;
      } else {
        const primaryCategoryId = product.primaryCategoryId;
        if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
          appliedDiscount = categoryDiscounts[primaryCategoryId];
        } else {
          const brandId = product.brandId;
          if (brandId && brandDiscounts[brandId]) {
            appliedDiscount = brandDiscounts[brandId];
          } else if (globalDiscount > 0) {
            appliedDiscount = globalDiscount;
          }
        }
      }
      if (appliedDiscount > 0 && originalPrice > 0) {
        finalPrice = originalPrice * (1 - appliedDiscount / 100);
      }

      const image = (() => {
        if (!Array.isArray(product.media) || product.media.length === 0) return null;
        const firstImage = processImageUrl(product.media[0]);
        return firstImage || null;
      })();

      if (listOnly) {
        // Get primary category title for list view
        const categories = Array.isArray(product.categories) ? product.categories : [];
        const primaryCategoryId = (product as any).primaryCategoryId;
        
        // Try to find primary category first, then fallback to first category
        let selectedCategory = null;
        if (primaryCategoryId && categories.length > 0) {
          selectedCategory = categories.find((cat: { id: string }) => cat.id === primaryCategoryId);
        }
        if (!selectedCategory && categories.length > 0) {
          selectedCategory = categories[0];
        }
        
        // If categories array is empty but primaryCategoryId exists, use category from batch fetch
        if (!selectedCategory && primaryCategoryId) {
          selectedCategory = categoriesMap.get(primaryCategoryId) || null;
        }
        
        // Get category title from translations
        let categoryTitle: string | null = null;
        if (selectedCategory) {
          const categoryTranslations = Array.isArray(selectedCategory.translations)
            ? selectedCategory.translations
            : [];
          const categoryTranslation = categoryTranslations.find((t: { locale: string }) => t.locale === lang)
            || categoryTranslations[0]
            || null;
          categoryTitle = categoryTranslation?.title || null;
        }
        
        return {
          id: product.id,
          slug: translation?.slug || "",
          title: translation?.title || "",
          subtitle: translation?.subtitle || null,
          description: translation?.descriptionHtml || null,
          category: categoryTitle,
          brand: product.brand
            ? { id: product.brand.id, name: brandTranslation?.name || "" }
            : null,
          price: finalPrice,
          image,
          inStock: (variant?.stock || 0) > 0,
          minimumOrderQuantity: (product as any).minimumOrderQuantity || 1,
          orderQuantityIncrement: (product as any).orderQuantityIncrement || 1,
          defaultVariantId: (variant as any)?.id || null,
        };
      }

      // Get all unique colors from ALL variants with imageUrl and colors hex (support both new and old format)
      // IMPORTANT: Only collect colors that actually exist in variants
      // IMPORTANT: Process ALL variants to get ALL colors, not just the first variant
      const colorMap = new Map<string, { value: string; imageUrl?: string | null; colors?: string[] | null }>();

      // Process all variants to collect all unique colors
      variants.forEach((v: any) => {
        // First, try to get ALL color options from variant.options (not just the first one)
        const options = Array.isArray(v.options) ? v.options : [];
        const colorOptions = options.filter((opt: any) => {
          // Support both new format (AttributeValue) and old format (attributeKey/value)
          if (opt.attributeValue) {
            return opt.attributeValue.attribute?.key === "color";
          }
          return opt.attributeKey === "color";
        });
        
        // Process all color options from this variant
        colorOptions.forEach((colorOption: any) => {
          let colorValue = "";
          let imageUrl: string | null | undefined = null;
          let colorsHex: string[] | null | undefined = null;
          
          if (colorOption.attributeValue) {
            // New format: get from translation or value
            const translation = colorOption.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || colorOption.attributeValue.translations?.[0];
            colorValue = translation?.label || colorOption.attributeValue.value || "";
            // Get imageUrl and colors from AttributeValue
            imageUrl = colorOption.attributeValue.imageUrl || null;
            colorsHex = colorOption.attributeValue.colors || null;
          } else {
            // Old format: use value directly
            colorValue = colorOption.value || "";
          }
          
          if (colorValue) {
            const normalizedValue = colorValue.trim().toLowerCase();
            // Store color with imageUrl and colors hex if not already stored or if we have better data
            if (!colorMap.has(normalizedValue) || (imageUrl && !colorMap.get(normalizedValue)?.imageUrl)) {
              colorMap.set(normalizedValue, {
                value: colorValue.trim(),
                imageUrl: imageUrl || null,
                colors: colorsHex || null,
              });
            }
          }
        });
        
        // Fallback: check variant.attributes JSONB column if options don't have color
        // This handles cases where colors are stored in JSONB but not in options
        if (colorOptions.length === 0 && v.attributes && typeof v.attributes === 'object' && v.attributes.color) {
          const colorAttributes = Array.isArray(v.attributes.color) ? v.attributes.color : [v.attributes.color];
          colorAttributes.forEach((colorAttr: any) => {
            const colorValue = colorAttr?.value || colorAttr;
            if (colorValue && typeof colorValue === 'string') {
              const normalizedValue = colorValue.trim().toLowerCase();
              // Only add if not already in colorMap
              if (!colorMap.has(normalizedValue)) {
                colorMap.set(normalizedValue, {
                  value: colorValue.trim(),
                  imageUrl: null,
                  colors: null,
                });
              }
            }
          });
        }
      });

      // Also check productAttributes for color attribute values with imageUrl and colors
      // IMPORTANT: Only update colors that already exist in variants (already in colorMap)
      // Do not add new colors that don't exist in variants
      if ((product as any).productAttributes && Array.isArray((product as any).productAttributes)) {
        (product as any).productAttributes.forEach((productAttr: any) => {
          if (productAttr.attribute?.key === 'color' && productAttr.attribute?.values) {
            productAttr.attribute.values.forEach((attrValue: any) => {
              const translation = attrValue.translations?.find((t: { locale: string }) => t.locale === lang) || attrValue.translations?.[0];
              const colorValue = translation?.label || attrValue.value || "";
              if (colorValue) {
                const normalizedValue = colorValue.trim().toLowerCase();
                // Only update if color already exists in colorMap (i.e., exists in variants)
                // This ensures we only show colors that actually exist in product variants
                if (colorMap.has(normalizedValue)) {
                  const existing = colorMap.get(normalizedValue);
                  // Update with imageUrl and colors hex from productAttributes if available
                  if (attrValue.imageUrl || attrValue.colors) {
                    colorMap.set(normalizedValue, {
                      value: colorValue.trim(),
                      imageUrl: attrValue.imageUrl || existing?.imageUrl || null,
                      colors: attrValue.colors || existing?.colors || null,
                    });
                  }
                }
              }
            });
          }
        });
      }
      
      const availableColors = Array.from(colorMap.values());

      // Get categories with translations
      const categories = Array.isArray(product.categories) ? product.categories.map((cat: { id: string; translations?: Array<{ locale: string; slug: string; title: string }> }) => {
        const catTranslations = Array.isArray(cat.translations) ? cat.translations : [];
        const catTranslation = catTranslations.find((t: { locale: string }) => t.locale === lang) || catTranslations[0] || null;
        return {
          id: cat.id,
          slug: catTranslation?.slug || "",
          title: catTranslation?.title || "",
        };
      }) : [];

      return {
        id: product.id,
        slug: translation?.slug || "",
        title: translation?.title || "",
        description: translation?.descriptionHtml || null,
        brand: product.brand
          ? {
              id: product.brand.id,
              name: brandTranslation?.name || "",
            }
          : null,
        categories,
        price: finalPrice,
        originalPrice: appliedDiscount > 0 ? originalPrice : variant?.compareAtPrice || null,
        compareAtPrice: variant?.compareAtPrice || null,
        discountPercent: appliedDiscount > 0 ? appliedDiscount : null,
        image,
        inStock: (variant?.stock || 0) > 0,
        defaultVariantId: (variant as any)?.id || null,
        labels: (() => {
          // Map existing labels
          const existingLabels = Array.isArray(product.labels) ? product.labels.map((label: { id: string; type: string; value: string; position: string; color: string | null }) => ({
            id: label.id,
            type: label.type,
            value: label.value,
            position: label.position,
            color: label.color,
          })) : [];
          
          // Check if product is out of stock
          const isOutOfStock = (variant?.stock || 0) <= 0;
          
          // If out of stock, add "Out of Stock" label
          if (isOutOfStock) {
            // Check if "Out of Stock" label already exists
            const outOfStockText = getOutOfStockLabel(lang);
            const hasOutOfStockLabel = existingLabels.some(
              (label: { value: string }) => label.value.toLowerCase() === outOfStockText.toLowerCase() ||
                         label.value.toLowerCase().includes('out of stock') ||
                         label.value.toLowerCase().includes('արտադրված') ||
                         label.value.toLowerCase().includes('нет в наличии') ||
                         label.value.toLowerCase().includes('არ არის მარაგში')
            );
            
            if (!hasOutOfStockLabel) {
              // Check if top-left position is available, otherwise use top-right
              const topLeftOccupied = existingLabels.some((l: { position: string }) => l.position === 'top-left');
              const position = topLeftOccupied ? 'top-right' : 'top-left';
              
              existingLabels.push({
                id: `out-of-stock-${product.id}`,
                type: 'text',
                value: outOfStockText,
                position: position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
                color: '#6B7280', // Gray color for out of stock
              });
            }
          }

          return existingLabels;
        })(),
        colors: availableColors,
        minimumOrderQuantity: (product as any).minimumOrderQuantity || 1,
        orderQuantityIncrement: (product as any).orderQuantityIncrement || 1,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  /**
   * Get price range
   */
  async getPriceRange(filters: { category?: string; lang?: string }) {
    const where: any = {
      published: true,
      deletedAt: null,
    };

    if (filters.category) {
      const categoryDoc = await db.category.findFirst({
        where: {
          translations: {
            some: {
              slug: filters.category,
              locale: filters.lang || "en",
            },
          },
        },
      });

      if (categoryDoc) {
        where.OR = [
          { primaryCategoryId: categoryDoc.id },
          { categoryIds: { has: categoryDoc.id } },
        ];
      }
    }

    const products = await db.product.findMany({
      where,
      include: {
        variants: {
          where: {
            published: true,
          },
        },
      },
    });

    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((product: { variants: Array<{ price: number }> }) => {
      if (product.variants.length > 0) {
        const prices = product.variants.map((v: { price: number }) => v.price);
        const productMin = Math.min(...prices);
        const productMax = Math.max(...prices);
        if (productMin < minPrice) minPrice = productMin;
        if (productMax > maxPrice) maxPrice = productMax;
      }
    });

    minPrice = minPrice === Infinity ? 0 : Math.floor(minPrice / 1000) * 1000;
    maxPrice = maxPrice === 0 ? 100000 : Math.ceil(maxPrice / 1000) * 1000;

    // Load price filter settings to provide optional step sizes per currency
    let stepSize: number | null = null;
    let stepSizePerCurrency: {
      USD?: number;
      AMD?: number;
      RUB?: number;
      GEL?: number;
    } | null = null;

    try {
      const settings = await adminService.getPriceFilterSettings();
      stepSize = settings.stepSize ?? null;

      if (settings.stepSizePerCurrency) {
        // stepSizePerCurrency in settings is stored in display currency units.
        // Here we pass them through to the frontend as-is; the slider logic
        // will choose the appropriate value for the active currency.
        stepSizePerCurrency = {
          USD: settings.stepSizePerCurrency.USD ?? undefined,
          AMD: settings.stepSizePerCurrency.AMD ?? undefined,
          RUB: settings.stepSizePerCurrency.RUB ?? undefined,
          GEL: settings.stepSizePerCurrency.GEL ?? undefined,
        };
      }
    } catch (error) {
      console.error('❌ [PRODUCTS SERVICE] Error loading price filter settings for price range:', error);
    }

    return {
      min: minPrice,
      max: maxPrice,
      stepSize,
      stepSizePerCurrency,
    };
  }

  /**
   * Get product by slug
   */
  async findBySlug(slug: string, lang: string = "en") {
    // Base include without productAttributes (for backward compatibility)
    const baseInclude = {
      translations: true,
      brand: {
        include: {
          translations: true,
        },
      },
      categories: {
        include: {
          translations: true,
        },
      },
      variants: {
        where: {
          published: true,
        },
        include: {
          options: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                  translations: true,
                },
              },
            },
          },
        },
      },
      labels: true,
    };

    // Try to include productAttributes, but fallback if table doesn't exist
    // Also handle case when attribute_values.colors column doesn't exist
    let product;
    try {
      product = await db.product.findFirst({
        where: {
          translations: {
            some: { slug },
          },
          published: true,
          deletedAt: null,
        },
        include: {
          ...baseInclude,
          productAttributes: {
            include: {
              attribute: {
                include: {
                  translations: true,
                  values: {
                    include: {
                      translations: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      // If productAttributes table doesn't exist, retry without it
      if (error?.code === 'P2021' || error?.message?.includes('product_attributes') || error?.message?.includes('does not exist')) {
        console.warn('⚠️ [PRODUCTS SERVICE] product_attributes table not found, fetching without it:', error.message);
        try {
          product = await db.product.findFirst({
            where: {
              translations: { some: { slug } },
              published: true,
              deletedAt: null,
            },
            include: baseInclude,
          });
        } catch (retryError: any) {
          // If product_variants.attributes column doesn't exist, try to create it and retry
          if (retryError?.message?.includes('product_variants.attributes') || 
              (retryError?.message?.includes('attributes') && retryError?.message?.includes('does not exist'))) {
            console.warn('⚠️ [PRODUCTS SERVICE] product_variants.attributes column not found, attempting to create it...');
            try {
              await ensureProductVariantAttributesColumn();
              // Retry the query after creating the column
              product = await db.product.findFirst({
                where: {
                  translations: { some: { slug } },
                  published: true,
                  deletedAt: null,
                },
                include: baseInclude,
              });
            } catch (attributesError: any) {
              // If still fails, try without attributeValue include
              if (attributesError?.code === 'P2022' || attributesError?.message?.includes('attribute_values.colors') || attributesError?.message?.includes('does not exist')) {
                console.warn('⚠️ [PRODUCTS SERVICE] attribute_values.colors column not found, fetching without attributeValue:', attributesError.message);
                const baseIncludeWithoutAttributeValue = {
                  ...baseInclude,
                  variants: {
                    ...baseInclude.variants,
                    include: {
                      options: true, // Include options without attributeValue relation
                    },
                  },
                };
                product = await db.product.findFirst({
                  where: {
                    translations: { some: { slug } },
                    published: true,
                    deletedAt: null,
                  },
                  include: baseIncludeWithoutAttributeValue,
                });
              } else {
                throw attributesError;
              }
            }
          } else if (retryError?.code === 'P2022' || retryError?.message?.includes('attribute_values.colors') || retryError?.message?.includes('does not exist')) {
            // If attribute_values.colors column doesn't exist, retry without attributeValue include
            console.warn('⚠️ [PRODUCTS SERVICE] attribute_values.colors column not found, fetching without attributeValue:', retryError.message);
            const baseIncludeWithoutAttributeValue = {
              ...baseInclude,
              variants: {
                ...baseInclude.variants,
                include: {
                  options: true, // Include options without attributeValue relation
                },
              },
            };
            product = await db.product.findFirst({
              where: {
                translations: { some: { slug } },
                published: true,
                deletedAt: null,
              },
              include: baseIncludeWithoutAttributeValue,
            });
          } else {
            throw retryError;
          }
        }
      } else if (error?.message?.includes('product_variants.attributes') || 
                 (error?.message?.includes('attributes') && error?.message?.includes('does not exist'))) {
        // If product_variants.attributes column doesn't exist, try to create it and retry
        console.warn('⚠️ [PRODUCTS SERVICE] product_variants.attributes column not found, attempting to create it...');
        try {
          await ensureProductVariantAttributesColumn();
          // Retry the query after creating the column
          product = await db.product.findFirst({
            where: {
              translations: { some: { slug } },
              published: true,
              deletedAt: null,
            },
            include: baseInclude,
          });
        } catch (attributesError: any) {
          // If still fails, try without attributeValue include
          if (attributesError?.code === 'P2022' || attributesError?.message?.includes('attribute_values.colors') || attributesError?.message?.includes('does not exist')) {
            console.warn('⚠️ [PRODUCTS SERVICE] attribute_values.colors column not found, fetching without attributeValue:', attributesError.message);
            const baseIncludeWithoutAttributeValue = {
              ...baseInclude,
              variants: {
                ...baseInclude.variants,
                include: {
                  options: true, // Include options without attributeValue relation
                },
              },
            };
            product = await db.product.findFirst({
              where: {
                translations: { some: { slug } },
                published: true,
                deletedAt: null,
              },
              include: baseIncludeWithoutAttributeValue,
            });
          } else {
            throw attributesError;
          }
        }
      } else if (error?.code === 'P2022' || error?.message?.includes('attribute_values.colors') || error?.message?.includes('does not exist')) {
        // If attribute_values.colors column doesn't exist, retry without attributeValue include
        console.warn('⚠️ [PRODUCTS SERVICE] attribute_values.colors column not found, fetching without attributeValue:', error.message);
        const baseIncludeWithoutAttributeValue = {
          ...baseInclude,
          variants: {
            ...baseInclude.variants,
            include: {
              options: true, // Include options without attributeValue relation
            },
          },
        };
        try {
          product = await db.product.findFirst({
            where: {
              translations: { some: { slug } },
              published: true,
              deletedAt: null,
            },
            include: {
              ...baseIncludeWithoutAttributeValue,
              productAttributes: {
                include: {
                  attribute: {
                    include: {
                      translations: true,
                      values: {
                        include: {
                          translations: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } catch (retryError: any) {
          // If productAttributes also fails, try without it
          if (retryError?.code === 'P2021' || retryError?.message?.includes('product_attributes')) {
            product = await db.product.findFirst({
              where: {
                translations: { some: { slug } },
                published: true,
                deletedAt: null,
              },
              include: baseIncludeWithoutAttributeValue,
            });
          } else {
            throw retryError;
          }
        }
      } else {
        // Re-throw if it's a different error
        throw error;
      }
    }

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with slug '${slug}' does not exist or is not published`,
      };
    }

    // Безопасное получение translation с проверкой на существование массива
    const translations = Array.isArray(product.translations) ? product.translations : [];
    const translation = translations.find((t: { locale: string }) => t.locale === lang) || translations[0] || null;
    
    // Безопасное получение brand translation
    const brandTranslations = product.brand && Array.isArray(product.brand.translations)
      ? product.brand.translations
      : [];
    const brandTranslation = brandTranslations.length > 0
      ? brandTranslations.find((t: { locale: string }) => t.locale === lang) || brandTranslations[0]
      : null;

    // Get all discount settings
    const discountSettings = await db.settings.findMany({
      where: {
        key: {
          in: ["globalDiscount", "categoryDiscounts", "brandDiscounts"],
        },
      },
    });

    const globalDiscountSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "globalDiscount");
    const globalDiscount = Number(globalDiscountSetting?.value) || 0;
    
    const categoryDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "categoryDiscounts");
    const categoryDiscounts = categoryDiscountsSetting ? (categoryDiscountsSetting.value as Record<string, number>) || {} : {};
    
    const brandDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "brandDiscounts");
    const brandDiscounts = brandDiscountsSetting ? (brandDiscountsSetting.value as Record<string, number>) || {} : {};
    
    const productDiscount = product.discountPercent || 0;
    
    // Calculate actual discount with priority: productDiscount > categoryDiscount > brandDiscount > globalDiscount
    let actualDiscount = 0;
    if (productDiscount > 0) {
      actualDiscount = productDiscount;
    } else {
      // Check category discounts
      const primaryCategoryId = product.primaryCategoryId;
      if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
        actualDiscount = categoryDiscounts[primaryCategoryId];
      } else {
        // Check brand discounts
        const brandId = product.brandId;
        if (brandId && brandDiscounts[brandId]) {
          actualDiscount = brandDiscounts[brandId];
        } else if (globalDiscount > 0) {
          actualDiscount = globalDiscount;
        }
      }
    }

    const firstTranslation = translations[0] || null;
    return {
      id: product.id,
      slug: translation?.slug || firstTranslation?.slug || "",
      title: translation?.title || firstTranslation?.title || "",
      translations: translations.map((t: { locale: string; slug?: string; title?: string }) => ({
        locale: t.locale,
        slug: t.slug ?? "",
        title: t.title ?? "",
      })),
      subtitle: translation?.subtitle || null,
      description: translation?.descriptionHtml || null,
      brand: product.brand
        ? {
            id: product.brand.id,
            slug: product.brand.slug,
            name: brandTranslation?.name || "",
            logo: product.brand.logoUrl,
          }
        : null,
      categories: Array.isArray(product.categories) ? product.categories.map((cat: { id: string; translations?: Array<{ locale: string; slug: string; title: string }> }) => {
        const catTranslations = Array.isArray(cat.translations) ? cat.translations : [];
        const catTranslation = catTranslations.find((t: { locale: string }) => t.locale === lang) || catTranslations[0] || null;
        return {
          id: cat.id,
          slug: catTranslation?.slug || "",
          title: catTranslation?.title || "",
        };
      }) : [],
      media: (() => {
        // Use unified image utilities for consistent processing
        if (!Array.isArray(product.media)) {
          console.log('📸 [PRODUCTS SERVICE] Product media is not an array, returning empty array');
          return [];
        }
        
        // Collect all variant images for separation
        const variantImages: any[] = [];
        if (Array.isArray(product.variants) && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            if (variant.imageUrl) {
              // Use smartSplitUrls to handle comma-separated and base64 images
              const urls = smartSplitUrls(variant.imageUrl);
              variantImages.push(...urls);
            }
          });
        }
        
        // Separate main images from variant images using unified utility
        const { main } = separateMainAndVariantImages(product.media, variantImages);
        
        // Clean and validate final main images
        const cleanedMain = cleanImageUrls(main);
        
        console.log('📸 [PRODUCTS SERVICE] Main media images count (after cleanup):', cleanedMain.length);
        console.log('📸 [PRODUCTS SERVICE] Variant images excluded:', variantImages.length);
        if (cleanedMain.length > 0) {
          console.log('📸 [PRODUCTS SERVICE] Main media (first 3):', cleanedMain.slice(0, 3).map((img: string) => img.substring(0, 50)));
        }
        
        return cleanedMain;
      })(),
      labels: (() => {
        // Map existing labels
        const existingLabels = Array.isArray(product.labels) ? product.labels.map((label: { id: string; type: string; value: string; position: string; color: string | null }) => ({
          id: label.id,
          type: label.type,
          value: label.value,
          position: label.position,
          color: label.color,
        })) : [];
        
        // Check if all variants are out of stock
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const isOutOfStock = variants.length === 0 || variants.every((v: { stock: number }) => (v.stock || 0) <= 0);
        
        // If out of stock, add "Out of Stock" label
        if (isOutOfStock) {
          // Check if "Out of Stock" label already exists
          const outOfStockText = getOutOfStockLabel(lang);
          const hasOutOfStockLabel = existingLabels.some(
            (label: { value: string }) => label.value.toLowerCase() === outOfStockText.toLowerCase() ||
                       label.value.toLowerCase().includes('out of stock') ||
                       label.value.toLowerCase().includes('արտադրված') ||
                       label.value.toLowerCase().includes('нет в наличии') ||
                       label.value.toLowerCase().includes('არ არის მარაგში')
          );
          
          if (!hasOutOfStockLabel) {
            // Check if top-left position is available, otherwise use top-right
            const topLeftOccupied = existingLabels.some((l: { position: string }) => l.position === 'top-left');
            const position = topLeftOccupied ? 'top-right' : 'top-left';
            
            existingLabels.push({
              id: `out-of-stock-${product.id}`,
              type: 'text',
              value: outOfStockText,
              position: position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
              color: '#6B7280', // Gray color for out of stock
            });
          }
        }

        return existingLabels;
      })(),
      variants: Array.isArray(product.variants) ? product.variants
        .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
        .map((variant: { id: string; sku: string | null; price: number; compareAtPrice: number | null; stock: number; imageUrl?: string | null; options?: Array<{ attributeKey?: string | null; value?: string | null }> }) => {
          const originalPrice = variant.price;
          let finalPrice = originalPrice;
          let discountPrice = null;

          if (actualDiscount > 0 && originalPrice > 0) {
            discountPrice = originalPrice;
            finalPrice = originalPrice * (1 - actualDiscount / 100);
          }

          // Process and clean variant imageUrl
          let variantImageUrl: string | null = null;
          if (variant.imageUrl) {
            // Use smartSplitUrls to handle comma-separated URLs
            const urls = smartSplitUrls(variant.imageUrl);
            // Process and validate each URL
            const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
            // Use first valid URL, or join if multiple (comma-separated)
            variantImageUrl = processedUrls.length > 0 ? processedUrls.join(',') : null;
          }
          
          // Log variant image for verification
          if (variantImageUrl) {
            console.log(`📸 [PRODUCTS SERVICE] Variant ${variant.id} (SKU: ${variant.sku}) has imageUrl:`, variantImageUrl.substring(0, 50) + (variantImageUrl.length > 50 ? '...' : ''));
          }
          
          return {
            id: variant.id,
            sku: variant.sku || "",
            price: finalPrice,
            originalPrice: discountPrice || variant.compareAtPrice || null,
            compareAtPrice: variant.compareAtPrice || null,
            globalDiscount: globalDiscount > 0 ? globalDiscount : null,
            productDiscount: productDiscount > 0 ? productDiscount : null,
            stock: variant.stock,
            imageUrl: variantImageUrl,
            options: Array.isArray(variant.options) ? variant.options.map((opt: any) => {
              // Support both new format (AttributeValue) and old format (attributeKey/value)
              if (opt.attributeValue) {
                // New format: use AttributeValue
                const attrValue = opt.attributeValue;
                const attr = attrValue.attribute;
                const translation = attrValue.translations?.find((t: { locale: string }) => t.locale === lang) || attrValue.translations?.[0];
                return {
                  attribute: attr?.key || "",
                  value: translation?.label || attrValue.value || "",
                  key: attr?.key || "",
                  valueId: attrValue.id,
                  attributeId: attr?.id,
                };
              } else {
                // Old format: use attributeKey/value
                return {
                  attribute: opt.attributeKey || "",
                  value: opt.value || "",
                  key: opt.attributeKey || "",
                };
              }
            }) : [],
            available: variant.stock > 0,
          };
        }) : [],
      globalDiscount: globalDiscount > 0 ? globalDiscount : null,
      productDiscount: productDiscount > 0 ? productDiscount : null,
      minimumOrderQuantity: product.minimumOrderQuantity || 1,
      orderQuantityIncrement: product.orderQuantityIncrement || 1,
      seo: {
        title: translation?.seoTitle || translation?.title,
        description: translation?.seoDescription || null,
      },
      published: product.published,
      publishedAt: product.publishedAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      productAttributes: Array.isArray(product.productAttributes) ? product.productAttributes.map((pa: any) => {
        const attr = pa.attribute;
        const attrTranslation = attr.translations?.find((t: { locale: string }) => t.locale === lang) || attr.translations?.[0];
        
        return {
          id: pa.id,
          attribute: {
            id: attr.id,
            key: attr.key,
            name: attrTranslation?.name || attr.key,
            values: Array.isArray(attr.values) ? attr.values.map((val: any) => {
              const valTranslation = val.translations?.find((t: { locale: string }) => t.locale === lang) || val.translations?.[0];
              return {
                id: val.id,
                value: val.value,
                label: valTranslation?.label || val.value,
                imageUrl: val.imageUrl || null,
                colors: val.colors || null,
              };
            }) : [],
          },
        };
      }) : [],
    };
  }
}

export const productsService = new ProductsService();

