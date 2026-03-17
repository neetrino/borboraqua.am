import { db } from "@white-shop/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { printReceiptForOrder } from "@/lib/payments/ehdm";
import { findOrCreateAttributeValue } from "../utils/variant-generator";
import {
  ensureProductAttributesTable,
  ensureProductLabelMediaColumns,
  ensureProductPositionColumn,
  ensureProductVariantAttributesColumn,
} from "../utils/db-ensure";
import {
  processImageUrl,
  smartSplitUrls,
  cleanImageUrls,
  separateMainAndVariantImages,
} from "../utils/image-utils";

class AdminService {
  /**
   * Ensure colors and imageUrl columns exist in attribute_values table
   * This is a runtime migration that runs automatically when needed.
   * (P0 Security 3.6: raw SQL uses fixed strings only — no user input.)
   */
  private async ensureColorsColumnsExist() {
    try {
      // Check if colors column exists
      const colorsCheck = await db.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'attribute_values' 
          AND column_name = 'colors'
        ) as exists;
      `) as Array<{ exists: boolean }>;

      const colorsExists = colorsCheck[0]?.exists || false;

      // Check if imageUrl column exists
      const imageUrlCheck = await db.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'attribute_values' 
          AND column_name = 'imageUrl'
        ) as exists;
      `) as Array<{ exists: boolean }>;

      const imageUrlExists = imageUrlCheck[0]?.exists || false;

      if (colorsExists && imageUrlExists) {
        return; // Columns already exist
      }

      console.log('📝 [ADMIN SERVICE] Adding missing colors/imageUrl columns...');

      // Add colors column if it doesn't exist
      if (!colorsExists) {
        await db.$executeRawUnsafe(`
          ALTER TABLE "attribute_values" ADD COLUMN IF NOT EXISTS "colors" JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ [ADMIN SERVICE] Added "colors" column');
      }

      // Add imageUrl column if it doesn't exist
      if (!imageUrlExists) {
        await db.$executeRawUnsafe(`
          ALTER TABLE "attribute_values" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
        `);
        console.log('✅ [ADMIN SERVICE] Added "imageUrl" column');
      }

      // Create index if it doesn't exist
      await db.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "attribute_values_colors_idx" 
        ON "attribute_values" USING GIN ("colors");
      `);

      console.log('✅ [ADMIN SERVICE] Migration completed successfully!');
    } catch (error: any) {
      console.error('❌ [ADMIN SERVICE] Migration error:', error.message);
      throw error; // Re-throw to handle in calling code
    }
  }

  private isUnknownProductPositionError(error: unknown): boolean {
    const msg = (error as { message?: string })?.message ?? "";
    return msg.includes("Unknown argument") && msg.includes("position");
  }

  private normalizeProductPositionValue(value: unknown): number | null {
    return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null;
  }

  private async getProductPositionRaw(executor: any, productId: string): Promise<number | null> {
    const rows = await executor.$queryRaw<Array<{ position: number | null }>>`
      SELECT "position"
      FROM "products"
      WHERE "id" = ${productId}
      LIMIT 1
    `;

    return this.normalizeProductPositionValue(rows[0]?.position ?? null);
  }

  private async getMaxProductPositionRaw(executor: any, excludeProductId?: string): Promise<number> {
    const rows = excludeProductId
      ? await executor.$queryRaw<Array<{ max: number | null }>>`
          SELECT MAX("position")::int AS "max"
          FROM "products"
          WHERE "deletedAt" IS NULL
            AND "position" IS NOT NULL
            AND "id" <> ${excludeProductId}
        `
      : await executor.$queryRaw<Array<{ max: number | null }>>`
          SELECT MAX("position")::int AS "max"
          FROM "products"
          WHERE "deletedAt" IS NULL
            AND "position" IS NOT NULL
        `;

    return this.normalizeProductPositionValue(rows[0]?.max ?? null) ?? 0;
  }

  private async prepareProductCreatePositionRaw(executor: any, requestedPosition: number): Promise<number> {
    const maxPosition = await this.getMaxProductPositionRaw(executor);
    const targetPosition = Math.min(requestedPosition, maxPosition + 1);

    await executor.$executeRaw`
      UPDATE "products"
      SET "position" = "position" + 1
      WHERE "deletedAt" IS NULL
        AND "position" IS NOT NULL
        AND "position" >= ${targetPosition}
    `;

    return targetPosition;
  }

  private async prepareProductUpdatePositionRaw(
    executor: any,
    productId: string,
    requestedPosition: number | null,
    existingPosition: number | null
  ): Promise<number | null> {
    if (requestedPosition === null) {
      if (existingPosition !== null) {
        await executor.$executeRaw`
          UPDATE "products"
          SET "position" = "position" - 1
          WHERE "id" <> ${productId}
            AND "deletedAt" IS NULL
            AND "position" IS NOT NULL
            AND "position" > ${existingPosition}
        `;
      }

      return null;
    }

    const maxPosition = await this.getMaxProductPositionRaw(executor, productId);
    const targetPosition = Math.min(requestedPosition, maxPosition + 1);

    if (existingPosition === null) {
      await executor.$executeRaw`
        UPDATE "products"
        SET "position" = "position" + 1
        WHERE "id" <> ${productId}
          AND "deletedAt" IS NULL
          AND "position" IS NOT NULL
          AND "position" >= ${targetPosition}
      `;
    } else if (targetPosition < existingPosition) {
      await executor.$executeRaw`
        UPDATE "products"
        SET "position" = "position" + 1
        WHERE "id" <> ${productId}
          AND "deletedAt" IS NULL
          AND "position" IS NOT NULL
          AND "position" >= ${targetPosition}
          AND "position" < ${existingPosition}
      `;
    } else if (targetPosition > existingPosition) {
      await executor.$executeRaw`
        UPDATE "products"
        SET "position" = "position" - 1
        WHERE "id" <> ${productId}
          AND "deletedAt" IS NULL
          AND "position" IS NOT NULL
          AND "position" > ${existingPosition}
          AND "position" <= ${targetPosition}
      `;
    }

    return targetPosition;
  }

  private async persistProductPositionRaw(executor: any, productId: string, position: number | null): Promise<void> {
    if (position === null) {
      await executor.$executeRaw`
        UPDATE "products"
        SET "position" = NULL
        WHERE "id" = ${productId}
      `;
      return;
    }

    await executor.$executeRaw`
      UPDATE "products"
      SET "position" = ${position}
      WHERE "id" = ${productId}
    `;
  }

  /**
   * Get dashboard stats
   */
  async getStats() {
    // Count users
    const totalUsers = await db.user.count({
      where: { deletedAt: null },
    });

    // Count products
    const totalProducts = await db.product.count({
      where: { deletedAt: null },
    });

    // Count products with low stock (stock < 10)
    const lowStockProducts = await db.productVariant.count({
      where: {
        stock: { lt: 10 },
        published: true,
      },
    });

    // Count orders
    const totalOrders = await db.order.count();

    // Count recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = await db.order.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Count pending orders
    const pendingOrders = await db.order.count({
      where: { status: "pending" },
    });

    // Calculate total revenue from completed/paid orders
    const completedOrders = await db.order.findMany({
      where: {
        OR: [
          { status: "completed" },
          { paymentStatus: "paid" },
        ],
      },
      select: {
        total: true,
        currency: true,
      },
    });

    const totalRevenue = completedOrders.reduce((sum: number, order: { total: number; currency: string | null }) => sum + order.total, 0);
    const currency = completedOrders[0]?.currency || "AMD";

    return {
      users: {
        total: totalUsers,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      orders: {
        total: totalOrders,
        recent: recentOrders,
        pending: pendingOrders,
      },
      revenue: {
        total: totalRevenue,
        currency,
      },
    };
  }

  /**
   * Get users
   */
  async getUsers(_filters: any) {
    const users = await db.user.findMany({
      where: {
        deletedAt: null,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return {
      data: users.map((user: { id: string; email: string | null; phone: string | null; firstName: string | null; lastName: string | null; roles: string[] | null; blocked: boolean; createdAt: Date; _count?: { orders?: number } }) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        blocked: user.blocked,
        createdAt: user.createdAt,
        ordersCount: user._count?.orders ?? 0,
      })),
    };
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: any) {
    return await db.user.update({
      where: { id: userId },
      data: {
        blocked: data.blocked,
        roles: data.roles,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
        detail: `User with id '${userId}' does not exist`,
      };
    }

    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        blocked: true,
      },
      select: { id: true },
    });

    return { success: true };
  }

  /**
   * Get orders with filters and pagination
   */
  async getOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Apply payment status filter
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      where.OR = [
        { number: { contains: searchTerm, mode: 'insensitive' } },
        { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
        { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Determine sort field and order
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    // Map frontend sort fields to database fields
    const sortFieldMap: Record<string, string> = {
      'total': 'total',
      'createdAt': 'createdAt',
    };
    
    const dbSortField = sortFieldMap[sortBy] || 'createdAt';
    const orderBy: any = { [dbSortField]: sortOrder };

    console.log('📦 [ADMIN SERVICE] getOrders with filters:', { where, page, limit, skip, orderBy });

    // Get orders with pagination, including related user for basic customer info
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          ehdmReceipt: true,
        },
      }),
      db.order.count({ where }),
    ]);

    // Format orders for response
    const formattedOrders = orders.map((order: { 
      id: string; 
      number: string; 
      status: string; 
      paymentStatus: string; 
      fulfillmentStatus: string; 
      total: number; 
      currency: string | null; 
      customerEmail: string | null; 
      customerPhone: string | null; 
      createdAt: Date;
      items: Array<unknown>;
      user?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
      } | null;
      ehdmReceipt?: { id: string; [key: string]: unknown } | null;
    }) => {
      const customer = order.user || null;
      const firstName = customer?.firstName || '';
      const lastName = customer?.lastName || '';

      return {
        id: order.id,
        number: order.number,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        total: order.total,
        currency: order.currency || 'AMD',
        customerEmail: customer?.email || order.customerEmail || '',
        customerPhone: customer?.phone || order.customerPhone || '',
        customerFirstName: firstName,
        customerLastName: lastName,
        customerId: customer?.id || null,
        itemsCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
        hasEhdmReceipt: !!order.ehdmReceipt,
      };
    });

    return {
      data: formattedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single order by ID with full details for admin
   */
  async getOrderById(orderId: string) {
    // Fetch order with related user and items/variants/products
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    translations: {
                      where: { locale: "en" },
                      take: 1,
                    },
                  },
                },
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
          },
        },
        payments: true,
        ehdmReceipt: true,
      },
    });

    if (!order) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Order not found",
        detail: `Order with id '${orderId}' does not exist`,
      };
    }

    const user = order.user as any;
    const items = Array.isArray(order.items) ? order.items : [];

    const formattedItems = items.map((item: any) => {
      const variant = item.variant;
      const product = variant?.product;
      const translations = Array.isArray(product?.translations)
        ? product.translations
        : [];
      const translation = translations[0] || null;

      const quantity = item.quantity ?? 0;
      const total = item.total ?? 0;
      // Use item.price directly (same as Orders service), not calculated from total/quantity
      const unitPrice = Number(item.price ?? 0);

      // Extract variant options (color, size, etc.)
      // Support both new format (AttributeValue) and old format (attributeKey/value)
      const variantOptions = variant?.options?.map((opt: {
        attributeKey: string | null;
        value: string | null;
        valueId: string | null;
        attributeValue: {
          value: string;
          imageUrl: string | null;
          colors: any;
          translations: Array<{
            locale: string;
            label: string;
          }>;
          attribute: {
            key: string;
          };
        } | null;
      }) => {
        // Debug logging for each option
        console.log(`🔍 [ADMIN SERVICE] Processing option:`, {
          attributeKey: opt.attributeKey,
          value: opt.value,
          valueId: opt.valueId,
          hasAttributeValue: !!opt.attributeValue,
          attributeValueData: opt.attributeValue ? {
            value: opt.attributeValue.value,
            attributeKey: opt.attributeValue.attribute.key,
            imageUrl: opt.attributeValue.imageUrl,
            hasTranslations: opt.attributeValue.translations?.length > 0,
          } : null,
        });

        // New format: Use AttributeValue if available
        if (opt.attributeValue) {
          // Get label from translations (prefer current locale, fallback to first available)
          const translations = opt.attributeValue.translations || [];
          const label = translations.length > 0 ? translations[0].label : opt.attributeValue.value;
          
          return {
            attributeKey: opt.attributeValue.attribute.key || undefined,
            value: opt.attributeValue.value || undefined,
            label: label || undefined,
            imageUrl: opt.attributeValue.imageUrl || undefined,
            colors: opt.attributeValue.colors || undefined,
          };
        }
        // Old format: Use attributeKey and value directly
        return {
          attributeKey: opt.attributeKey || undefined,
          value: opt.value || undefined,
        };
      }) || [];

      console.log(`🔍 [ADMIN SERVICE] Item mapping:`, {
        productTitle: item.productTitle,
        variantId: item.variantId,
        hasVariant: !!variant,
        optionsCount: variant?.options?.length || 0,
        variantOptions,
      });

      return {
        id: item.id,
        variantId: item.variantId || variant?.id || null,
        productId: product?.id || null,
        productTitle: translation?.title || item.productTitle || "Unknown Product",
        sku: variant?.sku || item.sku || "N/A",
        quantity,
        total,
        unitPrice,
        variantOptions,
      };
    });

    const payments = Array.isArray(order.payments) ? order.payments : [];
    const primaryPayment = payments[0] || null;

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      currency: order.currency || "AMD",
      subtotal: order.subtotal || 0,
      shippingAmount: order.shippingAmount || 0,
      discountAmount: order.discountAmount || 0,
      taxAmount: order.taxAmount || 0,
      totals: {
        subtotal: Number(order.subtotal),
        discount: Number(order.discountAmount),
        shipping: Number(order.shippingAmount),
        tax: Number(order.taxAmount),
        total: Number(order.total),
        currency: order.currency || "AMD",
      },
      customerEmail: order.customerEmail || user?.email || undefined,
      customerPhone: order.customerPhone || user?.phone || undefined,
      billingAddress: order.billingAddress as any || null,
      shippingAddress: order.shippingAddress as any || null,
      shippingMethod: order.shippingMethod || null,
      notes: order.notes || null,
      adminNotes: order.adminNotes || null,
      ipAddress: order.ipAddress || null,
      userAgent: order.userAgent || null,
      payment: primaryPayment
        ? {
            id: primaryPayment.id,
            provider: primaryPayment.provider,
            method: primaryPayment.method,
            amount: primaryPayment.amount,
            currency: primaryPayment.currency,
            status: primaryPayment.status,
            cardLast4: primaryPayment.cardLast4,
            cardBrand: primaryPayment.cardBrand,
          }
        : null,
      customer: user
        ? {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt?.toISOString?.() ?? undefined,
      items: formattedItems,
      ehdmReceipt:
        (order as any).ehdmReceipt != null
          ? {
              receiptId: (order as any).ehdmReceipt.receiptId,
              fiscal: (order as any).ehdmReceipt.fiscal,
              qr: (order as any).ehdmReceipt.qr,
              createdAt: (order as any).ehdmReceipt.createdAt?.toISOString?.() ?? null,
              result: ((order as any).ehdmReceipt.response as { result?: Record<string, unknown> })?.result ?? null,
            }
          : null,
    };
  }

  /**
   * Delete order
   * Հեռացնում է պատվերը և բոլոր կապված գրառումները (cascade)
   */
  async deleteOrder(orderId: string) {
    try {
      console.log('🗑️ [ADMIN] Սկսվում է պատվերի հեռացում:', {
        orderId,
        timestamp: new Date().toISOString(),
      });
      
      // Ստուգում ենք, արդյոք պատվերը գոյություն ունի
      console.log('🔍 [ADMIN] Ստուգվում է պատվերի գոյությունը...');
      const existing = await db.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          _count: {
            select: {
              items: true,
              payments: true,
              events: true,
            },
          },
        },
      });

      if (!existing) {
        console.log('❌ [ADMIN] Պատվերը չի գտնվել:', orderId);
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Order not found",
          detail: `Order with id '${orderId}' does not exist`,
        };
      }

      console.log('✅ [ADMIN] Պատվերը գտնվել է:', {
        id: existing.id,
        number: existing.number,
        status: existing.status,
        total: existing.total,
        itemsCount: existing._count.items,
        paymentsCount: existing._count.payments,
        eventsCount: existing._count.events,
      });

      // Հեռացնում ենք պատվերը (cascade-ը ավտոմատ կհեռացնի կապված items, payments, events)
      console.log('🗑️ [ADMIN] Հեռացվում է պատվերը և կապված գրառումները...');
      
      try {
        await db.order.delete({
          where: { id: orderId },
        });
        console.log('✅ [ADMIN] Prisma delete հարցումը հաջողությամբ ավարտված');
      } catch (deleteError: any) {
        console.error('❌ [ADMIN] Prisma delete սխալ:', {
          code: deleteError?.code,
          meta: deleteError?.meta,
          message: deleteError?.message,
          name: deleteError?.name,
        });
        throw deleteError;
      }

      console.log('✅ [ADMIN] Պատվերը հաջողությամբ հեռացվել է:', {
        orderId,
        orderNumber: existing.number,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true };
    } catch (error: any) {
      // Եթե սա մեր ստեղծած սխալ է, ապա վերադարձնում ենք այն
      if (error.status && error.type) {
        console.error('❌ [ADMIN] Ստանդարտ սխալ:', {
          status: error.status,
          type: error.type,
          title: error.title,
          detail: error.detail,
        });
        throw error;
      }

      // Մանրամասն լոգավորում Prisma սխալների համար
      console.error('❌ [ADMIN] Պատվերի հեռացման սխալ:', {
        orderId,
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack?.substring(0, 500),
        },
        timestamp: new Date().toISOString(),
      });

      // Prisma սխալների մշակում
      if (error?.code === 'P2025') {
        // Record not found
        console.log('⚠️ [ADMIN] Prisma P2025: Գրառումը չի գտնվել');
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Order not found",
          detail: `Order with id '${orderId}' does not exist`,
        };
      }

      if (error?.code === 'P2003') {
        // Foreign key constraint failed
        console.log('⚠️ [ADMIN] Prisma P2003: Foreign key սահմանափակում');
        throw {
          status: 409,
          type: "https://api.shop.am/problems/conflict",
          title: "Cannot delete order",
          detail: "Order has related records that cannot be deleted",
        };
      }

      // Գեներիկ սխալ
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error?.message || "Failed to delete order",
      };
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, data: any) {
    try {
      // Check if order exists
      const existing = await db.order.findUnique({
        where: { id: orderId },
      });

      if (!existing) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Order not found",
          detail: `Order with id '${orderId}' does not exist`,
        };
      }

      // Validate status values
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'cancelled'];
      const validFulfillmentStatuses = ['unfulfilled', 'fulfilled', 'shipped', 'delivered'];

      if (data.status !== undefined && !validStatuses.includes(data.status)) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        };
      }

      if (data.paymentStatus !== undefined && !validPaymentStatuses.includes(data.paymentStatus)) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: `Invalid paymentStatus. Must be one of: ${validPaymentStatuses.join(', ')}`,
        };
      }

      if (data.fulfillmentStatus !== undefined && !validFulfillmentStatuses.includes(data.fulfillmentStatus)) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: `Invalid fulfillmentStatus. Must be one of: ${validFulfillmentStatuses.join(', ')}`,
        };
      }

      // Prepare update data
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.fulfillmentStatus !== undefined) updateData.fulfillmentStatus = data.fulfillmentStatus;

      // Update timestamps based on status changes
      if (data.status === 'completed' && existing.status !== 'completed') {
        updateData.fulfilledAt = new Date();
      }
      if (data.status === 'cancelled' && existing.status !== 'cancelled') {
        updateData.cancelledAt = new Date();
      }
      if (data.paymentStatus === 'paid' && existing.paymentStatus !== 'paid') {
        updateData.paidAt = new Date();
      }

      const order = await db.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: true,
          payments: true,
        },
      });

      // Create order event
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'order_updated',
          data: {
            updatedFields: Object.keys(updateData),
            previousStatus: existing.status,
            newStatus: data.status || existing.status,
          },
        },
      });

      if (data.paymentStatus === 'paid' && existing.paymentStatus !== 'paid') {
        printReceiptForOrder(order.id).catch((err) =>
          console.error("[EHDM] printReceiptForOrder", err)
        );
      }

      return order;
    } catch (error: any) {
      // If it's already our custom error, re-throw it
      if (error.status && error.type) {
        throw error;
      }

      // Log Prisma/database errors
      console.error("❌ [ADMIN SERVICE] updateOrder error:", {
        orderId,
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack?.substring(0, 500),
        },
      });

      // Handle specific Prisma errors
      if (error?.code === 'P2025') {
        // Record not found
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Not Found",
          detail: error?.meta?.cause || "The requested order was not found",
        };
      }

      // Generic database error
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Database Error",
        detail: error?.message || "An error occurred while updating the order",
      };
    }
  }

  /**
   * Get products with filters and pagination
   */
  async getProducts(filters: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    categories?: string[];
    sku?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    lang?: string;
  }) {
    console.log("📦 [ADMIN SERVICE] getProducts called with filters:", filters);
    const startTime = Date.now();

    try {
      await ensureProductPositionColumn();
    } catch (error: unknown) {
      console.warn("⚠️ [ADMIN SERVICE] Could not ensure products.position column before listing:", error);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const lang = filters.lang || 'en'; // Use provided language or default to English

    const where: any = {
      deletedAt: null,
    };

    const orConditions: any[] = [];

    // Search filter
    if (filters.search) {
      orConditions.push(
        {
          translations: {
            some: {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          variants: {
            some: {
              sku: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        }
      );
    }

    // Category filter - support both single category and multiple categories
    const categoryIds = filters.categories && filters.categories.length > 0 
      ? filters.categories 
      : filters.category 
        ? [filters.category] 
        : [];
    
    if (categoryIds.length > 0) {
      const categoryConditions: any[] = [];
      categoryIds.forEach((categoryId) => {
        categoryConditions.push(
          {
            primaryCategoryId: categoryId,
          },
          {
            categoryIds: {
              has: categoryId,
            },
          }
        );
      });
      orConditions.push(...categoryConditions);
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // SKU filter
    if (filters.sku) {
      where.variants = {
        some: {
          sku: {
            contains: filters.sku,
            mode: "insensitive",
          },
        },
      };
    }

    // Sort
    let orderBy: any = { createdAt: "desc" };
    if (filters.sort) {
      const [field, direction] = filters.sort.split("-");
      orderBy = { [field]: direction || "desc" };
    }

    console.log("📦 [ADMIN SERVICE] Executing database queries...");
    console.log("📦 [ADMIN SERVICE] Where clause:", JSON.stringify(where, null, 2));
    const queryStartTime = Date.now();

    let products: any[] = [];
    let total: number = 0;

    try {
      // Test database connection first
      console.log("📦 [ADMIN SERVICE] Testing database connection...");
      await db.$queryRaw`SELECT 1`;
      console.log("✅ [ADMIN SERVICE] Database connection OK");

      // First, try to get products with a simpler query
      console.log("📦 [ADMIN SERVICE] Fetching products...");
      try {
        products = await db.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            translations: true, // Get all translations, we'll filter by lang later
            variants: true, // All variants for total stock and price (filter/sort in map)
            labels: true,
            categories: { include: { translations: true } },
          },
        });
      } catch (orderError: unknown) {
        const msg = (orderError as { message?: string })?.message ?? "";
        if (msg.includes("Unknown argument") && msg.includes("position")) {
          console.warn("⚠️ [ADMIN SERVICE] Product.position not in schema, using createdAt order");
          products = await db.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              translations: true,
              variants: true,
              labels: true,
              categories: { include: { translations: true } },
            },
          });
        } else {
          throw orderError;
        }
      }

      // Fix missing categories relations for products that have categoryIds but no categories relation
      // This is a one-time fix for existing products
      for (const product of products) {
        const categoryIds = (product as any).categoryIds || [];
        const categories = Array.isArray((product as any).categories) ? (product as any).categories : [];
        
        if (categoryIds.length > 0 && categories.length === 0) {
          console.warn(`⚠️ [ADMIN SERVICE] Product ${product.id} has categoryIds but no categories relation. Fixing...`);
          try {
            await db.product.update({
              where: { id: product.id },
              data: {
                categories: {
                  connect: categoryIds.map((id: string) => ({ id })),
                },
              },
            });
            // Reload categories for this product
            const updatedProduct = await db.product.findUnique({
              where: { id: product.id },
              include: {
                categories: { include: { translations: true } },
              },
            });
            if (updatedProduct) {
              (product as any).categories = updatedProduct.categories;
              console.log(`✅ [ADMIN SERVICE] Fixed categories relation for product ${product.id}`);
            }
          } catch (error: any) {
            console.error(`❌ [ADMIN SERVICE] Failed to fix categories relation for product ${product.id}:`, error.message);
          }
        }
      }
      
      const productsTime = Date.now() - queryStartTime;
      console.log(`✅ [ADMIN SERVICE] Products fetched in ${productsTime}ms. Found ${products.length} products`);

      // Then get count - use a simpler approach if count is slow
      console.log("📦 [ADMIN SERVICE] Counting total products...");
      const countStartTime = Date.now();
      
      // Use a timeout for count query
      const countPromise = db.product.count({ where });
      const timeoutPromise = new Promise<number>((_, reject) => 
        setTimeout(() => reject(new Error("Count query timeout")), 10000)
      );
      
      total = await Promise.race([countPromise, timeoutPromise]) as number;
      const countTime = Date.now() - countStartTime;
      console.log(`✅ [ADMIN SERVICE] Count completed in ${countTime}ms. Total: ${total}`);
      
      const queryTime = Date.now() - queryStartTime;
      console.log(`✅ [ADMIN SERVICE] All database queries completed in ${queryTime}ms`);
    } catch (error: any) {
      // If product_variants.attributes column doesn't exist, try to create it and retry
      if (error?.message?.includes('product_variants.attributes') || 
          (error?.message?.includes('attributes') && error?.message?.includes('does not exist'))) {
        console.warn('⚠️ [ADMIN SERVICE] product_variants.attributes column not found, attempting to create it...');
        try {
          await ensureProductVariantAttributesColumn();
          // Retry the query after creating the column (use createdAt to avoid position schema issues)
          products = await db.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              translations: true, // Get all translations, we'll filter by lang later
              variants: true, // All variants for total stock and price (filter/sort in map)
              labels: true,
              categories: { include: { translations: true } },
            },
          });
          
          const productsTime = Date.now() - queryStartTime;
          console.log(`✅ [ADMIN SERVICE] Products fetched in ${productsTime}ms. Found ${products.length} products (after creating attributes column)`);
          
          // Get count
          const countStartTime = Date.now();
          const countPromise = db.product.count({ where });
          const timeoutPromise = new Promise<number>((_, reject) => 
            setTimeout(() => reject(new Error("Count query timeout")), 10000)
          );
          
          total = await Promise.race([countPromise, timeoutPromise]) as number;
          const countTime = Date.now() - countStartTime;
          console.log(`✅ [ADMIN SERVICE] Count completed in ${countTime}ms. Total: ${total}`);
          
          const queryTime = Date.now() - queryStartTime;
          console.log(`✅ [ADMIN SERVICE] All database queries completed in ${queryTime}ms`);
        } catch (retryError: any) {
          const queryTime = Date.now() - queryStartTime;
          console.error(`❌ [ADMIN SERVICE] Database query error after ${queryTime}ms (after retry):`, retryError);
          throw retryError;
        }
      } else {
        const queryTime = Date.now() - queryStartTime;
        console.error(`❌ [ADMIN SERVICE] Database query error after ${queryTime}ms:`, error);
        console.error(`❌ [ADMIN SERVICE] Error details:`, {
          message: error.message,
          code: error.code,
          meta: error.meta,
          stack: error.stack?.substring(0, 500),
        });
        
        // If count fails, try to get products without count
        if (error.message === "Count query timeout" || error.message?.includes("count")) {
          console.warn("⚠️ [ADMIN SERVICE] Count query failed, using estimated total");
          total = products?.length || limit; // Use current page size as fallback
        } else {
          // If products query also failed, rethrow
          if (!products) {
            throw error;
          }
          // If only count failed, use estimated total
          console.warn("⚠️ [ADMIN SERVICE] Count query failed, using estimated total");
          total = products.length || limit;
        }
      }
    }

    const data = products.map((product) => {
      // Безопасное получение translation с проверкой на существование массива
      // Try to find translation for the requested language, fallback to first available
      const translations = Array.isArray(product.translations) ? product.translations : [];
      const translation = translations.find((t: { locale: string }) => t.locale === lang) || translations[0] || null;
      
      // All variants: for total stock and for price (first by price, prefer published)
      const allVariants = Array.isArray(product.variants) ? product.variants : [];
      const totalStock = allVariants.reduce((sum: number, v: { stock?: number }) => sum + (Number(v?.stock) || 0), 0);
      const variantForPrice = allVariants.length > 0
        ? [...allVariants].sort((a: any, b: any) => {
            const pa = a.published ? 0 : 1;
            const pb = b.published ? 0 : 1;
            if (pa !== pb) return pa - pb;
            return (a.price ?? 0) - (b.price ?? 0);
          })[0]
        : null;
      
      const image =
        Array.isArray(product.media) && product.media.length > 0
          ? typeof product.media[0] === "string"
            ? product.media[0]
            : (product.media[0] as any)?.url
          : null;

      // Primary category title for list view
      const categories = Array.isArray((product as any).categories) ? (product as any).categories : [];
      const primaryCategoryId = (product as any).primaryCategoryId;
      
      // Debug logging for category resolution
      if (categories.length === 0) {
        console.warn(`⚠️ [ADMIN SERVICE] Product ${product.id} has no categories relation. primaryCategoryId: ${primaryCategoryId}`);
      }
      
      let selectedCategory = primaryCategoryId && categories.length > 0
        ? categories.find((c: { id: string }) => c.id === primaryCategoryId)
        : null;
      if (!selectedCategory && categories.length > 0) selectedCategory = categories[0];
      
      let category: string | null = null;
      if (selectedCategory) {
        const categoryTranslations = Array.isArray(selectedCategory.translations)
          ? selectedCategory.translations
          : [];
        const categoryTranslation = categoryTranslations.find((t: { locale: string }) => t.locale === lang) || categoryTranslations[0] || null;
        category = categoryTranslation?.title ?? null;
        if (!category) {
          console.warn(`⚠️ [ADMIN SERVICE] Product ${product.id} category ${selectedCategory.id} has no translation for locale ${lang}. Available locales: ${categoryTranslations.map((t: { locale: string }) => t.locale).join(', ')}`);
        }
      }

      // All category titles (current lang) for list view
      const categoryTitles: string[] = categories
        .map((c: { translations?: Array<{ locale: string; title: string }> }) => {
          const tr = Array.isArray(c.translations) ? c.translations : [];
          const t = tr.find((x: { locale: string }) => x.locale === lang) || tr[0];
          return t?.title?.trim() || "";
        })
        .filter(Boolean);
      const categoriesList = [...new Set(categoryTitles)];

      return {
        id: product.id,
        slug: translation?.slug || "",
        title: translation?.title || "",
        published: product.published,
        featured: product.featured || false,
        price: variantForPrice?.price ?? 0,
        stock: totalStock,
        discountPercent: product.discountPercent || 0,
        compareAtPrice: variantForPrice?.compareAtPrice ?? null,
        colorStocks: [],
        image,
        category,
        categories: categoriesList.length > 0 ? categoriesList : undefined,
        createdAt: product.createdAt.toISOString(),
      };
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ [ADMIN SERVICE] getProducts completed in ${totalTime}ms. Returning ${data.length} products`);

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
   * Get product by ID
   */
  async getProductById(productId: string) {
    // Try to include productAttributes, but handle case where table might not exist
    let product;
    let fallbackPosition: number | null | undefined;
    await ensureProductLabelMediaColumns();
    try {
      product = await db.product.findUnique({
        where: { id: productId },
        include: {
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
            orderBy: {
              position: 'asc',
            },
          },
          labels: true,
          productAttributes: {
            include: {
              attribute: true,
            },
          },
        },
      });
    } catch (error: any) {
      // If productAttributes table doesn't exist, retry without it
      if (error?.code === 'P2021' || error?.message?.includes('productAttributes') || error?.message?.includes('does not exist')) {
        console.warn('⚠️ [ADMIN SERVICE] productAttributes table not found, fetching without it:', error.message);
        product = await db.product.findUnique({
          where: { id: productId },
          include: {
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
              orderBy: {
                position: 'asc',
              },
            },
            labels: true,
          },
        });
      } else {
        throw error;
      }
    }

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    // Безопасное получение translations с проверкой на существование массива
    const translations = Array.isArray(product.translations) ? product.translations : [];
    
    // Безопасное получение labels с проверкой на существование массива
    const labels = Array.isArray(product.labels) ? product.labels : [];
    
    // Безопасное получение variants с проверкой на существование массива
    const variants = Array.isArray(product.variants) ? product.variants : [];
    
    // Get all attribute IDs from productAttributes relation
    const productAttributes = Array.isArray((product as any).productAttributes) 
      ? (product as any).productAttributes 
      : [];
    const attributeIds = productAttributes
      .map((pa: any) => pa.attributeId || pa.attribute?.id)
      .filter((id: string | undefined): id is string => !!id);
    
    // Also include attributeIds from product.attributeIds if available (backward compatibility)
    const legacyAttributeIds = Array.isArray((product as any).attributeIds) 
      ? (product as any).attributeIds 
      : [];
    
    // Merge both sources and remove duplicates
    const allAttributeIds = Array.from(new Set([...attributeIds, ...legacyAttributeIds]));

    // Get default translation for backward compatibility (prefer English, then first available)
    const defaultTranslation = translations.find((t: { locale: string }) => t.locale === "en") || translations[0] || null;
    if ((product as { position?: number | null }).position === undefined) {
      fallbackPosition = await this.getProductPositionRaw(db, productId);
    }

    return {
      id: product.id,
      // Backward compatibility: include single title/slug/descriptionHtml
      title: defaultTranslation?.title || "",
      slug: defaultTranslation?.slug || "",
      subtitle: defaultTranslation?.subtitle || null,
      descriptionHtml: defaultTranslation?.descriptionHtml || null,
      // Include all translations
      translations: translations.map((t: any) => ({
        locale: t.locale,
        title: t.title,
        slug: t.slug,
        subtitle: t.subtitle || null,
        descriptionHtml: t.descriptionHtml || null,
      })),
      brandId: product.brandId || null,
      primaryCategoryId: product.primaryCategoryId || null,
      categoryIds: product.categoryIds || [],
      attributeIds: allAttributeIds, // All attribute IDs that this product has
      published: product.published,
      featured: (product as any).featured || false,
      position: fallbackPosition ?? product.position ?? null,
      minimumOrderQuantity: (product as any).minimumOrderQuantity ?? 1,
      orderQuantityIncrement: (product as any).orderQuantityIncrement ?? 1,
      media: Array.isArray(product.media) ? product.media : [],
      labels: labels.map((label: {
        id: string;
        type: string;
        value: string;
        position: string;
        color: string | null;
        imageUrl?: string | null;
        imagePosition?: string | null;
      }) => ({
        id: label.id,
        type: label.type,
        value: label.value,
        position: label.position,
        color: label.color,
        imageUrl: label.imageUrl ?? null,
        imagePosition: label.imagePosition ?? null,
      })),
      variants: variants.map((variant: any) => {
        // Безопасное получение options с проверкой на существование массива
        const options = Array.isArray(variant.options) ? variant.options : [];
        
        // Get attributes from JSONB column if available
        let attributes = null;
        let colorValues: string[] = [];
        let sizeValues: string[] = [];
        
        if (variant.attributes) {
          // attributes is already in JSONB format: { "color": [...], "size": [...] }
          attributes = variant.attributes;
          
          // Extract color and size values from JSONB attributes
          if (attributes.color && Array.isArray(attributes.color)) {
            colorValues = attributes.color.map((item: any) => item.value || item).filter(Boolean);
          }
          if (attributes.size && Array.isArray(attributes.size)) {
            sizeValues = attributes.size.map((item: any) => item.value || item).filter(Boolean);
          }
        } else if (options.length > 0) {
          // Fallback: build attributes from options if JSONB column is empty
          const attributesMap: Record<string, Array<{ valueId: string; value: string; attributeKey: string }>> = {};
          options.forEach((opt: any) => {
            const attrKey = opt.attributeKey || opt.attributeValue?.attribute?.key;
            const value = opt.value || opt.attributeValue?.value;
            const valueId = opt.valueId || opt.attributeValue?.id;
            
            if (attrKey && value && valueId) {
              if (!attributesMap[attrKey]) {
                attributesMap[attrKey] = [];
              }
              if (!attributesMap[attrKey].some((item: any) => item.valueId === valueId)) {
                attributesMap[attrKey].push({
                  valueId,
                  value,
                  attributeKey: attrKey,
                });
              }
              
              // Extract color and size for backward compatibility
              if (attrKey === "color") {
                colorValues.push(value);
              } else if (attrKey === "size") {
                sizeValues.push(value);
              }
            }
          });
          attributes = Object.keys(attributesMap).length > 0 ? attributesMap : null;
        }
        
        // For backward compatibility: use first color/size if multiple values exist
        const colorOption = options.find((opt: { attributeKey: string }) => opt.attributeKey === "color");
        const sizeOption = options.find((opt: { attributeKey: string }) => opt.attributeKey === "size");
        
        // Use first value from arrays or fallback to single option value
        const color = colorValues.length > 0 ? colorValues[0] : (colorOption?.value || "");
        const size = sizeValues.length > 0 ? sizeValues[0] : (sizeOption?.value || "");

        return {
          id: variant.id,
          price: variant.price.toString(),
          compareAtPrice: variant.compareAtPrice?.toString() || "",
          stock: variant.stock.toString(),
          sku: variant.sku || "",
          color: color, // First color for backward compatibility
          size: size, // First size for backward compatibility
          imageUrl: variant.imageUrl || "",
          published: variant.published || false,
          attributes: attributes, // JSONB attributes with all values - IMPORTANT: This is the main field
          options: options, // Keep options for backward compatibility
          // Additional fields for new format support
          colorValues: colorValues, // All color values
          sizeValues: sizeValues, // All size values
        };
      }),
    };
  }

  /**
   * Generate unique SKU for product variant
   * Checks database to ensure uniqueness
   */
  private async generateUniqueSku(
    tx: any,
    baseSku: string | undefined,
    productSlug: string,
    variantIndex: number,
    usedSkus: Set<string>
  ): Promise<string> {
    // If base SKU is provided and unique, use it
    if (baseSku && baseSku.trim() !== '') {
      const trimmedSku = baseSku.trim();
      
      // Check if already used in this transaction
      if (!usedSkus.has(trimmedSku)) {
        // Check if exists in database
        const existing = await tx.productVariant.findUnique({
          where: { sku: trimmedSku },
        });
        
        if (!existing) {
          usedSkus.add(trimmedSku);
          console.log(`✅ [ADMIN SERVICE] Using provided SKU: ${trimmedSku}`);
          return trimmedSku;
        } else {
          console.log(`⚠️ [ADMIN SERVICE] SKU already exists in DB: ${trimmedSku}, generating new one`);
        }
      } else {
        console.log(`⚠️ [ADMIN SERVICE] SKU already used in transaction: ${trimmedSku}, generating new one`);
      }
    }

    // Generate new unique SKU
    const baseSlug = productSlug || 'PROD';
    let attempt = 0;
    let newSku: string;
    
    do {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const suffix = attempt > 0 ? `-${attempt}` : '';
      newSku = `${baseSlug.toUpperCase()}-${timestamp}-${variantIndex + 1}${suffix}-${random}`;
      attempt++;
      
      // Check if already used in this transaction
      if (usedSkus.has(newSku)) {
        continue;
      }
      
      // Check if exists in database
      const existing = await tx.productVariant.findUnique({
        where: { sku: newSku },
      });
      
      if (!existing) {
        usedSkus.add(newSku);
        console.log(`✅ [ADMIN SERVICE] Generated unique SKU: ${newSku}`);
        return newSku;
      }
      
      console.log(`⚠️ [ADMIN SERVICE] Generated SKU exists in DB: ${newSku}, trying again...`);
    } while (attempt < 100); // Safety limit
    
    // Fallback: use timestamp + random if all attempts failed
    const finalSku = `${baseSlug.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    usedSkus.add(finalSku);
    console.log(`✅ [ADMIN SERVICE] Using fallback SKU: ${finalSku}`);
    return finalSku;
  }

  /**
   * Returns next unique slug for the given base: if 0 products use base → base;
   * if 1 product → base-2; if 2 → base-3; etc.
   * When excludeProductId is set (update), keeps current slug if product already uses one in the family.
   */
  private async getNextUniqueSlug(
    tx: { productTranslation: { findMany: (args: { where: { locale: string }; select: { slug: true; productId: true } }) => Promise<Array<{ slug: string; productId: string }>> } },
    baseSlug: string,
    locale: string,
    options?: { excludeProductId?: string; currentSlug?: string }
  ): Promise<string> {
    const base = baseSlug.replace(/-\d+$/, '');
    const all = await tx.productTranslation.findMany({
      where: { locale },
      select: { slug: true, productId: true },
    });
    const inFamily = all.filter(
      (row) => row.slug === base || (row.slug.startsWith(base + '-') && /^\d+$/.test(row.slug.slice(base.length + 1)))
    );
    const excludeProductId = options?.excludeProductId;
    const currentSlug = options?.currentSlug;

    if (excludeProductId) {
      const myRow = inFamily.find((r) => r.productId === excludeProductId);
      if (myRow) return myRow.slug;
      const used = new Set(inFamily.map((r) => r.slug));
      if (!used.has(base)) return base;
      for (let n = 2; n <= inFamily.length + 1; n++) {
        const candidate = `${base}-${n}`;
        if (!used.has(candidate)) return candidate;
      }
      return `${base}-${inFamily.length + 1}`;
    }

    const count = inFamily.length;
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  /**
   * Create product
   */
  async createProduct(data: {
    slug: string;
    translations: Array<{
      locale: string;
      title: string;
      slug: string;
      descriptionHtml?: string;
    }>;
    brandId?: string;
    primaryCategoryId?: string;
    categoryIds?: string[];
    published: boolean;
    featured?: boolean;
    position?: number | null;
    minimumOrderQuantity?: number;
    orderQuantityIncrement?: number;
    media?: any[];
    mainProductImage?: string;
    labels?: Array<{
      type: string;
      value: string;
      position: string;
      color?: string | null;
      imageUrl?: string | null;
      imagePosition?: string | null;
    }>;
    attributeIds?: string[];
    variants: Array<{
      price: string | number;
      compareAtPrice?: string | number;
      stock: string | number;
      sku?: string;
      color?: string;
      size?: string;
      imageUrl?: string;
      published?: boolean;
      options?: Array<{
        attributeKey: string;
        value: string;
        valueId?: string;
      }>;
    }>;
  }) {
    try {
      console.log('🆕 [ADMIN SERVICE] Creating product with translations:', {
        slug: data.slug,
        translationsCount: data.translations.length,
      });

      if (data.position !== undefined) {
        await ensureProductPositionColumn();
      }
      await ensureProductLabelMediaColumns();

      const result = await db.$transaction(async (tx: any) => {
        // Set UTF-8 encoding at the start of transaction to prevent encoding errors
        // This is critical for Armenian and other Unicode characters
        try {
          await tx.$executeRaw`SET client_encoding TO 'UTF8'`;
        } catch (encodingError: any) {
          // Log but continue - encoding might already be set
          console.warn('⚠️ [ADMIN SERVICE] Could not set client encoding in transaction:', encodingError?.message);
        }

        // Track used SKUs within this transaction to ensure uniqueness
        const usedSkus = new Set<string>();
        const locale = data.translations?.[0]?.locale ?? 'hy';
        const finalSlug = await this.getNextUniqueSlug(tx, data.slug.trim(), locale);
        if (finalSlug !== data.slug.trim()) {
          console.log('🔗 [ADMIN SERVICE] Slug uniquified:', data.slug.trim(), '→', finalSlug);
        }

        // Generate variants with options
        // Support both old format (color/size strings) and new format (AttributeValue IDs)
        // Also support generic options array for any attribute type
        const variantsData = await Promise.all(
          data.variants.map(async (variant: any, variantIndex: number) => {
            const options: any[] = [];
            const attributesMap: Record<string, Array<{ valueId: string; value: string; attributeKey: string }>> = {};
            
            // If variant has explicit options array, use it (new format)
            if (variant.options && Array.isArray(variant.options) && variant.options.length > 0) {
              for (const opt of variant.options) {
                let valueId: string | null = null;
                let attributeKey: string | null = null;
                let value: string | null = null;

                if (opt.valueId) {
                  // New format: use valueId
                  valueId = opt.valueId;
                  // Fetch AttributeValue to get value and attributeKey
                  const attrValue = await tx.attributeValue.findUnique({
                    where: { id: opt.valueId },
                    include: { attribute: true },
                  });
                  if (attrValue) {
                    attributeKey = attrValue.attribute.key;
                    value = attrValue.value;
                  }
                  options.push({ valueId: opt.valueId });
                } else if (opt.attributeKey && opt.value) {
                  // Try to find or create AttributeValue
                  const foundValueId = await findOrCreateAttributeValue(opt.attributeKey, opt.value, locale);
                  if (foundValueId) {
                    valueId = foundValueId;
                    attributeKey = opt.attributeKey;
                    value = opt.value;
                    options.push({ valueId: foundValueId });
                  } else {
                    // Fallback to old format if AttributeValue not found
                    attributeKey = opt.attributeKey;
                    value = opt.value;
                    options.push({ attributeKey: opt.attributeKey, value: opt.value });
                  }
                }

                // Build attributes JSONB structure
                if (attributeKey && valueId && value) {
                  if (!attributesMap[attributeKey]) {
                    attributesMap[attributeKey] = [];
                  }
                  // Check if this valueId is already added for this attribute
                  if (!attributesMap[attributeKey].some(item => item.valueId === valueId)) {
                    attributesMap[attributeKey].push({
                      valueId,
                      value,
                      attributeKey,
                    });
                  }
                }
              }
            } else {
              // Old format: Try to find or create AttributeValues for color and size
              if (variant.color) {
                const colorValueId = await findOrCreateAttributeValue("color", variant.color, locale);
                if (colorValueId) {
                  options.push({ valueId: colorValueId });
                  if (!attributesMap["color"]) {
                    attributesMap["color"] = [];
                  }
                  attributesMap["color"].push({
                    valueId: colorValueId,
                    value: variant.color,
                    attributeKey: "color",
                  });
                } else {
                  // Fallback to old format if AttributeValue not found
                  options.push({ attributeKey: "color", value: variant.color });
                }
              }
              
              if (variant.size) {
                const sizeValueId = await findOrCreateAttributeValue("size", variant.size, locale);
                if (sizeValueId) {
                  options.push({ valueId: sizeValueId });
                  if (!attributesMap["size"]) {
                    attributesMap["size"] = [];
                  }
                  attributesMap["size"].push({
                    valueId: sizeValueId,
                    value: variant.size,
                    attributeKey: "size",
                  });
                } else {
                  // Fallback to old format if AttributeValue not found
                  options.push({ attributeKey: "size", value: variant.size });
                }
              }
            }

            const price = typeof variant.price === 'number' ? variant.price : parseFloat(String(variant.price));
            const stock = typeof variant.stock === 'number' ? variant.stock : parseInt(String(variant.stock), 10);
            // Explicit null when empty so DB stores no discount (Prisma create accepts null)
            const rawCompare = variant.compareAtPrice;
            const compareAtPrice =
              rawCompare !== undefined && rawCompare !== null && String(rawCompare).trim() !== ''
                ? (typeof rawCompare === 'number' ? rawCompare : parseFloat(String(rawCompare)))
                : null;

            // Generate unique SKU for this variant
            const uniqueSku = await this.generateUniqueSku(
              tx,
              variant.sku,
              finalSlug,
              variantIndex,
              usedSkus
            );

            // Convert attributesMap to JSONB format
            const attributesJson = Object.keys(attributesMap).length > 0 ? attributesMap : null;

            console.log(`📦 [ADMIN SERVICE] Variant ${variantIndex + 1} attributes:`, JSON.stringify(attributesJson, null, 2));

            // Process and validate variant imageUrl
            let processedVariantImageUrl: string | undefined = undefined;
            if (variant.imageUrl) {
              const urls = smartSplitUrls(variant.imageUrl);
              const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
              if (processedUrls.length > 0) {
                processedVariantImageUrl = processedUrls.join(',');
              }
            }

            return {
              sku: uniqueSku,
              price,
              compareAtPrice,
              stock: isNaN(stock) ? 0 : stock,
              imageUrl: processedVariantImageUrl,
              published: variant.published !== false,
              attributes: attributesJson, // JSONB column
              options: {
                create: options,
              },
            };
          })
        );

        // Final validation: log all SKUs to ensure uniqueness
        const allSkus = variantsData.map(v => v.sku).filter(Boolean);
        const uniqueSkus = new Set(allSkus);
        console.log(`📋 [ADMIN SERVICE] Generated ${variantsData.length} variants with SKUs:`, allSkus);
        
        if (allSkus.length !== uniqueSkus.size) {
          console.error('❌ [ADMIN SERVICE] Duplicate SKUs detected!', {
            total: allSkus.length,
            unique: uniqueSkus.size,
            duplicates: allSkus.filter((sku, index) => allSkus.indexOf(sku) !== index)
          });
          throw new Error('Duplicate SKUs detected in variants. This should not happen.');
        }
        
        console.log('✅ [ADMIN SERVICE] All variant SKUs are unique');

        // Collect all variant images to exclude from main media
        const allVariantImages: any[] = [];
        variantsData.forEach((variant: any) => {
          if (variant.imageUrl) {
            const urls = smartSplitUrls(variant.imageUrl);
            allVariantImages.push(...urls);
          }
        });

        // Prepare media array - use mainProductImage if provided and media is empty
        let rawMedia = data.media || [];
        if (data.mainProductImage && rawMedia.length === 0) {
          // If mainProductImage is provided but media is empty, use mainProductImage as first media item
          rawMedia = [data.mainProductImage];
          console.log('📸 [ADMIN SERVICE] Using mainProductImage as media:', data.mainProductImage.substring(0, 50) + '...');
        } else if (data.mainProductImage && rawMedia.length > 0) {
          // If both are provided, ensure mainProductImage is first in media array
          const mainImageIndex = rawMedia.findIndex((m: any) => {
            const url = typeof m === 'string' ? m : m.url;
            return url === data.mainProductImage;
          });
          if (mainImageIndex === -1) {
            // mainProductImage not in media array, add it as first
            rawMedia = [data.mainProductImage, ...rawMedia];
            console.log('📸 [ADMIN SERVICE] Added mainProductImage as first media item');
          } else if (mainImageIndex > 0) {
            // mainProductImage is in media but not first, move it to first
            const mainImage = rawMedia[mainImageIndex];
            rawMedia.splice(mainImageIndex, 1);
            rawMedia.unshift(mainImage);
            console.log('📸 [ADMIN SERVICE] Moved mainProductImage to first position in media');
          }
        }

        // Separate main images from variant images and clean them
        const { main } = separateMainAndVariantImages(rawMedia, allVariantImages);
        const finalMedia = cleanImageUrls(main);
        
        console.log('📸 [ADMIN SERVICE] Final main media count:', finalMedia.length);
        console.log('📸 [ADMIN SERVICE] Variant images excluded:', allVariantImages.length);

        // Create translations for all provided languages (use finalSlug for uniqueness)
        const translationsToCreate = data.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          slug: finalSlug,
          descriptionHtml: translation.descriptionHtml || undefined,
        }));

        let normalizedPosition: number | null = null;
        if (data.position !== undefined && data.position !== null) {
          try {
            if (!Number.isInteger(data.position) || data.position < 1) {
              throw {
                status: 400,
                type: "https://api.shop.am/problems/validation-error",
                title: "Validation Error",
                detail: "Field 'position' must be a positive integer",
              };
            }

            const maxPositionResult = await tx.product.aggregate({
              _max: { position: true },
              where: {
                deletedAt: null,
                position: { not: null },
              },
            });
            const maxPosition = maxPositionResult?._max?.position ?? 0;
            normalizedPosition = Math.min(data.position, maxPosition + 1);

            await tx.product.updateMany({
              where: {
                deletedAt: null,
                position: {
                  gte: normalizedPosition,
                },
              },
              data: {
                position: {
                  increment: 1,
                },
              },
            });
          } catch (positionError: unknown) {
            const err = positionError as { status?: number };
            if (err?.status === 400) throw positionError;
            console.warn('⚠️ [ADMIN SERVICE] Falling back to raw SQL for product position create:', positionError);
            normalizedPosition = await this.prepareProductCreatePositionRaw(tx, data.position);
          }
        }

        const createData = {
            brandId: data.brandId || undefined,
            primaryCategoryId: data.primaryCategoryId || undefined,
            categoryIds: data.categoryIds || [],
            media: finalMedia,
            published: data.published,
            featured: data.featured ?? false,
            ...(normalizedPosition !== null && { position: normalizedPosition }),
            minimumOrderQuantity: data.minimumOrderQuantity ?? 1,
            orderQuantityIncrement: data.orderQuantityIncrement ?? 1,
            publishedAt: data.published ? new Date() : undefined,
            translations: {
              create: translationsToCreate,
            },
            variants: {
              create: variantsData,
            },
            labels: data.labels && data.labels.length > 0
              ? {
                  create: data.labels.map((label) => ({
                    type: label.type,
                    value: label.value,
                    position: label.position,
                    color: label.color || undefined,
                    imageUrl: label.imageUrl || undefined,
                    imagePosition: label.imagePosition || undefined,
                  })),
                }
              : undefined,
            // Connect categories for many-to-many relation
            categories: data.categoryIds && data.categoryIds.length > 0
              ? {
                  connect: data.categoryIds.map((id) => ({ id })),
                }
              : undefined,
          };

        const createProduct = (productData: typeof createData) =>
          tx.product.create({
            data: productData,
          });

        let product;
        try {
          product = await createProduct(createData);
        } catch (err: unknown) {
          if (this.isUnknownProductPositionError(err)) {
            const { position: _p, ...dataWithoutPosition } = createData;
            product = await createProduct(dataWithoutPosition);
            if (normalizedPosition !== null) {
              await this.persistProductPositionRaw(tx, product.id, normalizedPosition);
            }
          } else {
            throw err;
          }
        }

        // Create ProductAttribute relations if attributeIds provided
        if (data.attributeIds && data.attributeIds.length > 0) {
          try {
            // Ensure table exists (for Vercel deployments where migrations might not run)
            await ensureProductAttributesTable();
            
            console.log('🔗 [ADMIN SERVICE] Creating ProductAttribute relations for product:', product.id, 'attributes:', data.attributeIds);
            await tx.productAttribute.createMany({
              data: data.attributeIds.map((attributeId) => ({
                productId: product.id,
                attributeId,
              })),
              skipDuplicates: true,
            });
            console.log('✅ [ADMIN SERVICE] Created ProductAttribute relations:', data.attributeIds);
          } catch (error: any) {
            console.error('❌ [ADMIN SERVICE] Failed to create ProductAttribute relations:', error);
            console.error('   Product ID:', product.id);
            console.error('   Attribute IDs:', data.attributeIds);
            console.error('   Error code:', error.code);
            console.error('   Error message:', error.message);
            // Re-throw to fail the transaction
            throw error;
          }
        }

        // DISABLED: Update attribute value imageUrls from variant images
        // When creating a new product, attribute values should remain unchanged
        // Attribute value images and colors should not be automatically updated from variant images
        // This ensures that attribute values keep their original state when products are created
        /*
        try {
          console.log('🖼️ [ADMIN SERVICE] Updating attribute value imageUrls from variant images...');
          const createdVariants = await tx.productVariant.findMany({
            where: { productId: product.id },
            include: {
              options: {
                include: {
                  attributeValue: true,
                },
              },
            },
          });

          for (const variant of createdVariants) {
            if (!variant.imageUrl) continue;

            // Use smartSplitUrls to properly handle comma-separated URLs and base64 images
            const variantImageUrls = smartSplitUrls(variant.imageUrl);
            if (variantImageUrls.length === 0) continue;

            // Process and validate first image URL
            const firstVariantImageUrl = processImageUrl(variantImageUrls[0]);
            if (!firstVariantImageUrl) {
              console.log(`⚠️ [ADMIN SERVICE] Variant ${variant.id} has invalid imageUrl, skipping attribute value update`);
              continue;
            }

            // Get all attribute value IDs from this variant's options
            const attributeValueIds = new Set<string>();
            variant.options.forEach((opt: any) => {
              if (opt.valueId && opt.attributeValue) {
                attributeValueIds.add(opt.valueId);
              }
            });

            // Update each attribute value's imageUrl if it doesn't already have one
            // or if the variant image is more specific (e.g., base64 or full URL)
            // BUT skip updating if:
            // - Attribute is "color" and attribute value doesn't have an imageUrl
            // - Attribute value only has colors but no imageUrl
            for (const valueId of attributeValueIds) {
              const attrValue = await tx.attributeValue.findUnique({
                where: { id: valueId },
                include: {
                  attribute: true,
                },
              });

              if (attrValue) {
                // Check if attribute is "color"
                const isColorAttribute = attrValue.attribute?.key === "color";
                
                // Check if attribute value only has colors but no imageUrl
                const hasColors = attrValue.colors && 
                  (Array.isArray(attrValue.colors) ? attrValue.colors.length > 0 : 
                   typeof attrValue.colors === 'string' ? attrValue.colors.trim() !== '' && attrValue.colors !== '[]' : 
                   Object.keys(attrValue.colors || {}).length > 0);
                const hasNoImageUrl = !attrValue.imageUrl || attrValue.imageUrl.trim() === '';
                const isColorOnly = hasColors && hasNoImageUrl;

                // Skip updating if:
                // 1. It's a color attribute AND doesn't have an imageUrl, OR
                // 2. It only has colors but no imageUrl
                if ((isColorAttribute && hasNoImageUrl) || isColorOnly) {
                  console.log(`⏭️ [ADMIN SERVICE] Skipping attribute value ${valueId} - color attribute or color-only value without imageUrl`);
                  continue;
                }

                // Only update if:
                // 1. Attribute value doesn't have an imageUrl, OR
                // 2. Variant image is a base64 (more specific) and attribute value has a URL
                const shouldUpdate = !attrValue.imageUrl || 
                  (firstVariantImageUrl.startsWith('data:image/') && attrValue.imageUrl && !attrValue.imageUrl.startsWith('data:image/'));

                if (shouldUpdate) {
                  console.log(`📸 [ADMIN SERVICE] Updating attribute value ${valueId} imageUrl from variant ${variant.id}:`, firstVariantImageUrl.substring(0, 50) + '...');
                  await tx.attributeValue.update({
                    where: { id: valueId },
                    data: { imageUrl: firstVariantImageUrl },
                  });
                } else {
                  console.log(`⏭️ [ADMIN SERVICE] Skipping attribute value ${valueId} - already has imageUrl`);
                }
              }
            }
          }
          console.log('✅ [ADMIN SERVICE] Finished updating attribute value imageUrls from variant images');
        } catch (error: any) {
          // Don't fail the transaction if this fails - it's a nice-to-have feature
          console.warn('⚠️ [ADMIN SERVICE] Failed to update attribute value imageUrls from variant images:', error);
        }
        */

        return await tx.product.findUnique({
          where: { id: product.id },
          include: {
            translations: true,
            variants: {
              include: {
                options: true,
              },
            },
            labels: true,
          },
        });
      }, { timeout: 30_000 });

      // Revalidate cache
      try {
        console.log('🧹 [ADMIN SERVICE] Revalidating paths for new product');
        revalidatePath('/');
        revalidatePath('/products');
        // @ts-expect-error - revalidateTag type issue in Next.js
        revalidateTag('products');
      } catch (e) {
        console.warn('⚠️ [ADMIN SERVICE] Revalidation failed:', e);
      }

      return result;
    } catch (error: any) {
      console.error("❌ [ADMIN SERVICE] createProduct error:", error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    data: {
      slug?: string;
      translations?: Array<{
        locale: string;
        title: string;
        slug: string;
        descriptionHtml?: string;
      }>;
      brandId?: string;
      primaryCategoryId?: string;
      categoryIds?: string[];
      published?: boolean;
      featured?: boolean;
      position?: number | null;
      minimumOrderQuantity?: number;
      orderQuantityIncrement?: number;
      media?: any[];
      labels?: Array<{
        id?: string;
        type: string;
        value: string;
        position: string;
        color?: string | null;
        imageUrl?: string | null;
        imagePosition?: string | null;
      }>;
      attributeIds?: string[];
      variants?: Array<{
        id?: string;
        price: string | number;
        compareAtPrice?: string | number;
        stock: string | number;
        sku?: string;
        color?: string;
        size?: string;
        imageUrl?: string;
        published?: boolean;
        options?: Array<{
          attributeKey: string;
          value: string;
          valueId?: string;
        }>;
      }>;
    }
  ) {
    try {
      console.log('🔄 [ADMIN SERVICE] Updating product:', productId, {
        translationsCount: data.translations?.length || 0,
      });

      if (data.position !== undefined) {
        await ensureProductPositionColumn();
      }
      await ensureProductLabelMediaColumns();
      
      // Check if product exists
      const existing = await db.product.findUnique({
        where: { id: productId },
        include: {
          translations: true,
        }
      });

      if (!existing) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Product not found",
          detail: `Product with id '${productId}' does not exist`,
        };
      }

      // Execute everything in a transaction for atomicity and speed
      // Timeout 30s: product update does many queries (translations, variants, labels, attributes)
      const result = await db.$transaction(async (tx: any) => {
        // Set UTF-8 encoding at the start of transaction to prevent encoding errors
        // This is critical for Armenian and other Unicode characters
        try {
          await tx.$executeRaw`SET client_encoding TO 'UTF8'`;
        } catch (encodingError: any) {
          // Log but continue - encoding might already be set
          console.warn('⚠️ [ADMIN SERVICE] Could not set client encoding in transaction:', encodingError?.message);
        }

        const locale = data.translations?.[0]?.locale ?? 'hy';

        // Collect all variant images to exclude from main media (if media is being updated)
        let allVariantImages: any[] = [];
        if (data.variants !== undefined) {
          data.variants.forEach((variant: any) => {
            if (variant.imageUrl) {
              const urls = smartSplitUrls(variant.imageUrl);
              allVariantImages.push(...urls);
            }
          });
        } else {
          // If variants not being updated, get existing variant images
          const existingVariants = await tx.productVariant.findMany({
            where: { productId },
            select: { imageUrl: true },
          });
          existingVariants.forEach((variant: any) => {
            if (variant.imageUrl) {
              const urls = smartSplitUrls(variant.imageUrl);
              allVariantImages.push(...urls);
            }
          });
        }

        // 1. Update product base data
        const updateData: any = {};
        if (data.brandId !== undefined) updateData.brandId = data.brandId || null;
        if (data.primaryCategoryId !== undefined) updateData.primaryCategoryId = data.primaryCategoryId || null;
        if (data.categoryIds !== undefined) updateData.categoryIds = data.categoryIds || [];
        if (data.media !== undefined) {
          // Separate main images from variant images and clean them
          const { main } = separateMainAndVariantImages(data.media, allVariantImages);
          updateData.media = cleanImageUrls(main);
          console.log('📸 [ADMIN SERVICE] Updated main media count:', updateData.media.length);
          console.log('📸 [ADMIN SERVICE] Variant images excluded:', allVariantImages.length);
        }
        if (data.published !== undefined) {
          updateData.published = data.published;
        }
        if (data.featured !== undefined) {
          updateData.featured = data.featured;
        }
        if (data.minimumOrderQuantity !== undefined) {
          updateData.minimumOrderQuantity = data.minimumOrderQuantity;
        }
        if (data.orderQuantityIncrement !== undefined) {
          updateData.orderQuantityIncrement = data.orderQuantityIncrement;
        }
        if (data.published !== undefined && data.published) {
          if (data.published && !existing.publishedAt) {
            updateData.publishedAt = new Date();
          }
        }
        if (data.featured !== undefined) updateData.featured = data.featured;
        if (data.minimumOrderQuantity !== undefined) updateData.minimumOrderQuantity = data.minimumOrderQuantity;
        if (data.orderQuantityIncrement !== undefined) updateData.orderQuantityIncrement = data.orderQuantityIncrement;

        let existingPositionRaw = (existing as { position?: number | null }).position;
        if (existingPositionRaw === undefined && data.position !== undefined) {
          existingPositionRaw = await this.getProductPositionRaw(tx, productId);
        }
        const existingPosition = this.normalizeProductPositionValue(existingPositionRaw ?? null);

        if (data.position !== undefined) {
          try {
            if (data.position === null) {
              if (existingPosition !== null) {
                await tx.product.updateMany({
                  where: {
                    id: { not: productId },
                    deletedAt: null,
                    position: {
                      gt: existingPosition,
                    },
                  },
                  data: {
                    position: {
                      decrement: 1,
                    },
                  },
                });
              }
              updateData.position = null;
            } else {
              if (!Number.isInteger(data.position) || data.position < 1) {
                throw {
                  status: 400,
                  type: "https://api.shop.am/problems/validation-error",
                  title: "Validation Error",
                  detail: "Field 'position' must be a positive integer",
                };
              }

              const maxPositionResult = await tx.product.aggregate({
                _max: { position: true },
                where: {
                  id: { not: productId },
                  deletedAt: null,
                  position: { not: null },
                },
              });
              const maxPosition = maxPositionResult?._max?.position ?? 0;
              const targetPosition = Math.min(data.position, maxPosition + 1);

              if (existingPosition === null) {
                await tx.product.updateMany({
                  where: {
                    id: { not: productId },
                    deletedAt: null,
                    position: {
                      gte: targetPosition,
                    },
                  },
                  data: {
                    position: {
                      increment: 1,
                    },
                  },
                });
              } else if (targetPosition < existingPosition) {
                await tx.product.updateMany({
                  where: {
                    id: { not: productId },
                    deletedAt: null,
                    position: {
                      gte: targetPosition,
                      lt: existingPosition,
                    },
                  },
                  data: {
                    position: {
                      increment: 1,
                    },
                  },
                });
              } else if (targetPosition > existingPosition) {
                await tx.product.updateMany({
                  where: {
                    id: { not: productId },
                    deletedAt: null,
                    position: {
                      gt: existingPosition,
                      lte: targetPosition,
                    },
                  },
                  data: {
                    position: {
                      decrement: 1,
                    },
                  },
                });
              }

              updateData.position = targetPosition;
            }
          } catch (positionError: unknown) {
            const err = positionError as { status?: number };
            if (err?.status === 400) throw positionError;
            console.warn('⚠️ [ADMIN SERVICE] Falling back to raw SQL for product position update:', positionError);
            updateData.position = await this.prepareProductUpdatePositionRaw(
              tx,
              productId,
              data.position ?? null,
              existingPosition
            );
          }
        }

        // 2. Update translations
        if (data.translations && data.translations.length > 0) {
          const firstT = data.translations[0];
          const currentSlug = existing.translations.find((t: { locale: string }) => t.locale === firstT.locale)?.slug;
          const finalSlug = await this.getNextUniqueSlug(tx, firstT.slug.trim(), firstT.locale, {
            excludeProductId: productId,
            currentSlug: currentSlug ?? undefined,
          });
          if (finalSlug !== firstT.slug.trim()) {
            console.log('🔗 [ADMIN SERVICE] Slug uniquified on update:', firstT.slug.trim(), '→', finalSlug);
          }
          for (const translation of data.translations) {
            await tx.productTranslation.upsert({
              where: {
                productId_locale: {
                  productId,
                  locale: translation.locale,
                },
              },
              update: {
                title: translation.title,
                slug: finalSlug,
                descriptionHtml: translation.descriptionHtml || null,
              },
              create: {
                productId,
                locale: translation.locale,
                title: translation.title,
                slug: finalSlug,
                descriptionHtml: translation.descriptionHtml || null,
              },
            });
          }
          console.log(`✅ [ADMIN SERVICE] Updated ${data.translations.length} translation(s)`);
        }

        // 3. Update labels
        if (data.labels !== undefined) {
          await tx.productLabel.deleteMany({ where: { productId } });
          if (data.labels.length > 0) {
            await tx.productLabel.createMany({
              data: data.labels.map((label) => ({
                productId,
                type: label.type,
                value: label.value,
                position: label.position,
                color: label.color || undefined,
                imageUrl: label.imageUrl || undefined,
                imagePosition: label.imagePosition || undefined,
              })),
            });
          }
        }

        // 3.5. Update ProductAttribute relations
        if (data.attributeIds !== undefined) {
          // Ensure table exists (for Vercel deployments where migrations might not run)
          await ensureProductAttributesTable();
          
          await tx.productAttribute.deleteMany({ where: { productId } });
          if (data.attributeIds.length > 0) {
            await tx.productAttribute.createMany({
              data: data.attributeIds.map((attributeId) => ({
                productId,
                attributeId,
              })),
              skipDuplicates: true,
            });
            console.log('✅ [ADMIN SERVICE] Updated ProductAttribute relations:', data.attributeIds);
          }
        }

          // 3.6. Update categories relation (many-to-many)
        if (data.categoryIds !== undefined) {
          // Get current categories
          const currentProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { categories: { select: { id: true } } },
          });
          
          const currentCategoryIds = currentProduct?.categories?.map((c: { id: string }) => c.id) || [];
          const newCategoryIds = data.categoryIds || [];
          
          // Find categories to disconnect (in current but not in new)
          const toDisconnect = currentCategoryIds.filter((id: string) => !newCategoryIds.includes(id));
          // Find categories to connect (in new but not in current)
          const toConnect = newCategoryIds.filter((id: string) => !currentCategoryIds.includes(id));
          
          if (toDisconnect.length > 0 || toConnect.length > 0) {
            await tx.product.update({
              where: { id: productId },
              data: {
                categories: {
                  disconnect: toDisconnect.map((id: string) => ({ id })),
                  connect: toConnect.map((id: string) => ({ id })),
                },
              },
            });
            console.log('✅ [ADMIN SERVICE] Updated categories relation:', {
              disconnected: toDisconnect,
              connected: toConnect,
            });
          }
        }

        // 4. Update variants
        if (data.variants !== undefined) {
          // Get existing variants with their IDs and SKUs for matching
          const existingVariants = await tx.productVariant.findMany({
            where: { productId },
            select: { id: true, sku: true },
          });
          const existingVariantIds = new Set<string>(existingVariants.map((v: { id: string }) => v.id));
          // Create a map of SKU -> variant ID for quick lookup
          const existingSkuMap = new Map<string, string>();
          existingVariants.forEach((v: { id: string; sku: string | null }) => {
            if (v.sku) {
              existingSkuMap.set(v.sku.trim().toLowerCase(), v.id);
            }
          });
          const incomingVariantIds = new Set<string>();
          
          // Process each variant: update if exists, create if new
          if (data.variants.length > 0) {
            for (const variant of data.variants) {
              const options: any[] = [];
              const attributesMap: Record<string, Array<{ valueId: string; value: string; attributeKey: string }>> = {};
              
              // Support both old format (color/size) and new format (options array)
              if (variant.options && Array.isArray(variant.options) && variant.options.length > 0) {
                // New format: use options array
                for (const opt of variant.options) {
                  let valueId: string | null = null;
                  let attributeKey: string | null = null;
                  let value: string | null = null;

                  if (opt.valueId) {
                    valueId = opt.valueId;
                    const attrValue = await tx.attributeValue.findUnique({
                      where: { id: opt.valueId },
                      include: { attribute: true },
                    });
                    if (attrValue) {
                      attributeKey = attrValue.attribute.key;
                      value = attrValue.value;
                    }
                    options.push({ valueId: opt.valueId });
                  } else if (opt.attributeKey && opt.value) {
                    const foundValueId = await findOrCreateAttributeValue(opt.attributeKey, opt.value, locale);
                    if (foundValueId) {
                      valueId = foundValueId;
                      attributeKey = opt.attributeKey;
                      value = opt.value;
                      options.push({ valueId: foundValueId });
                    } else {
                      attributeKey = opt.attributeKey;
                      value = opt.value;
                      options.push({ attributeKey: opt.attributeKey, value: opt.value });
                    }
                  }

                  // Build attributes JSONB structure
                  if (attributeKey && valueId && value) {
                    if (!attributesMap[attributeKey]) {
                      attributesMap[attributeKey] = [];
                    }
                    if (!attributesMap[attributeKey].some(item => item.valueId === valueId)) {
                      attributesMap[attributeKey].push({
                        valueId,
                        value,
                        attributeKey,
                      });
                    }
                  }
                }
              } else {
                // Old format: Try to find or create AttributeValues for color and size
                if (variant.color) {
                  const colorValueId = await findOrCreateAttributeValue("color", variant.color, locale);
                  if (colorValueId) {
                    options.push({ valueId: colorValueId });
                    if (!attributesMap["color"]) {
                      attributesMap["color"] = [];
                    }
                    attributesMap["color"].push({
                      valueId: colorValueId,
                      value: variant.color,
                      attributeKey: "color",
                    });
                  } else {
                    // Fallback to old format if AttributeValue not found
                    options.push({ attributeKey: "color", value: variant.color });
                  }
                }
                
                if (variant.size) {
                  const sizeValueId = await findOrCreateAttributeValue("size", variant.size, locale);
                  if (sizeValueId) {
                    options.push({ valueId: sizeValueId });
                    if (!attributesMap["size"]) {
                      attributesMap["size"] = [];
                    }
                    attributesMap["size"].push({
                      valueId: sizeValueId,
                      value: variant.size,
                      attributeKey: "size",
                    });
                  } else {
                    // Fallback to old format if AttributeValue not found
                    options.push({ attributeKey: "size", value: variant.size });
                  }
                }
              }

              const price = typeof variant.price === 'number' ? variant.price : parseFloat(String(variant.price));
              const stock = typeof variant.stock === 'number' ? variant.stock : parseInt(String(variant.stock), 10);
              // Explicit null when empty so DB is updated and discount is cleared (Prisma ignores undefined)
              const rawCompare = variant.compareAtPrice;
              const compareAtPrice =
                rawCompare !== undefined && rawCompare !== null && String(rawCompare).trim() !== ''
                  ? (typeof rawCompare === 'number' ? rawCompare : parseFloat(String(rawCompare)))
                  : null;

              if (isNaN(price) || price < 0) {
                throw new Error(`Invalid price value: ${variant.price}`);
              }

              // Convert attributesMap to JSONB format
              const attributesJson = Object.keys(attributesMap).length > 0 ? attributesMap : null;

              // Check if variant should be updated or created
              // First check by ID if provided
              let variantToUpdate = null;
              let variantIdToUse: string | null = null;
              
              if (variant.id && existingVariantIds.has(variant.id)) {
                variantToUpdate = await tx.productVariant.findUnique({
                  where: { id: variant.id },
                });
                variantIdToUse = variant.id;
                console.log(`🔍 [ADMIN SERVICE] Variant lookup by ID ${variant.id}:`, variantToUpdate ? 'found' : 'not found');
              }
              
              // If not found by ID, try to find by SKU using the SKU map (faster than DB query)
              if (!variantToUpdate && variant.sku) {
                const skuValue = variant.sku.trim();
                const skuKey = skuValue.toLowerCase();
                const matchedVariantId = existingSkuMap.get(skuKey);
                
                if (matchedVariantId) {
                  variantToUpdate = await tx.productVariant.findUnique({
                    where: { id: matchedVariantId },
                  });
                  variantIdToUse = matchedVariantId;
                  console.log(`🔍 [ADMIN SERVICE] Variant lookup by SKU "${skuValue}": found variant ID ${matchedVariantId}`);
                } else {
                  // Prefer current product: find variant with this SKU in the product we're updating
                  const sameProductVariant = await tx.productVariant.findFirst({
                    where: {
                      sku: skuValue,
                      productId,
                    },
                  });
                  if (sameProductVariant) {
                    variantToUpdate = sameProductVariant;
                    variantIdToUse = sameProductVariant.id;
                    console.log(`🔍 [ADMIN SERVICE] Variant lookup by SKU "${skuValue}": same product, using variant ID ${sameProductVariant.id}`);
                  } else {
                    // SKU exists in another product -> conflict
                    const existingSkuVariant = await tx.productVariant.findFirst({
                      where: { sku: skuValue },
                    });
                    if (existingSkuVariant) {
                      const otherProductId = existingSkuVariant.productId;
                      console.warn(`⚠️ [ADMIN SERVICE] SKU "${skuValue}" already exists in product ${otherProductId}, not in current ${productId}`);
                      throw {
                        status: 409,
                        type: "https://api.shop.am/problems/conflict",
                        title: "Conflict",
                        detail: `SKU "${skuValue}" already exists in another product. Use a different SKU for this product.`,
                        conflictProductId: otherProductId,
                      };
                    }
                    console.log(`🔍 [ADMIN SERVICE] Variant lookup by SKU "${skuValue}": not found, will create new variant`);
                  }
                }
              }
              
              if (variantToUpdate && variantIdToUse) {
                // Update existing variant
                incomingVariantIds.add(variantIdToUse);
                
                // Delete old options and create new ones
                await tx.productVariantOption.deleteMany({
                  where: { variantId: variantToUpdate.id },
                });
                
                // Process and validate variant imageUrl
                let processedVariantImageUrl: string | undefined = undefined;
                if (variant.imageUrl) {
                  const urls = smartSplitUrls(variant.imageUrl);
                  const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
                  if (processedUrls.length > 0) {
                    processedVariantImageUrl = processedUrls.join(',');
                  }
                }

                await tx.productVariant.update({
                  where: { id: variantIdToUse },
                  data: {
                    sku: variant.sku ? variant.sku.trim() : undefined,
                    price,
                    compareAtPrice,
                    stock: isNaN(stock) ? 0 : stock,
                    imageUrl: processedVariantImageUrl,
                    published: variant.published !== false,
                    attributes: attributesJson,
                    options: {
                      create: options,
                    },
                  },
                });
                
                console.log(`✅ [ADMIN SERVICE] Updated variant: ${variantIdToUse} (found by ${variant.id ? 'ID' : 'SKU'})`);
              } else {
                // Create new variant
                // Double-check that SKU doesn't already exist (safety check)
                if (variant.sku) {
                  const skuValue = variant.sku.trim();
                  const existingSkuCheck = await tx.productVariant.findFirst({
                    where: {
                      sku: skuValue,
                    },
                  });
                  
                  if (existingSkuCheck) {
                    console.error(`❌ [ADMIN SERVICE] SKU "${skuValue}" already exists! Variant ID: ${existingSkuCheck.id}, Product ID: ${existingSkuCheck.productId}`);
                    throw {
                      status: 409,
                      type: "https://api.shop.am/problems/conflict",
                      title: "Conflict",
                      detail: `SKU "${skuValue}" already exists. Cannot create duplicate variant.`,
                    };
                  }
                }
                
                // Process and validate variant imageUrl
                let processedVariantImageUrl: string | undefined = undefined;
                if (variant.imageUrl) {
                  const urls = smartSplitUrls(variant.imageUrl);
                  const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
                  if (processedUrls.length > 0) {
                    processedVariantImageUrl = processedUrls.join(',');
                  }
                }

                console.log(`🆕 [ADMIN SERVICE] Creating new variant with SKU: ${variant.sku || 'none'}`);
                const newVariant = await tx.productVariant.create({
                  data: {
                    productId,
                    sku: variant.sku ? variant.sku.trim() : undefined,
                    price,
                    compareAtPrice,
                    stock: isNaN(stock) ? 0 : stock,
                    imageUrl: processedVariantImageUrl,
                    published: variant.published !== false,
                    attributes: attributesJson,
                    options: {
                      create: options,
                    },
                  },
                });
                
                if (newVariant.id) {
                  incomingVariantIds.add(newVariant.id);
                }
                
                console.log(`✅ [ADMIN SERVICE] Created new variant: ${newVariant.id}`);
              }
            }
          }
          
          // Delete variants that are no longer in the list
          const variantsToDelete = Array.from(existingVariantIds).filter(id => !incomingVariantIds.has(id));
          if (variantsToDelete.length > 0) {
            // Remove cart items that reference these variants (FK constraint)
            const deletedCartItems = await tx.cartItem.deleteMany({
              where: { variantId: { in: variantsToDelete } },
            });
            if (deletedCartItems.count > 0) {
              console.log(`🛒 [ADMIN SERVICE] Removed ${deletedCartItems.count} cart item(s) referencing deleted variants`);
            }
            await tx.productVariant.deleteMany({
              where: {
                id: { in: variantsToDelete },
                productId,
              },
            });
            console.log(`🗑️ [ADMIN SERVICE] Deleted ${variantsToDelete.length} variant(s):`, variantsToDelete);
          }
        }

        // Update attribute value imageUrls from variant images
        // If a variant has an imageUrl, update the corresponding attribute value's imageUrl
        try {
          console.log('🖼️ [ADMIN SERVICE] Updating attribute value imageUrls from variant images...');
          const allVariants = await tx.productVariant.findMany({
            where: { productId },
            include: {
              options: {
                include: {
                  attributeValue: true,
                },
              },
            },
          });

          for (const variant of allVariants) {
            if (!variant.imageUrl) continue;

            // Use smartSplitUrls to properly handle comma-separated URLs and base64 images
            const variantImageUrls = smartSplitUrls(variant.imageUrl);
            if (variantImageUrls.length === 0) continue;

            // Process and validate first image URL
            const firstVariantImageUrl = processImageUrl(variantImageUrls[0]);
            if (!firstVariantImageUrl) {
              console.log(`⚠️ [ADMIN SERVICE] Variant ${variant.id} has invalid imageUrl, skipping attribute value update`);
              continue;
            }

            // Get all attribute value IDs from this variant's options
            const attributeValueIds = new Set<string>();
            variant.options.forEach((opt: any) => {
              if (opt.valueId && opt.attributeValue) {
                attributeValueIds.add(opt.valueId);
              }
            });

            // Update each attribute value's imageUrl if it doesn't already have one
            // or if the variant image is more specific (e.g., base64 or full URL)
            // BUT skip updating if:
            // - Attribute is "color" and attribute value doesn't have an imageUrl
            // - Attribute value only has colors but no imageUrl
            for (const valueId of attributeValueIds) {
              const attrValue = await tx.attributeValue.findUnique({
                where: { id: valueId },
                include: {
                  attribute: true,
                },
              });

              if (attrValue) {
                // Check if attribute is "color"
                const isColorAttribute = attrValue.attribute?.key === "color";
                
                // Check if attribute value only has colors but no imageUrl
                const hasColors = attrValue.colors && 
                  (Array.isArray(attrValue.colors) ? attrValue.colors.length > 0 : 
                   typeof attrValue.colors === 'string' ? attrValue.colors.trim() !== '' && attrValue.colors !== '[]' : 
                   Object.keys(attrValue.colors || {}).length > 0);
                const hasNoImageUrl = !attrValue.imageUrl || attrValue.imageUrl.trim() === '';
                const isColorOnly = hasColors && hasNoImageUrl;

                // Skip updating if:
                // 1. It's a color attribute AND doesn't have an imageUrl, OR
                // 2. It only has colors but no imageUrl
                if ((isColorAttribute && hasNoImageUrl) || isColorOnly) {
                  console.log(`⏭️ [ADMIN SERVICE] Skipping attribute value ${valueId} - color attribute or color-only value without imageUrl`);
                  continue;
                }

                // Only update if:
                // 1. Attribute value doesn't have an imageUrl, OR
                // 2. Variant image is a base64 (more specific) and attribute value has a URL
                const shouldUpdate = !attrValue.imageUrl || 
                  (firstVariantImageUrl.startsWith('data:image/') && attrValue.imageUrl && !attrValue.imageUrl.startsWith('data:image/'));

                if (shouldUpdate) {
                  console.log(`📸 [ADMIN SERVICE] Updating attribute value ${valueId} imageUrl from variant ${variant.id}:`, firstVariantImageUrl.substring(0, 50) + '...');
                  await tx.attributeValue.update({
                    where: { id: valueId },
                    data: { imageUrl: firstVariantImageUrl },
                  });
                } else {
                  console.log(`⏭️ [ADMIN SERVICE] Skipping attribute value ${valueId} - already has imageUrl`);
                }
              }
            }
          }
          console.log('✅ [ADMIN SERVICE] Finished updating attribute value imageUrls from variant images');
        } catch (error: any) {
          // Don't fail the transaction if this fails - it's a nice-to-have feature
          console.warn('⚠️ [ADMIN SERVICE] Failed to update attribute value imageUrls from variant images:', error);
        }

        // 5. Finally update the product record itself
        // Retry without position if client was generated from schema without Product.position (e.g. Vercel before migration)
        const doUpdate = (data: typeof updateData) =>
          tx.product.update({
            where: { id: productId },
            data,
            include: {
              translations: true,
              variants: { include: { options: true } },
              labels: true,
            },
          });
        try {
          return await doUpdate(updateData);
        } catch (err: unknown) {
          if (this.isUnknownProductPositionError(err)) {
            const positionToPersist =
              Object.prototype.hasOwnProperty.call(updateData, 'position')
                ? (updateData as { position?: number | null }).position ?? null
                : undefined;
            const { position: _p, ...dataWithoutPosition } = updateData;
            const updatedProduct = await doUpdate(dataWithoutPosition);
            if (positionToPersist !== undefined) {
              await this.persistProductPositionRaw(tx, productId, positionToPersist);
            }
            return updatedProduct;
          }
          throw err;
        }
      }, { timeout: 30_000 });

      // 6. Revalidate cache for this product and related pages
      try {
        console.log('🧹 [ADMIN SERVICE] Revalidating paths for product:', productId);
        revalidatePath(`/products/${result.translations[0]?.slug}`);
        revalidatePath('/');
        revalidatePath('/products');
        // @ts-expect-error - revalidateTag type issue in Next.js
        revalidateTag('products');
        // @ts-expect-error - revalidateTag type issue in Next.js
        revalidateTag(`product-${productId}`);
      } catch (e) {
        console.warn('⚠️ [ADMIN SERVICE] Revalidation failed (expected in some environments):', e);
      }

      return result;
    } catch (error: any) {
      // ... (rest of error handling)
      console.error("❌ [ADMIN SERVICE] updateProduct error:", error);
      throw error;
    }
  }

  /**
   * Delete product (hard delete — բազայից ամբողջությամբ ջնջում)
   */
  async deleteProduct(productId: string) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, variants: { select: { id: true } } },
    });

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    const variantIds = product.variants.map((v) => v.id);
    if (variantIds.length > 0) {
      await db.cartItem.deleteMany({
        where: { variantId: { in: variantIds } },
      });
      await db.orderItem.updateMany({
        where: { variantId: { in: variantIds } },
        data: { variantId: null },
      });
    }

    await db.product.delete({
      where: { id: productId },
    });

    return { success: true };
  }

  /**
   * Update product discount
   */
  async updateProductDiscount(productId: string, discountPercent: number) {
    console.log('💰 [ADMIN SERVICE] updateProductDiscount called:', { productId, discountPercent });
    
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error('❌ [ADMIN SERVICE] Product not found:', productId);
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    const clampedDiscount = Math.max(0, Math.min(100, discountPercent));
    console.log('💰 [ADMIN SERVICE] Updating product discount:', {
      productId,
      oldDiscount: product.discountPercent,
      newDiscount: clampedDiscount,
    });

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        discountPercent: clampedDiscount,
      },
    });

    console.log('✅ [ADMIN SERVICE] Product discount updated successfully:', {
      productId,
      discountPercent: updated.discountPercent,
    });

    return { success: true, discountPercent: updated.discountPercent };
  }

  /**
   * Get settings
   */
  async getSettings() {
    const settings = await db.settings.findMany({
      where: {
        key: {
          in: ['globalDiscount', 'categoryDiscounts', 'brandDiscounts', 'defaultCurrency', 'currencyRates'],
        },
      },
    });
    
    const globalDiscountSetting = settings.find((s) => s.key === 'globalDiscount');
    const categoryDiscountsSetting = settings.find((s) => s.key === 'categoryDiscounts');
    const brandDiscountsSetting = settings.find((s) => s.key === 'brandDiscounts');
    const defaultCurrencySetting = settings.find((s) => s.key === 'defaultCurrency');
    const currencyRatesSetting = settings.find((s) => s.key === 'currencyRates');
    
    // Default currency rates (fallback)
    const defaultCurrencyRates = {
      USD: 1,
      AMD: 400,
      EUR: 0.92,
      RUB: 90,
      GEL: 2.7,
    };
    
    return {
      globalDiscount: globalDiscountSetting ? Number(globalDiscountSetting.value as string) : 0,
      categoryDiscounts: categoryDiscountsSetting ? (categoryDiscountsSetting.value as Record<string, number>) : {},
      brandDiscounts: brandDiscountsSetting ? (brandDiscountsSetting.value as Record<string, number>) : {},
      defaultCurrency: defaultCurrencySetting ? (defaultCurrencySetting.value as string) : 'AMD',
      currencyRates: currencyRatesSetting ? (currencyRatesSetting.value as Record<string, number>) : defaultCurrencyRates,
    };
  }

  /**
   * Update settings
   */
  async updateSettings(data: any) {
    console.log('⚙️ [ADMIN SERVICE] Updating settings...', data);
    
    // Update global discount
    if (data.globalDiscount !== undefined) {
      const globalDiscountValue = Number(data.globalDiscount) || 0;
      await db.settings.upsert({
        where: { key: 'globalDiscount' },
        update: {
          value: globalDiscountValue,
          updatedAt: new Date(),
        },
        create: {
          key: 'globalDiscount',
          value: globalDiscountValue,
          description: 'Global discount percentage for all products',
        },
      });
      console.log('✅ [ADMIN SERVICE] Global discount updated:', globalDiscountValue);
    }
    
    // Update category discounts
    if (data.categoryDiscounts !== undefined) {
      await db.settings.upsert({
        where: { key: 'categoryDiscounts' },
        update: {
          value: data.categoryDiscounts,
          updatedAt: new Date(),
        },
        create: {
          key: 'categoryDiscounts',
          value: data.categoryDiscounts,
          description: 'Discount percentages by category ID',
        },
      });
      console.log('✅ [ADMIN SERVICE] Category discounts updated:', data.categoryDiscounts);
    }
    
    // Update brand discounts
    if (data.brandDiscounts !== undefined) {
      await db.settings.upsert({
        where: { key: 'brandDiscounts' },
        update: {
          value: data.brandDiscounts,
          updatedAt: new Date(),
        },
        create: {
          key: 'brandDiscounts',
          value: data.brandDiscounts,
          description: 'Discount percentages by brand ID',
        },
      });
      console.log('✅ [ADMIN SERVICE] Brand discounts updated:', data.brandDiscounts);
    }
    
    // Update default currency
    if (data.defaultCurrency !== undefined) {
      const currencyValue = String(data.defaultCurrency);
      await db.settings.upsert({
        where: { key: 'defaultCurrency' },
        update: {
          value: currencyValue,
          updatedAt: new Date(),
        },
        create: {
          key: 'defaultCurrency',
          value: currencyValue,
          description: 'Default currency for admin product pricing (USD, AMD, EUR)',
        },
      });
      console.log('✅ [ADMIN SERVICE] Default currency updated:', currencyValue);
    }
    
    // Update currency rates
    if (data.currencyRates !== undefined) {
      await db.settings.upsert({
        where: { key: 'currencyRates' },
        update: {
          value: data.currencyRates,
          updatedAt: new Date(),
        },
        create: {
          key: 'currencyRates',
          value: data.currencyRates,
          description: 'Currency exchange rates relative to USD (USD, AMD, EUR, RUB, GEL). Note: Stored as USD-based internally, but displayed as AMD-based in admin UI.',
        },
      });
      console.log('✅ [ADMIN SERVICE] Currency rates updated:', data.currencyRates);
    }
    
    return { success: true };
  }

  /**
   * Get price filter settings
   */
  async getPriceFilterSettings() {
    console.log('⚙️ [ADMIN SERVICE] Fetching price filter settings...');
    const setting = await db.settings.findUnique({
      where: { key: 'price-filter' },
    });

    if (!setting) {
      console.log('✅ [ADMIN SERVICE] Price filter settings not found, returning defaults');
      return {
        minPrice: null,
        maxPrice: null,
        stepSize: null,
        stepSizePerCurrency: null,
      };
    }

    const value = setting.value as {
      minPrice?: number;
      maxPrice?: number;
      stepSize?: number;
      stepSizePerCurrency?: {
        USD?: number;
        AMD?: number;
        RUB?: number;
        GEL?: number;
      };
    };
    console.log('✅ [ADMIN SERVICE] Price filter settings loaded:', value);
    return {
      minPrice: value.minPrice ?? null,
      maxPrice: value.maxPrice ?? null,
      stepSize: value.stepSize ?? null,
      stepSizePerCurrency: value.stepSizePerCurrency ?? null,
    };
  }

  /**
   * Update price filter settings
   */
  async updatePriceFilterSettings(data: {
    minPrice?: number | null;
    maxPrice?: number | null;
    stepSize?: number | null;
    stepSizePerCurrency?: {
      USD?: number | null;
      AMD?: number | null;
      RUB?: number | null;
      GEL?: number | null;
    } | null;
  }) {
    console.log('⚙️ [ADMIN SERVICE] Updating price filter settings...', data);
    
    const value: {
      minPrice?: number;
      maxPrice?: number;
      stepSize?: number;
      stepSizePerCurrency?: {
        USD?: number;
        AMD?: number;
        RUB?: number;
        GEL?: number;
      };
    } = {};
    
    if (data.minPrice !== null && data.minPrice !== undefined) {
      value.minPrice = data.minPrice;
    }
    if (data.maxPrice !== null && data.maxPrice !== undefined) {
      value.maxPrice = data.maxPrice;
    }
    if (data.stepSize !== null && data.stepSize !== undefined) {
      value.stepSize = data.stepSize;
    }
    if (data.stepSizePerCurrency) {
      const cleaned: { USD?: number; AMD?: number; RUB?: number; GEL?: number } = {};
      if (data.stepSizePerCurrency.USD !== null && data.stepSizePerCurrency.USD !== undefined) {
        cleaned.USD = data.stepSizePerCurrency.USD;
      }
      if (data.stepSizePerCurrency.AMD !== null && data.stepSizePerCurrency.AMD !== undefined) {
        cleaned.AMD = data.stepSizePerCurrency.AMD;
      }
      if (data.stepSizePerCurrency.RUB !== null && data.stepSizePerCurrency.RUB !== undefined) {
        cleaned.RUB = data.stepSizePerCurrency.RUB;
      }
      if (data.stepSizePerCurrency.GEL !== null && data.stepSizePerCurrency.GEL !== undefined) {
        cleaned.GEL = data.stepSizePerCurrency.GEL;
      }
      if (Object.keys(cleaned).length > 0) {
        value.stepSizePerCurrency = cleaned;
      }
    }

    const setting = await db.settings.upsert({
      where: { key: 'price-filter' },
      update: {
        value: value,
        updatedAt: new Date(),
      },
      create: {
        key: 'price-filter',
        value: value,
        description: 'Price filter default range and step size settings',
      },
    });

    console.log('✅ [ADMIN SERVICE] Price filter settings updated:', setting);
    const stored = setting.value as any;
    return {
      success: true,
      minPrice: stored.minPrice ?? null,
      maxPrice: stored.maxPrice ?? null,
      stepSize: stored.stepSize ?? null,
      stepSizePerCurrency: stored.stepSizePerCurrency ?? null,
    };
  }

  /**
   * Get user activity (recent registrations and active users)
   */
  async getUserActivity(limit: number = 10) {
    // Get recent registrations
    const recentUsers = await db.user.findMany({
      where: {
        deletedAt: null,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    const recentRegistrations = recentUsers.map((user: { id: string; email: string | null; phone: string | null; firstName: string | null; lastName: string | null; createdAt: Date }) => ({
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.phone || "Unknown",
      registeredAt: user.createdAt.toISOString(),
      lastLoginAt: undefined, // We don't track last login yet
    }));

    // Get active users (users with orders)
    const usersWithOrders = await db.user.findMany({
      where: {
        deletedAt: null,
        orders: {
          some: {},
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      take: limit,
    });

    const activeUsers = usersWithOrders.map((user: { id: string; email: string | null; phone: string | null; firstName: string | null; lastName: string | null; createdAt: Date; orders: Array<{ id: string; total: number; createdAt: Date }> }) => {
      const orders = Array.isArray(user.orders) ? user.orders : [];
      const orderCount = orders.length;
      const totalSpent = orders.reduce((sum: number, order: { total: number }) => sum + order.total, 0);
      const lastOrder = orders[0] || null;

      return {
        id: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.phone || "Unknown",
        orderCount,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt.toISOString() : user.createdAt.toISOString(),
        lastLoginAt: undefined, // We don't track last login yet
      };
    });

    return {
      recentRegistrations,
      activeUsers,
    };
  }

  /**
   * Get recent orders for dashboard
   */
  async getRecentOrders(limit: number = 5) {
    const orders = await db.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    return orders.map((order: { id: string; number: string; status: string; paymentStatus: string; total: number; currency: string | null; customerEmail: string | null; customerPhone: string | null; createdAt: Date; items: Array<unknown> }) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      customerEmail: order.customerEmail || undefined,
      customerPhone: order.customerPhone || undefined,
      itemsCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  /**
   * Get top products for dashboard
   */
  async getTopProducts(limit: number = 5) {
    // Get all order items with their variants
    const orderItems = await db.orderItem.findMany({
      include: {
        variant: {
          include: {
            product: {
              include: {
                translations: {
                  where: { locale: "en" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Group by variant and calculate stats
    const productStats = new Map<
      string,
      {
        variantId: string;
        productId: string;
        title: string;
        sku: string;
        totalQuantity: number;
        totalRevenue: number;
        orderCount: number;
        image?: string | null;
      }
    >();

    orderItems.forEach((item) => {
      if (!item.variant) return;

      const variantId = item.variantId || item.variant.id;
      const productId = item.variant.productId;
      const product = item.variant.product;
      const translations = product?.translations || [];
      const translation = translations[0];
      const title = translation?.title || "Unknown Product";
      const sku = item.variant.sku || item.sku || "N/A";
      const image = product && Array.isArray(product.media) && product.media.length > 0
        ? (product.media[0] as any)?.url || null
        : null;

      if (!productStats.has(variantId)) {
        productStats.set(variantId, {
          variantId,
          productId,
          title,
          sku,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
          image,
        });
      }

      const stats = productStats.get(variantId)!;
      stats.totalQuantity += item.quantity;
      stats.totalRevenue += item.total;
      stats.orderCount += 1;
    });

    // Convert to array and sort by revenue
    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topProducts;
  }

  /**
   * Get categories for admin
   */
  async getCategories() {
    const categories = await db.category.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        translations: {
          where: { locale: "en" },
          take: 1,
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    return {
      data: categories.map((category: { id: string; parentId: string | null; requiresSizes: boolean | null; translations?: Array<{ title: string; slug: string }> }) => {
        const translations = Array.isArray(category.translations) ? category.translations : [];
        const translation = translations[0] || null;
        return {
          id: category.id,
          title: translation?.title || "",
          slug: translation?.slug || "",
          parentId: category.parentId,
          requiresSizes: category.requiresSizes || false,
        };
      }),
    };
  }

  /**
   * Create category
   */
  async createCategory(data: {
    title: string;
    slug?: string;
    locale?: string;
    parentId?: string;
    requiresSizes?: boolean;
  }) {
    const locale = data.locale || "en";
    
    // Validate parent category exists if parentId is provided
    if (data.parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Parent category not found",
          detail: `Parent category with id '${data.parentId}' does not exist`,
        };
      }
    }
    
    // Generate unique slug from title or use provided slug
    const baseSlug = data.slug?.trim() || data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Ensure slug is unique for this locale
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db.categoryTranslation.findFirst({
        where: {
          slug,
          locale,
        },
      });
      
      if (!existing) {
        break; // Slug is unique
      }
      
      // Slug exists, try with counter
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      // Safety limit to prevent infinite loop
      if (counter > 1000) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    const category = await db.category.create({
      data: {
        parentId: data.parentId || undefined,
        requiresSizes: data.requiresSizes || false,
        published: true,
        translations: {
          create: {
            locale,
            title: data.title,
            slug,
            fullPath: slug, // Can be enhanced to build full path
          },
        },
      },
      include: {
        translations: true,
      },
    });

    // Безопасное получение translation с проверкой на существование массива
    const categoryTranslations = Array.isArray(category.translations) ? category.translations : [];
    const translation = categoryTranslations.find((t: { locale: string }) => t.locale === locale) || categoryTranslations[0] || null;

    return {
      data: {
        id: category.id,
        title: translation?.title || "",
        slug: translation?.slug || "",
        parentId: category.parentId,
        requiresSizes: category.requiresSizes || false,
      },
    };
  }

  /**
   * Get category by ID with children
   */
  async getCategoryById(categoryId: string) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: {
          where: { locale: "en" },
          take: 1,
        },
        children: {
          include: {
            translations: {
              where: { locale: "en" },
              take: 1,
            },
          },
        },
      },
    });

    if (!category) {
      return null;
    }

    const translations = Array.isArray(category.translations) ? category.translations : [];
    const translation = translations[0] || null;

    return {
      id: category.id,
      title: translation?.title || "",
      slug: translation?.slug || "",
      parentId: category.parentId,
      requiresSizes: category.requiresSizes || false,
      children: category.children.map((child: { id: string; parentId: string | null; requiresSizes: boolean | null; translations?: Array<{ title: string; slug: string }> }) => {
        const childTranslations = Array.isArray(child.translations) ? child.translations : [];
        const childTranslation = childTranslations[0] || null;
        return {
          id: child.id,
          title: childTranslation?.title || "",
          slug: childTranslation?.slug || "",
          parentId: child.parentId,
          requiresSizes: child.requiresSizes || false,
        };
      }),
    };
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, data: {
    title?: string;
    slug?: string;
    locale?: string;
    parentId?: string | null;
    requiresSizes?: boolean;
    subcategoryIds?: string[];
  }) {
    const locale = data.locale || "en";
    
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: true,
      },
    });

    if (!category) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Category not found",
        detail: `Category with id '${categoryId}' does not exist`,
      };
    }

    // Prevent circular reference (category cannot be its own parent)
    if (data.parentId === categoryId) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Invalid parent",
        detail: "Category cannot be its own parent",
      };
    }

    // Prevent setting parent to a child category (would create circular reference)
    if (data.parentId) {
      const potentialParent = await db.category.findUnique({
        where: { id: data.parentId },
        include: {
          children: {
            where: {
              deletedAt: null,
            },
          },
        },
      });

      if (!potentialParent) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Parent category not found",
          detail: `Parent category with id '${data.parentId}' does not exist`,
        };
      }

      // Check if the category to update is in the children of the potential parent
      const isChild = await this.isCategoryDescendant(potentialParent.id, categoryId);
      if (isChild) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/bad-request",
          title: "Circular reference",
          detail: "Cannot set parent to a category that is a descendant of this category",
        };
      }
    }

    // Update subcategories if provided
    if (data.subcategoryIds !== undefined) {
      // First, remove all existing children relationships
      await db.category.updateMany({
        where: { parentId: categoryId },
        data: { parentId: null },
      });

      // Then, set new children relationships (prevent circular references)
      if (data.subcategoryIds.length > 0) {
        // Filter out the category itself and its descendants
        const validSubcategoryIds = data.subcategoryIds.filter(id => id !== categoryId);
        
        // Check for circular references
        for (const subId of validSubcategoryIds) {
          const isDescendant = await this.isCategoryDescendant(categoryId, subId);
          if (isDescendant) {
            throw {
              status: 400,
              type: "https://api.shop.am/problems/bad-request",
              title: "Circular reference",
              detail: "Cannot set a descendant category as subcategory",
            };
          }
        }

        if (validSubcategoryIds.length > 0) {
          await db.category.updateMany({
            where: { 
              id: { in: validSubcategoryIds },
            },
            data: { parentId: categoryId },
          });
        }
      }
    }

    const updateData: any = {};
    
    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId || null;
    }
    
    if (data.requiresSizes !== undefined) {
      updateData.requiresSizes = data.requiresSizes;
    }

    // Update translation if title is provided
    if (data.title) {
      // Generate unique slug from title or use provided slug
      const baseSlug = data.slug?.trim() || data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      const categoryTranslations = Array.isArray(category.translations) ? category.translations : [];
      const existingTranslation = categoryTranslations.find((t: { locale: string }) => t.locale === locale);

      // Ensure slug is unique for this locale (excluding current translation)
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await db.categoryTranslation.findFirst({
          where: {
            slug,
            locale,
            NOT: existingTranslation ? { id: existingTranslation.id } : undefined,
          },
        });
        
        if (!existing) {
          break; // Slug is unique
        }
        
        // Slug exists, try with counter
        slug = `${baseSlug}-${counter}`;
        counter++;
        
        // Safety limit to prevent infinite loop
        if (counter > 1000) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }

      if (existingTranslation) {
        // Update existing translation
        await db.categoryTranslation.update({
          where: { id: existingTranslation.id },
          data: {
            title: data.title,
            slug,
          },
        });
      } else {
        // Create new translation
        await db.categoryTranslation.create({
          data: {
            categoryId: category.id,
            locale,
            title: data.title,
            slug,
            fullPath: slug,
          },
        });
      }
    }

    // Update category base data
    const updatedCategory = await db.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        translations: true,
      },
    });

    const categoryTranslations = Array.isArray(updatedCategory.translations) ? updatedCategory.translations : [];
    const translation = categoryTranslations.find((t: { locale: string }) => t.locale === locale) || categoryTranslations[0] || null;

    return {
      data: {
        id: updatedCategory.id,
        title: translation?.title || "",
        slug: translation?.slug || "",
        parentId: updatedCategory.parentId,
        requiresSizes: updatedCategory.requiresSizes || false,
      },
    };
  }

  /**
   * Helper function to check if a category is a descendant of another category
   */
  private async isCategoryDescendant(ancestorId: string, descendantId: string, visited: Set<string> = new Set()): Promise<boolean> {
    if (visited.has(descendantId)) {
      // Circular reference detected
      return false;
    }
    visited.add(descendantId);

    const category = await db.category.findUnique({
      where: { id: descendantId },
      include: {
        parent: true,
      },
    });

    if (!category || !category.parent) {
      return false;
    }

    if (category.parent.id === ancestorId) {
      return true;
    }

    return this.isCategoryDescendant(ancestorId, category.parent.id, visited);
  }

  /**
   * Get brands for admin
   */
  async getBrands() {
    const brands = await db.brand.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        translations: {
          where: { locale: "en" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: brands.map((brand: { id: string; slug: string; translations?: Array<{ name: string }> }) => {
        const translations = Array.isArray(brand.translations) ? brand.translations : [];
        const translation = translations[0] || null;
        return {
          id: brand.id,
          name: translation?.name || "",
          slug: brand.slug,
        };
      }),
    };
  }

  /**
   * Create brand
   */
  async createBrand(data: {
    name: string;
    locale?: string;
    logoUrl?: string;
  }) {
    const locale = data.locale || "en";
    
    // Generate base slug from name
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Generate unique slug by appending number if needed
    let slug = baseSlug;
    let counter = 1;
    let existing = await db.brand.findUnique({
      where: { slug },
    });

    while (existing) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      existing = await db.brand.findUnique({
        where: { slug },
      });
      
      // Safety check to prevent infinite loop
      if (counter > 1000) {
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Unable to generate unique slug",
          detail: "Could not generate a unique slug for the brand after many attempts",
        };
      }
    }

    const brand = await db.brand.create({
      data: {
        slug,
        logoUrl: data.logoUrl || undefined,
        published: true,
        translations: {
          create: {
            locale,
            name: data.name,
          },
        },
      },
      include: {
        translations: true,
      },
    });

    // Безопасное получение translation с проверкой на существование массива
    const brandTranslations = Array.isArray(brand.translations) ? brand.translations : [];
    const translation = brandTranslations.find((t: { locale: string }) => t.locale === locale) || brandTranslations[0] || null;

    return {
      data: {
        id: brand.id,
        name: translation?.name || "",
        slug: brand.slug,
      },
    };
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string) {
    console.log('🗑️ [ADMIN SERVICE] deleteCategory called:', categoryId);
    
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!category) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Category not found",
        detail: `Category with id '${categoryId}' does not exist`,
      };
    }

    // Check if category has children
    const childrenCount = category.children ? category.children.length : 0;
    if (childrenCount > 0) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Cannot delete category",
        detail: `This category has ${childrenCount} child categor${childrenCount > 1 ? 'ies' : 'y'}. Please delete or move child categories first.`,
        childrenCount,
      };
    }

    // Check if category has products (using count for better performance)
    const productsCount = await db.product.count({
      where: {
        OR: [
          { primaryCategoryId: categoryId },
          { categoryIds: { has: categoryId } },
        ],
        deletedAt: null,
      },
    });

    if (productsCount > 0) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Cannot delete category",
        detail: `This category has ${productsCount} associated product${productsCount > 1 ? 's' : ''}. Please remove products from this category first.`,
        productsCount,
      };
    }

    await db.category.update({
      where: { id: categoryId },
      data: {
        deletedAt: new Date(),
        published: false,
      },
    });

    console.log('✅ [ADMIN SERVICE] Category deleted:', categoryId);
    return { success: true };
  }

  /**
   * Update brand
   */
  async updateBrand(
    brandId: string,
    data: {
      name?: string;
      locale?: string;
      logoUrl?: string;
    }
  ) {
    console.log('🔄 [ADMIN SERVICE] updateBrand called:', brandId, data);
    
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: {
        translations: true,
      },
    });

    if (!brand) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Brand not found",
        detail: `Brand with id '${brandId}' does not exist`,
      };
    }

    const locale = data.locale || "en";
    const updateData: any = {};

    // Update logo URL if provided
    if (data.logoUrl !== undefined) {
      updateData.logoUrl = data.logoUrl || null;
    }

    // Update translation if name is provided
    if (data.name !== undefined) {
      const brandTranslations = Array.isArray(brand.translations) ? brand.translations : [];
      const existingTranslation = brandTranslations.find(
        (t: { locale: string }) => t.locale === locale
      );

      if (existingTranslation) {
        // Update existing translation
        await db.brandTranslation.update({
          where: { id: existingTranslation.id },
          data: { name: data.name },
        });
      } else {
        // Create new translation
        await db.brandTranslation.create({
          data: {
            brandId: brand.id,
            locale,
            name: data.name,
          },
        });
      }
    }

    // Update brand base data if needed
    if (Object.keys(updateData).length > 0) {
      await db.brand.update({
        where: { id: brandId },
        data: updateData,
      });
    }

    // Fetch updated brand with translations
    const updatedBrand = await db.brand.findUnique({
      where: { id: brandId },
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
      },
    });

    const brandTranslations = Array.isArray(updatedBrand?.translations)
      ? updatedBrand?.translations ?? []
      : [];
    const translation = brandTranslations[0] || null;

    return {
      data: {
        id: updatedBrand!.id,
        name: translation?.name || "",
        slug: updatedBrand!.slug,
      },
    };
  }

  /**
   * Delete brand (soft delete)
   */
  async deleteBrand(brandId: string) {
    console.log('🗑️ [ADMIN SERVICE] deleteBrand called:', brandId);
    
    const brand = await db.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Brand not found",
        detail: `Brand with id '${brandId}' does not exist`,
      };
    }

    // Check if brand has products (using count for better performance)
    const productsCount = await db.product.count({
      where: {
        brandId: brandId,
        deletedAt: null,
      },
    });

    if (productsCount > 0) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Cannot delete brand",
        detail: `This brand has ${productsCount} associated product${productsCount > 1 ? 's' : ''}. Please remove or change brand for these products first.`,
        productsCount,
      };
    }

    await db.brand.update({
      where: { id: brandId },
      data: {
        deletedAt: new Date(),
        published: false,
      },
    });

    console.log('✅ [ADMIN SERVICE] Brand deleted:', brandId);
    return { success: true };
  }

  /**
   * Get attributes for admin
   */
  async getAttributes() {
    // Ensure colors and imageUrl columns exist (runtime migration)
    try {
      await this.ensureColorsColumnsExist();
    } catch (migrationError: any) {
      console.warn('⚠️ [ADMIN SERVICE] Migration check failed:', migrationError.message);
      // Continue anyway - might already exist
    }

    let attributes;
    try {
      attributes = await db.attribute.findMany({
        include: {
          translations: {
            where: { locale: "en" },
            take: 1,
          },
          values: {
            include: {
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      });
    } catch (error: any) {
      // If attribute_values.colors column doesn't exist, fetch without it
      if (error?.code === 'P2022' || error?.message?.includes('attribute_values.colors') || error?.message?.includes('does not exist')) {
        console.warn('⚠️ [ADMIN SERVICE] attribute_values.colors column not found, fetching without it:', error.message);
        // Fetch attributes first
        const attributesList = await db.attribute.findMany({
          include: {
            translations: {
              where: { locale: "en" },
              take: 1,
            },
          },
          orderBy: {
            position: "asc",
          },
        });

        // Fetch values separately without colors and imageUrl using Prisma
        // Try with select first, if it fails (because Prisma tries to select colors), use raw query
        let allValues: any[];
        try {
          allValues = await db.attributeValue.findMany({
            select: {
              id: true,
              attributeId: true,
              value: true,
              position: true,
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: {
              position: "asc",
            },
          });
        } catch (selectError: any) {
          // If select also fails, use raw query with correct column name
          // Try with quoted name first, then without quotes
          console.warn('⚠️ [ADMIN SERVICE] Using raw query for attribute values:', selectError.message);
          try {
            allValues = await db.$queryRaw`
              SELECT 
                av.id,
                av."attributeId",
                av.value,
                av.position
              FROM attribute_values av
              ORDER BY av.position ASC
            ` as any[];
          } catch (rawError: any) {
            // If quoted name doesn't work, try without quotes (snake_case)
            console.warn('⚠️ [ADMIN SERVICE] Trying with snake_case column name:', rawError.message);
            allValues = await db.$queryRaw`
              SELECT 
                av.id,
                av.attribute_id as "attributeId",
                av.value,
                av.position
              FROM attribute_values av
              ORDER BY av.position ASC
            ` as any[];
          }
          
          // Fetch translations separately
          const valueIds = allValues.map((v: any) => v.id);
          const valueTranslations = valueIds.length > 0 
            ? await db.attributeValueTranslation.findMany({
                where: {
                  attributeValueId: { in: valueIds },
                  locale: "en",
                },
              })
            : [];
          
          // Add translations to values
          allValues = allValues.map((val: any) => ({
            ...val,
            translations: valueTranslations.filter((t: any) => t.attributeValueId === val.id),
          }));
        }

        // Combine attributes with their values
        attributes = attributesList.map((attr: any) => {
          const attrValues = allValues
            .filter((val: any) => val.attributeId === attr.id)
            .map((val: any) => {
              return {
                id: val.id,
                attributeId: val.attributeId,
                value: val.value,
                position: val.position,
                colors: null, // Add null for compatibility
                imageUrl: null, // Add null for compatibility
                translations: Array.isArray(val.translations) ? val.translations : [],
              };
            });
          
          return {
            ...attr,
            values: attrValues,
          };
        });
      } else {
        throw error;
      }
    }

    return {
      data: attributes.map((attribute: { id: string; key: string; type: string; filterable: boolean; translations?: Array<{ name: string }>; values?: Array<{ id: string; value: string; translations?: Array<{ label: string }>; colors?: any; imageUrl?: string | null }> }) => {
        const translations = Array.isArray(attribute.translations) ? attribute.translations : [];
        const translation = translations[0] || null;
        const values = Array.isArray(attribute.values) ? attribute.values : [];
        return {
          id: attribute.id,
          key: attribute.key,
          name: translation?.name || attribute.key,
          type: attribute.type,
          filterable: attribute.filterable,
          values: values.map((value: any) => {
            const valueTranslations = Array.isArray(value.translations) ? value.translations : [];
            const valueTranslation = valueTranslations[0] || null;
            const colorsData = value.colors;
            let colorsArray: string[] = [];
            
            if (colorsData) {
              if (Array.isArray(colorsData)) {
                colorsArray = colorsData;
              } else if (typeof colorsData === 'string') {
                try {
                  colorsArray = JSON.parse(colorsData);
                } catch (e) {
                  console.warn('⚠️ [ADMIN SERVICE] Failed to parse colors JSON:', e);
                  colorsArray = [];
                }
              } else if (typeof colorsData === 'object') {
                // If it's already an object (from Prisma JSONB), use it directly
                colorsArray = Array.isArray(colorsData) ? colorsData : [];
              }
            }
            
            // Ensure colorsArray is always an array of strings
            if (!Array.isArray(colorsArray)) {
              colorsArray = [];
            }
            
            console.log('🎨 [ADMIN SERVICE] Parsed colors for value:', {
              valueId: value.id,
              valueLabel: valueTranslation?.label || value.value,
              colorsData,
              colorsDataType: typeof colorsData,
              colorsArray,
              colorsArrayLength: colorsArray.length
            });
            
            return {
              id: value.id,
              value: value.value,
              label: valueTranslation?.label || value.value,
              colors: colorsArray,
              imageUrl: value.imageUrl || null,
            };
          }),
        };
      }),
    };
  }

  /**
   * Create attribute
   */
  async createAttribute(data: {
    name: string;
    key: string;
    type?: string;
    filterable?: boolean;
    locale?: string;
  }) {
    console.log('🆕 [ADMIN SERVICE] Creating attribute:', data.key);

    // Check if attribute with this key already exists
    const existing = await db.attribute.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Attribute already exists",
        detail: `Attribute with key '${data.key}' already exists`,
      };
    }

    const attribute = await db.attribute.create({
      data: {
        key: data.key,
        type: data.type || "select",
        filterable: data.filterable !== false,
        translations: {
          create: {
            locale: data.locale || "en",
            name: data.name,
          },
        },
      },
      include: {
        translations: {
          where: { locale: data.locale || "en" },
        },
        values: {
          include: {
            translations: {
              where: { locale: data.locale || "en" },
            },
          },
        },
      },
    });

    const translation = attribute.translations[0];
    const values = attribute.values || [];

    return {
      id: attribute.id,
      key: attribute.key,
      name: translation?.name || attribute.key,
      type: attribute.type,
      filterable: attribute.filterable,
      values: values.map((val: any) => {
        const valTranslation = val.translations?.[0];
        return {
          id: val.id,
          value: val.value,
          label: valTranslation?.label || val.value,
        };
      }),
    };
  }

  /**
   * Update attribute translation (name)
   */
  async updateAttributeTranslation(
    attributeId: string,
    data: {
      name: string;
      locale?: string;
    }
  ) {
    console.log('✏️ [ADMIN SERVICE] Updating attribute translation:', { attributeId, name: data.name });

    const attribute = await db.attribute.findUnique({
      where: { id: attributeId },
      include: {
        translations: {
          where: { locale: data.locale || "en" },
        },
      },
    });

    if (!attribute) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Attribute not found",
        detail: `Attribute with id '${attributeId}' does not exist`,
      };
    }

    const locale = data.locale || "en";

    // Use upsert to handle both create and update cases
    await db.attributeTranslation.upsert({
      where: {
        attributeId_locale: {
          attributeId,
          locale,
        },
      },
      update: {
        name: data.name.trim(),
      },
      create: {
        attributeId,
        locale,
        name: data.name.trim(),
      },
    });

    // Return updated attribute with all values
    const updatedAttribute = await db.attribute.findUnique({
      where: { id: attributeId },
      include: {
        translations: {
          where: { locale },
        },
        values: {
          include: {
            translations: {
              where: { locale },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!updatedAttribute) {
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to retrieve updated attribute",
      };
    }

    const translation = updatedAttribute.translations[0];
    const values = updatedAttribute.values || [];

    return {
      id: updatedAttribute.id,
      key: updatedAttribute.key,
      name: translation?.name || updatedAttribute.key,
      type: updatedAttribute.type,
      filterable: updatedAttribute.filterable,
      values: values.map((val: any) => {
        const valTranslation = val.translations?.[0];
        return {
          id: val.id,
          value: val.value,
          label: valTranslation?.label || val.value,
          colors: Array.isArray(val.colors) ? val.colors : (val.colors ? JSON.parse(val.colors as string) : []),
          imageUrl: val.imageUrl || null,
        };
      }),
    };
  }

  /**
   * Add attribute value
   */
  async addAttributeValue(attributeId: string, data: { label: string; locale?: string }) {
    console.log('➕ [ADMIN SERVICE] Adding attribute value:', { attributeId, label: data.label });

    const attribute = await db.attribute.findUnique({
      where: { id: attributeId },
    });

    if (!attribute) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Attribute not found",
        detail: `Attribute with id '${attributeId}' does not exist`,
      };
    }

    // Use label as value (normalized)
    const value = data.label.trim().toLowerCase().replace(/\s+/g, '-');

    // Check if value already exists
    const existing = await db.attributeValue.findFirst({
      where: {
        attributeId,
        value,
      },
    });

    if (existing) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Value already exists",
        detail: `Value '${data.label}' already exists for this attribute`,
      };
    }

    const attributeValue = await db.attributeValue.create({
      data: {
        attributeId,
        value,
        translations: {
          create: {
            locale: data.locale || "en",
            label: data.label.trim(),
          },
        },
      },
    });

    // Return updated attribute with all values
    const updatedAttribute = await db.attribute.findUnique({
      where: { id: attributeId },
      include: {
        translations: {
          where: { locale: data.locale || "en" },
        },
        values: {
          include: {
            translations: {
              where: { locale: data.locale || "en" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!updatedAttribute) {
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to retrieve updated attribute",
      };
    }

    const translation = updatedAttribute.translations[0];
    const values = updatedAttribute.values || [];

    return {
      id: updatedAttribute.id,
      key: updatedAttribute.key,
      name: translation?.name || updatedAttribute.key,
      type: updatedAttribute.type,
      filterable: updatedAttribute.filterable,
      values: values.map((val: any) => {
        const valTranslation = val.translations?.[0];
        return {
          id: val.id,
          value: val.value,
          label: valTranslation?.label || val.value,
          colors: Array.isArray(val.colors) ? val.colors : (val.colors ? JSON.parse(val.colors as string) : []),
          imageUrl: val.imageUrl || null,
        };
      }),
    };
  }

  /**
   * Update attribute value
   */
  async updateAttributeValue(
    attributeId: string,
    valueId: string,
    data: {
      label?: string;
      colors?: string[];
      imageUrl?: string | null;
      locale?: string;
    }
  ) {
    console.log('✏️ [ADMIN SERVICE] Updating attribute value:', { attributeId, valueId, data });

    // Ensure colors and imageUrl columns exist (runtime migration)
    try {
      await this.ensureColorsColumnsExist();
    } catch (migrationError: any) {
      console.warn('⚠️ [ADMIN SERVICE] Migration check failed:', migrationError.message);
      // Continue anyway - might already exist
    }

    const attributeValue = await db.attributeValue.findUnique({
      where: { id: valueId },
      include: {
        attribute: true,
        translations: true,
      },
    });

    if (!attributeValue) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Attribute value not found",
        detail: `Attribute value with id '${valueId}' does not exist`,
      };
    }

    if (attributeValue.attributeId !== attributeId) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Attribute value does not belong to the specified attribute",
      };
    }

    const locale = data.locale || "en";
    const updateData: any = {};

    // Update colors if provided
    if (data.colors !== undefined) {
      // Ensure colors is always an array (even if empty)
      // Prisma JSONB field expects an array format
      updateData.colors = Array.isArray(data.colors) ? data.colors : [];
      console.log('🎨 [ADMIN SERVICE] Setting colors:', { 
        valueId, 
        colors: updateData.colors, 
        colorsType: typeof updateData.colors,
        isArray: Array.isArray(updateData.colors)
      });
    }

    // Update imageUrl if provided
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl || null;
    }

    // Update translation label if provided
    if (data.label !== undefined) {
      const existingTranslation = attributeValue.translations.find(
        (t: any) => t.locale === locale
      );

      if (existingTranslation) {
        await db.attributeValueTranslation.update({
          where: { id: existingTranslation.id },
          data: { label: data.label.trim() },
        });
      } else {
        await db.attributeValueTranslation.create({
          data: {
            attributeValueId: valueId,
            locale,
            label: data.label.trim(),
          },
        });
      }
    }

    // Update attribute value if colors or imageUrl changed
    if (Object.keys(updateData).length > 0) {
      console.log('💾 [ADMIN SERVICE] Updating attribute value in database:', { 
        valueId, 
        updateData,
        updateDataKeys: Object.keys(updateData)
      });
      const updatedValue = await db.attributeValue.update({
        where: { id: valueId },
        data: updateData,
      });
      console.log('✅ [ADMIN SERVICE] Attribute value updated:', { 
        valueId, 
        savedColors: updatedValue.colors,
        savedColorsType: typeof updatedValue.colors
      });
    }

    // Return updated attribute with all values
    const updatedAttribute = await db.attribute.findUnique({
      where: { id: attributeId },
      include: {
        translations: {
          where: { locale },
        },
        values: {
          include: {
            translations: {
              where: { locale },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!updatedAttribute) {
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to retrieve updated attribute",
      };
    }

    const translation = updatedAttribute.translations[0];
    const values = updatedAttribute.values || [];

    return {
      id: updatedAttribute.id,
      key: updatedAttribute.key,
      name: translation?.name || updatedAttribute.key,
      type: updatedAttribute.type,
      filterable: updatedAttribute.filterable,
      values: values.map((val: any) => {
        const valTranslation = val.translations?.[0];
        const colorsData = val.colors;
        let colorsArray: string[] = [];
        
        if (colorsData) {
          if (Array.isArray(colorsData)) {
            colorsArray = colorsData;
          } else if (typeof colorsData === 'string') {
            try {
              colorsArray = JSON.parse(colorsData);
            } catch (e) {
              console.warn('⚠️ [ADMIN SERVICE] Failed to parse colors JSON in updateAttributeValue:', e);
              colorsArray = [];
            }
          } else if (typeof colorsData === 'object') {
            colorsArray = Array.isArray(colorsData) ? colorsData : [];
          }
        }
        
        // Ensure colorsArray is always an array of strings
        if (!Array.isArray(colorsArray)) {
          colorsArray = [];
        }
        
        return {
          id: val.id,
          value: val.value,
          label: valTranslation?.label || val.value,
          colors: colorsArray,
          imageUrl: val.imageUrl || null,
        };
      }),
    };
  }

  /**
   * Delete attribute
   */
  async deleteAttribute(attributeId: string) {
    try {
      console.log('🗑️ [ADMIN SERVICE] Սկսվում է attribute-ի հեռացում:', {
        attributeId,
        timestamp: new Date().toISOString(),
      });

      // Ստուգում ենք, արդյոք attribute-ը գոյություն ունի
      console.log('🔍 [ADMIN SERVICE] Ստուգվում է attribute-ի գոյությունը...');
      const attribute = await db.attribute.findUnique({
        where: { id: attributeId },
        select: {
          id: true,
          key: true,
        },
      });

      if (!attribute) {
        console.log('❌ [ADMIN SERVICE] Attribute-ը չի գտնվել:', attributeId);
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute not found",
          detail: `Attribute with id '${attributeId}' does not exist`,
        };
      }

      console.log('✅ [ADMIN SERVICE] Attribute-ը գտնվել է:', {
        id: attribute.id,
        key: attribute.key,
      });

      // Ստուգում ենք, արդյոք attribute-ը օգտագործվում է ակտիվ արտադրանքներում
      // Հաշվի ենք առնում միայն չջնջված (deletedAt IS NULL) ապրանքները
      console.log('🔍 [ADMIN SERVICE] Ստուգվում է, արդյոք attribute-ը օգտագործվում է ակտիվ արտադրանքներում...');
      
      let productAttributesCount = 0;
      
      // Ստուգում ենք, արդյոք db.productAttribute գոյություն ունի
      if (db.productAttribute) {
        try {
          // Հաշվում ենք միայն ակտիվ (չջնջված) ապրանքների հետ կապված productAttributes
          productAttributesCount = await db.productAttribute.count({
            where: { 
              attributeId,
              product: {
                deletedAt: null, // Միայն չջնջված ապրանքներ
              },
            },
          });
          console.log('📊 [ADMIN SERVICE] Active product attributes count (not deleted):', productAttributesCount);
        } catch (countError: any) {
          console.error('❌ [ADMIN SERVICE] Product attributes count սխալ:', {
            error: countError,
            message: countError?.message,
            code: countError?.code,
          });
          // Եթե count-ը չի աշխատում, փորձում ենք findMany-ով
          try {
            const productAttributes = await db.productAttribute.findMany({
              where: { 
                attributeId,
                product: {
                  deletedAt: null, // Միայն չջնջված ապրանքներ
                },
              },
              select: { 
                id: true,
                productId: true,
              },
            });
            productAttributesCount = productAttributes.length;
            console.log('📊 [ADMIN SERVICE] Active product attributes count (via findMany, not deleted):', productAttributesCount);
            
            // Լոգավորում ենք, թե որ ապրանքներում է օգտագործվում
            if (productAttributesCount > 0) {
              const productIds = productAttributes.map(pa => pa.productId);
              console.log('📋 [ADMIN SERVICE] Attribute-ը օգտագործվում է այս ակտիվ ապրանքներում:', productIds);
            }
          } catch (findError: any) {
            console.warn('⚠️ [ADMIN SERVICE] Product attributes findMany-ը նույնպես չի աշխատում, skip անում ենք ստուգումը');
            productAttributesCount = 0;
          }
        }
      } else {
        console.warn('⚠️ [ADMIN SERVICE] db.productAttribute-ը undefined է, skip անում ենք product attributes ստուգումը');
      }

      if (productAttributesCount > 0) {
        console.log('⚠️ [ADMIN SERVICE] Attribute-ը օգտագործվում է ակտիվ արտադրանքներում:', productAttributesCount);
        
        // Լրացուցիչ տեղեկություն ստուգման համար
        try {
          const allProductAttributes = await db.productAttribute.findMany({
            where: { attributeId },
            include: {
              product: {
                select: {
                  id: true,
                  deletedAt: true,
                  published: true,
                },
              },
            },
          });
          
          const activeProducts = allProductAttributes.filter(pa => pa.product.deletedAt === null);
          const deletedProducts = allProductAttributes.filter(pa => pa.product.deletedAt !== null);
          
          console.log('📊 [ADMIN SERVICE] Մանրամասն վիճակագրություն:', {
            total: allProductAttributes.length,
            active: activeProducts.length,
            deleted: deletedProducts.length,
            activeProductIds: activeProducts.map(pa => pa.productId),
            deletedProductIds: deletedProducts.map(pa => pa.productId),
          });
        } catch (debugError: any) {
          console.warn('⚠️ [ADMIN SERVICE] Չհաջողվեց ստանալ մանրամասն տեղեկություն:', debugError?.message);
        }
        
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cannot delete attribute",
          detail: `Attribute is used in ${productAttributesCount} active product(s). Please remove it from products first.`,
        };
      }

      // Ստուգում ենք, արդյոք attribute values-ները օգտագործվում են variants-ներում
      console.log('🔍 [ADMIN SERVICE] Ստուգվում է, արդյոք attribute values-ները օգտագործվում են variants-ներում...');
      const attributeValues = await db.attributeValue.findMany({
        where: { attributeId },
        select: { id: true },
      });

      console.log('📊 [ADMIN SERVICE] Attribute values count:', attributeValues.length);

      if (attributeValues.length > 0) {
        const valueIds = attributeValues.map((v: { id: string }) => v.id);
        console.log('🔍 [ADMIN SERVICE] Ստուգվում է variant options (միայն ակտիվ ապրանքների)...');
        
        let variantOptionsCount = 0;
        try {
          // Հաշվում ենք միայն ակտիվ (չջնջված) ապրանքների variant options-ները
          variantOptionsCount = await db.productVariantOption.count({
            where: {
              valueId: { in: valueIds },
              variant: {
                product: {
                  deletedAt: null, // Միայն չջնջված ապրանքներ
                },
              },
            },
          });
          console.log('📊 [ADMIN SERVICE] Active variant options count (not deleted products):', variantOptionsCount);
        } catch (countError: any) {
          console.error('❌ [ADMIN SERVICE] Variant options count սխալ:', {
            error: countError,
            message: countError?.message,
            code: countError?.code,
          });
          // Եթե count-ը չի աշխատում, փորձում ենք findMany-ով
          try {
            const variantOptions = await db.productVariantOption.findMany({
              where: {
                valueId: { in: valueIds },
                variant: {
                  product: {
                    deletedAt: null, // Միայն չջնջված ապրանքներ
                  },
                },
              },
              select: { 
                id: true,
                variantId: true,
              },
            });
            variantOptionsCount = variantOptions.length;
            console.log('📊 [ADMIN SERVICE] Active variant options count (via findMany, not deleted products):', variantOptionsCount);
            
            // Լոգավորում ենք, թե որ variant-ներում է օգտագործվում
            if (variantOptionsCount > 0) {
              const variantIds = variantOptions.map(vo => vo.variantId);
              console.log('📋 [ADMIN SERVICE] Attribute values-ները օգտագործվում են այս ակտիվ variant-ներում:', variantIds);
            }
          } catch (findError: any) {
            console.warn('⚠️ [ADMIN SERVICE] Variant options findMany-ը նույնպես չի աշխատում, skip անում ենք ստուգումը');
            variantOptionsCount = 0;
          }
        }

        if (variantOptionsCount > 0) {
          console.log('⚠️ [ADMIN SERVICE] Attribute values-ները օգտագործվում են variants-ներում:', variantOptionsCount);
          throw {
            status: 400,
            type: "https://api.shop.am/problems/validation-error",
            title: "Cannot delete attribute",
            detail: `Some attribute values are used in ${variantOptionsCount} variant(s). Please remove them from variants first.`,
          };
        }
      }

      // Հեռացնում ենք attribute-ը (values-ները կհեռացվեն cascade-ով)
      console.log('🗑️ [ADMIN SERVICE] Հեռացվում է attribute-ը...');
      await db.attribute.delete({
        where: { id: attributeId },
      });

      console.log('✅ [ADMIN SERVICE] Attribute-ը հաջողությամբ հեռացվել է:', {
        attributeId,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true };
    } catch (error: any) {
      // Եթե սա մեր ստեղծած սխալ է, ապա վերադարձնում ենք այն
      if (error.status && error.type) {
        console.error('❌ [ADMIN SERVICE] Ստանդարտ սխալ:', {
          status: error.status,
          type: error.type,
          title: error.title,
          detail: error.detail,
        });
        throw error;
      }

      // Մանրամասն լոգավորում
      console.error('❌ [ADMIN SERVICE] Attribute հեռացման սխալ:', {
        attributeId,
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack?.substring(0, 1000),
        },
        timestamp: new Date().toISOString(),
      });

      // Prisma սխալների մշակում
      if (error?.code === 'P2025') {
        console.log('⚠️ [ADMIN SERVICE] Prisma P2025: Գրառումը չի գտնվել');
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute not found",
          detail: `Attribute with id '${attributeId}' does not exist`,
        };
      }

      // Գեներիկ սխալ
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error?.message || "Failed to delete attribute",
      };
    }
  }

  /**
   * Delete attribute value
   */
  async deleteAttributeValue(attributeValueId: string) {
    try {
      console.log('🗑️ [ADMIN SERVICE] Deleting attribute value:', attributeValueId);

      // First check if attribute value exists
      const attributeValue = await db.attributeValue.findUnique({
        where: { id: attributeValueId },
        select: {
          id: true,
          attributeId: true,
        },
      });

      if (!attributeValue) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute value not found",
          detail: `Attribute value with id '${attributeValueId}' does not exist`,
        };
      }

      // Check if value is used in any variants
      const variantOptionsCount = await db.productVariantOption.count({
        where: {
          valueId: attributeValueId,
        },
      });

      if (variantOptionsCount > 0) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cannot delete attribute value",
          detail: `Attribute value is used in ${variantOptionsCount} variant(s). Please remove it from variants first.`,
        };
      }

      // Delete attribute value
      await db.attributeValue.delete({
        where: { id: attributeValueId },
      });

      // Return updated attribute
      const attribute = await db.attribute.findUnique({
        where: { id: attributeValue.attributeId },
        include: {
          translations: {
            where: { locale: "en" },
            take: 1,
          },
          values: {
            include: {
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!attribute) {
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Internal Server Error",
          detail: "Failed to retrieve updated attribute",
        };
      }

      const translation = attribute.translations[0];
      const values = attribute.values || [];

      return {
        id: attribute.id,
        key: attribute.key,
        name: translation?.name || attribute.key,
        type: attribute.type,
        filterable: attribute.filterable,
        values: values.map((val: any) => {
          const valTranslation = val.translations?.[0];
          return {
            id: val.id,
            value: val.value,
            label: valTranslation?.label || val.value,
          };
        }),
      };
    } catch (error: any) {
      console.error('❌ [ADMIN SERVICE] Error deleting attribute value:', error);
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error.message || "Failed to delete attribute value",
      };
    }
  }

  /**
   * Get recent activity for dashboard
   */
  async getActivity(limit: number = 10) {
    const activities: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: string;
    }> = [];

    // Get recent orders
    const recentOrders = await db.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    recentOrders.forEach((order: { number: string; items: Array<unknown>; total: number; currency: string | null; createdAt: Date }) => {
      activities.push({
        type: "order",
        title: `New Order #${order.number}`,
        description: `${order.items.length} items • ${order.total} ${order.currency}`,
        timestamp: order.createdAt.toISOString(),
      });
    });

    // Get recent user registrations
    const recentUsers = await db.user.findMany({
      take: Math.floor(limit / 2),
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    recentUsers.forEach((user: { firstName: string | null; lastName: string | null; email: string | null; phone: string | null; createdAt: Date }) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.phone || "New User";
      activities.push({
        type: "user",
        title: "New User Registration",
        description: name,
        timestamp: user.createdAt.toISOString(),
      });
    });

    // Sort by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period: string = 'week', startDate?: string, endDate?: string) {
    // Calculate date range based on period
    let start: Date;
    let end: Date = new Date();
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case 'day':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date();
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
        }
        break;
      default:
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
    }

    // Get orders in date range
    const orders = await db.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    translations: {
                      where: { locale: 'en' },
                      take: 1,
                    },
                    categories: {
                      include: {
                        translations: {
                          where: { locale: 'en' },
                          take: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate order statistics
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: { paymentStatus: string }) => o.paymentStatus === 'paid').length;
    const pendingOrders = orders.filter((o: { status: string }) => o.status === 'pending').length;
    const completedOrders = orders.filter((o: { status: string }) => o.status === 'completed').length;
    const totalRevenue = orders
      .filter((o: { paymentStatus: string }) => o.paymentStatus === 'paid')
      .reduce((sum: number, o: { total: number }) => sum + o.total, 0);

    // Calculate top products
    const productMap = new Map<string, {
      variantId: string;
      productId: string;
      title: string;
      sku: string;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
      image?: string | null;
    }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.variantId) {
          const key = item.variantId;
          const existing = productMap.get(key) || {
            variantId: item.variantId,
            productId: item.variant?.product?.id || '',
            title: item.productTitle || 'Unknown Product',
            sku: item.sku || 'N/A',
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            image: null,
          };
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.total;
          existing.orderCount += 1;
          productMap.set(key, existing);
        }
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Calculate top categories
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
    }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.variant?.product) {
          item.variant.product.categories.forEach((category: { id: string; translations?: Array<{ title: string }> }) => {
            const categoryId = category.id;
            const translations = category.translations || [];
            const categoryName = translations[0]?.title || category.id;
            const existing = categoryMap.get(categoryId) || {
              categoryId,
              categoryName,
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            };
            existing.totalQuantity += item.quantity;
            existing.totalRevenue += item.total;
            existing.orderCount += 1;
            categoryMap.set(categoryId, existing);
          });
        }
      });
    });

    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Calculate orders by day
    const ordersByDayMap = new Map<string, { count: number; revenue: number }>();

    orders.forEach((order: { createdAt: Date; paymentStatus: string; total: number }) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const existing = ordersByDayMap.get(dateKey) || { count: 0, revenue: 0 };
      existing.count += 1;
      if (order.paymentStatus === 'paid') {
        existing.revenue += order.total;
      }
      ordersByDayMap.set(dateKey, existing);
    });

    const ordersByDay = Array.from(ordersByDayMap.entries())
      .map(([date, data]) => ({
        _id: date,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    return {
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      orders: {
        totalOrders,
        totalRevenue,
        paidOrders,
        pendingOrders,
        completedOrders,
      },
      topProducts,
      topCategories,
      ordersByDay,
    };
  }

  /**
   * Get delivery settings (regions + optional schedule)
   */
  async getDeliverySettings() {
    console.log('🚚 [ADMIN SERVICE] getDeliverySettings called');

    const setting = await db.settings.findUnique({
      where: { key: 'delivery-locations' },
    });

    if (!setting) {
      console.log('✅ [ADMIN SERVICE] Delivery settings not found, returning defaults');
      return {
        regions: [],
        schedule: {
          enabledWeekdays: [2, 4],
        },
        timeSlots: [
          { id: 'first_half', label: { en: 'Morning (9:00 - 13:00)', hy: 'Առավոտյան (9:00 - 13:00)', ru: 'Утро (9:00 - 13:00)' }, enabled: true },
          { id: 'second_half', label: { en: 'Afternoon (13:00 - 18:00)', hy: 'Երեկոյան (13:00 - 18:00)', ru: 'День (13:00 - 18:00)' }, enabled: true },
        ],
      };
    }

    const value = setting.value as {
      regions?: Array<{ id: string; name: string; price: number }>;
      locations?: Array<{ id?: string; country: string; city: string; price: number }>;
      schedule?: { enabledWeekdays?: number[] };
      timeSlots?: Array<{ id: string; label: { en: string; hy: string; ru: string }; enabled: boolean }>;
    };

    const enabledWeekdays =
      Array.isArray(value.schedule?.enabledWeekdays) && (value.schedule?.enabledWeekdays?.length ?? 0) > 0
        ? value.schedule?.enabledWeekdays
        : [2, 4];

    const timeSlots = Array.isArray(value.timeSlots) && value.timeSlots.length > 0
      ? value.timeSlots
      : [
          { id: 'first_half', label: { en: 'Morning (9:00 - 13:00)', hy: 'Առավոտյան (9:00 - 13:00)', ru: 'Утро (9:00 - 13:00)' }, enabled: true },
          { id: 'second_half', label: { en: 'Afternoon (13:00 - 18:00)', hy: 'Երեկոյան (13:00 - 18:00)', ru: 'День (13:00 - 18:00)' }, enabled: true },
        ];

    let regions = value.regions || [];
    if (regions.length === 0 && Array.isArray(value.locations) && value.locations.length > 0) {
      regions = value.locations.map((loc, i) => ({
        id: loc.id || `region-${Date.now()}-${i}`,
        name: loc.city || '',
        price: loc.price ?? 0,
      }));
    }

    console.log('✅ [ADMIN SERVICE] Delivery settings loaded:', { regionsCount: regions.length });
    return {
      regions,
      schedule: { enabledWeekdays },
      timeSlots,
    };
  }

  /**
   * Get delivery regions for public (checkout dropdown). Returns id, name, price.
   */
  async getDeliveryRegions(): Promise<Array<{ id: string; name: string; price: number }>> {
    const settings = await this.getDeliverySettings();
    return settings.regions || [];
  }

  /**
   * Get delivery price for a region by id
   */
  async getDeliveryPriceByRegionId(regionId: string): Promise<number | null> {
    console.log('🚚 [ADMIN SERVICE] getDeliveryPriceByRegionId called:', regionId);

    const setting = await db.settings.findUnique({
      where: { key: 'delivery-locations' },
    });

    if (!setting) {
      console.log('⚠️ [ADMIN SERVICE] Delivery settings not found, returning null');
      return null;
    }

    const value = setting.value as {
      regions?: Array<{ id: string; name: string; price: number }>;
      locations?: Array<{ id?: string; city: string; price: number }>;
    };
    const regions = value.regions || [];
    if (regions.length === 0 && Array.isArray(value.locations)) {
      const loc = value.locations.find((l) => l.id === regionId);
      if (loc) return loc.price;
      return null;
    }

    const region = regions.find((r) => r.id === regionId);
    if (region) {
      console.log('✅ [ADMIN SERVICE] Delivery price found:', region.price);
      return region.price;
    }
    console.log('⚠️ [ADMIN SERVICE] No delivery price found for regionId:', regionId);
    return null;
  }

  /**
   * Get delivery price by region name (for backward compat with orders that have city/region name only)
   */
  async getDeliveryPriceByRegionName(regionName: string): Promise<number | null> {
    const regions = await this.getDeliveryRegions();
    const name = String(regionName || '').trim().toLowerCase();
    if (!name) return null;
    const region = regions.find((r) => r.name.trim().toLowerCase() === name);
    return region ? region.price : null;
  }

  /**
   * Update delivery settings (regions + optional schedule)
   */
  async updateDeliverySettings(data: {
    regions: Array<{ id?: string; name: string; price: number }>;
    schedule?: { enabledWeekdays?: number[] };
    timeSlots?: Array<{ id: string; label: { en: string; hy: string; ru: string }; enabled: boolean }>;
  }) {
    console.log('🚚 [ADMIN SERVICE] updateDeliverySettings called:', data);

    if (!Array.isArray(data.regions)) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Regions must be an array",
      };
    }

    for (const region of data.regions) {
      if (!region.name || String(region.name).trim() === '') {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Each region must have a name",
        };
      }
      if (typeof region.price !== 'number' || region.price < 0) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Price must be a non-negative number",
        };
      }
    }

    const enabledWeekdays = Array.isArray(data.schedule?.enabledWeekdays)
      ? Array.from(
          new Set(
            (data.schedule?.enabledWeekdays ?? [])
              .map((d) => Number(d))
              .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
          ),
        )
      : [2, 4];

    if (enabledWeekdays.length === 0) {
      enabledWeekdays.push(2, 4);
    }

    const timeSlots = Array.isArray(data.timeSlots) && data.timeSlots.length > 0
      ? data.timeSlots.map((slot) => ({
          id: slot.id,
          label: {
            en: slot.label?.en || '',
            hy: slot.label?.hy || '',
            ru: slot.label?.ru || '',
          },
          enabled: slot.enabled !== undefined ? slot.enabled : true,
        }))
      : [
          { id: 'first_half', label: { en: 'Morning (9:00 - 13:00)', hy: 'Առավոտյան (9:00 - 13:00)', ru: 'Утро (9:00 - 13:00)' }, enabled: true },
          { id: 'second_half', label: { en: 'Afternoon (13:00 - 18:00)', hy: 'Երեկոյան (13:00 - 18:00)', ru: 'День (13:00 - 18:00)' }, enabled: true },
        ];

    if (!timeSlots.some((slot) => slot.enabled)) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "At least one time slot must be enabled",
      };
    }

    const regionsWithIds = data.regions.map((region, index) => ({
      ...region,
      id: region.id || `region-${Date.now()}-${index}`,
    }));

    try {
      const setting = await db.settings.upsert({
        where: { key: 'delivery-locations' },
        update: {
          value: {
            regions: regionsWithIds,
            schedule: { enabledWeekdays },
            timeSlots,
          },
          updatedAt: new Date(),
        },
        create: {
          key: 'delivery-locations',
          value: {
            regions: regionsWithIds,
            schedule: { enabledWeekdays },
            timeSlots,
          },
          description: 'Delivery regions (marzer) with prices, schedule, and time slots',
        },
      });

      console.log('✅ [ADMIN SERVICE] Delivery settings updated:', setting);
      return {
        regions: regionsWithIds,
        schedule: { enabledWeekdays },
        timeSlots,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      // Check for encoding errors (WIN1251 vs UTF-8 mismatch)
      if (err?.message?.includes('encoding') || 
          err?.message?.includes('WIN1251') ||
          err?.message?.includes('UTF8') ||
          err?.code === '22P05') {
        console.error('❌ [ADMIN SERVICE] Database encoding error:', error);
        throw {
          status: 500,
          type: "https://api.shop.am/problems/database-encoding-error",
          title: "Database Encoding Error",
          detail: "The database is not configured for UTF-8 encoding. Please contact the administrator to migrate the database to UTF-8 encoding. This is required to support Armenian and other Unicode characters.",
        };
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all contact messages
   */
  async getContactMessages() {
    try {
      // Check if contactMessage model exists (in case Prisma client wasn't regenerated)
      if (!db.contactMessage) {
        console.error('❌ [ADMIN SERVICE] ContactMessage model not found. Please run: npx prisma generate');
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Database Model Not Found",
          detail: "ContactMessage model is not available. Please run 'npx prisma generate' in the packages/db directory and restart the server.",
        };
      }

      const messages = await db.contactMessage.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        // Explicitly select all fields including subject
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          message: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Debug: Log first message to verify subject is included
      if (messages.length > 0) {
        console.log('🔍 [ADMIN SERVICE] First message from DB:', {
          id: messages[0].id,
          name: messages[0].name,
          email: messages[0].email,
          subject: messages[0].subject,
          hasSubject: !!messages[0].subject,
        });
      }

      return {
        data: messages,
      };
    } catch (error: any) {
      console.error('❌ [ADMIN SERVICE] Error fetching contact messages:', error);
      
      // If it's already our custom error, re-throw it
      if (error.status && error.type) {
        throw error;
      }
      
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error.message || "Failed to fetch contact messages",
      };
    }
  }

  /**
   * Create a new contact message
   */
  async createContactMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    try {
      // Check if contactMessage model exists (in case Prisma client wasn't regenerated)
      if (!db.contactMessage) {
        console.error('❌ [ADMIN SERVICE] ContactMessage model not found. Please run: npx prisma generate');
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Database Model Not Found",
          detail: "ContactMessage model is not available. Please run 'npx prisma generate' in the packages/db directory and restart the server.",
        };
      }

      // Debug: Log data being saved
      console.log('💾 [ADMIN SERVICE] Creating contact message:', {
        name: data.name.trim(),
        email: data.email.trim(),
        subject: data.subject.trim(),
        hasSubject: !!data.subject.trim(),
        messageLength: data.message.trim().length,
      });

      const message = await db.contactMessage.create({
        data: {
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          message: data.message.trim(),
        },
      });

      // Debug: Log created message to verify subject was saved
      console.log('✅ [ADMIN SERVICE] Contact message created:', {
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject,
        hasSubject: !!message.subject,
      });

      return {
        data: message,
      };
    } catch (error: any) {
      console.error('❌ [ADMIN SERVICE] Error creating contact message:', error);
      
      // If it's already our custom error, re-throw it
      if (error.status && error.type) {
        throw error;
      }
      
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error.message || "Failed to create contact message",
      };
    }
  }

  /**
   * Delete a contact message
   */
  async deleteContactMessage(id: string) {
    try {
      // Check if contactMessage model exists (in case Prisma client wasn't regenerated)
      if (!db.contactMessage) {
        console.error('❌ [ADMIN SERVICE] ContactMessage model not found. Please run: npx prisma generate');
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Database Model Not Found",
          detail: "ContactMessage model is not available. Please run 'npx prisma generate' in the packages/db directory and restart the server.",
        };
      }

      await db.contactMessage.delete({
        where: { id },
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ [ADMIN SERVICE] Error deleting contact message:', error);
      
      // If it's already our custom error, re-throw it
      if (error.status && error.type) {
        throw error;
      }
      
      if (error.code === 'P2025') {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Not Found",
          detail: "Contact message not found",
        };
      }
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error.message || "Failed to delete contact message",
      };
    }
  }
}

export const adminService = new AdminService();

