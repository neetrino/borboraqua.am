import { db } from "@white-shop/db";

type CouponTxClient = Pick<typeof db, "coupon" | "couponAssignment" | "couponRedemption">;

export interface CheckoutCouponValidationResult {
  couponId: string;
  code: string;
  discountAmount: number;
  discountType: "FIXED" | "PERCENT";
  discountValue: number;
  singleUse: boolean;
}

interface CreateCouponInput {
  name: string;
  code: string;
  expiresAt: string;
  quantity: number;
  isActive: boolean;
  discountType: "FIXED" | "PERCENT";
  discountValue: number;
  singleUse: boolean;
  userIds?: string[];
}

class CouponsService {
  private toProblem(status: number, title: string, detail: string) {
    return {
      status,
      type: "https://api.shop.am/problems/validation-error",
      title,
      detail,
    };
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private parseExpiresAt(input: string): Date {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw this.toProblem(400, "Validation Error", "Invalid coupon expiration date");
    }
    return date;
  }

  private calculateDiscountAmount(
    subtotal: number,
    discountType: "FIXED" | "PERCENT",
    discountValue: number
  ): number {
    if (subtotal <= 0) {
      return 0;
    }

    const rawDiscount =
      discountType === "PERCENT"
        ? (subtotal * discountValue) / 100
        : discountValue;

    const capped = Math.min(subtotal, Math.max(0, rawDiscount));
    return Math.round(capped * 100) / 100;
  }

  async getAdminCoupons() {
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
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
          },
          orderBy: { assignedAt: "desc" },
        },
        redemptions: {
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
            order: {
              select: {
                id: true,
                number: true,
                total: true,
                createdAt: true,
              },
            },
          },
          orderBy: { redeemedAt: "desc" },
          take: 30,
        },
      },
    });

    return {
      data: coupons.map((coupon) => ({
        ...coupon,
        status: coupon.isActive ? "active" : "inactive",
      })),
    };
  }

  async createCoupon(input: CreateCouponInput) {
    if (!input.name?.trim()) {
      throw this.toProblem(400, "Validation Error", "Coupon name is required");
    }
    if (!input.code?.trim()) {
      throw this.toProblem(400, "Validation Error", "Coupon code is required");
    }
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw this.toProblem(400, "Validation Error", "Coupon quantity must be greater than 0");
    }
    if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
      throw this.toProblem(400, "Validation Error", "Coupon discount must be greater than 0");
    }
    if (input.discountType === "PERCENT" && input.discountValue > 100) {
      throw this.toProblem(400, "Validation Error", "Percent coupon cannot exceed 100%");
    }

    const normalizedCode = this.normalizeCode(input.code);
    const expiresAt = this.parseExpiresAt(input.expiresAt);
    const userIds = Array.from(new Set((input.userIds || []).filter(Boolean)));

    const coupon = await db.coupon.create({
      data: {
        name: input.name.trim(),
        code: normalizedCode,
        expiresAt,
        quantity: Math.floor(input.quantity),
        remainingQuantity: Math.floor(input.quantity),
        isActive: input.isActive,
        discountType: input.discountType,
        discountValue: input.discountValue,
        singleUse: input.singleUse,
        assignments: userIds.length
          ? {
              createMany: {
                data: userIds.map((userId) => ({ userId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        assignments: true,
      },
    });

    return coupon;
  }

  async assignCouponToUsers(couponId: string, userIds: string[]) {
    if (!userIds.length) {
      throw this.toProblem(400, "Validation Error", "At least one user must be selected");
    }

    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    const coupon = await db.coupon.findUnique({
      where: { id: couponId },
      select: { id: true },
    });

    if (!coupon) {
      throw this.toProblem(404, "Not Found", "Coupon not found");
    }

    await db.couponAssignment.createMany({
      data: uniqueUserIds.map((userId) => ({
        couponId,
        userId,
      })),
      skipDuplicates: true,
    });

    await db.couponAssignment.updateMany({
      where: {
        couponId,
        userId: { in: uniqueUserIds },
      },
      data: {
        isActive: true,
      },
    });

    return { success: true };
  }

  async setCouponStatus(couponId: string, isActive: boolean) {
    const updated = await db.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });
    return updated;
  }

  async updateCoupon(couponId: string, input: Partial<CreateCouponInput>) {
    const coupon = await db.coupon.findUnique({
      where: { id: couponId },
      select: { id: true },
    });

    if (!coupon) {
      throw this.toProblem(404, "Not Found", "Coupon not found");
    }

    const updateData: {
      name?: string;
      code?: string;
      expiresAt?: Date;
      quantity?: number;
      remainingQuantity?: number;
      isActive?: boolean;
      discountType?: "FIXED" | "PERCENT";
      discountValue?: number;
      singleUse?: boolean;
    } = {};

    if (input.name?.trim()) {
      updateData.name = input.name.trim();
    }
    if (input.code?.trim()) {
      updateData.code = this.normalizeCode(input.code);
    }
    if (input.expiresAt) {
      updateData.expiresAt = this.parseExpiresAt(input.expiresAt);
    }
    if (Number.isFinite(input.quantity) && input.quantity! > 0) {
      const newQuantity = Math.floor(input.quantity!);
      updateData.quantity = newQuantity;
      // Update remainingQuantity if quantity is increased
      const currentCoupon = await db.coupon.findUnique({
        where: { id: couponId },
        select: { quantity: true, remainingQuantity: true },
      });
      if (currentCoupon && newQuantity > currentCoupon.quantity) {
        updateData.remainingQuantity = currentCoupon.remainingQuantity + (newQuantity - currentCoupon.quantity);
      }
    }
    if (typeof input.isActive === "boolean") {
      updateData.isActive = input.isActive;
    }
    if (input.discountType) {
      updateData.discountType = input.discountType;
    }
    if (Number.isFinite(input.discountValue) && input.discountValue! > 0) {
      updateData.discountValue = input.discountValue!;
    }
    if (typeof input.singleUse === "boolean") {
      updateData.singleUse = input.singleUse;
    }

    if (input.discountType === "PERCENT" && input.discountValue && input.discountValue > 100) {
      throw this.toProblem(400, "Validation Error", "Percent coupon cannot exceed 100%");
    }

    const userIds = Array.isArray(input.userIds) 
      ? Array.from(new Set(input.userIds.filter(Boolean))) 
      : undefined;

    // Update assignments if userIds are provided
    if (userIds !== undefined) {
      // Delete existing assignments
      await db.couponAssignment.deleteMany({
        where: { couponId },
      });

      // Create new assignments if userIds are provided
      if (userIds.length > 0) {
        await db.couponAssignment.createMany({
          data: userIds.map((userId) => ({
            couponId,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await db.coupon.update({
      where: { id: couponId },
      data: updateData,
      include: {
        assignments: true,
      },
    });

    return updated;
  }

  async deleteCoupon(couponId: string) {
    const coupon = await db.coupon.findUnique({
      where: { id: couponId },
      select: { id: true },
    });

    if (!coupon) {
      throw this.toProblem(404, "Not Found", "Coupon not found");
    }

    await db.coupon.delete({
      where: { id: couponId },
    });

    return { success: true };
  }

  async validateForUser(params: {
    code: string;
    userId: string;
    subtotal: number;
  }): Promise<CheckoutCouponValidationResult> {
    const normalizedCode = this.normalizeCode(params.code);
    if (!normalizedCode) {
      throw this.toProblem(400, "Validation Error", "Coupon code is required");
    }

    const coupon = await db.coupon.findUnique({
      where: { code: normalizedCode },
      include: {
        assignments: {
          where: { userId: params.userId },
          take: 1,
        },
      },
    });

    if (!coupon || !coupon.isActive) {
      throw this.toProblem(400, "Invalid coupon", "Coupon code is invalid");
    }

    const now = new Date();
    if (coupon.expiresAt <= now) {
      throw this.toProblem(400, "Invalid coupon", "Coupon is expired");
    }

    if (coupon.remainingQuantity <= 0) {
      throw this.toProblem(400, "Invalid coupon", "Coupon usage limit reached");
    }

    const assignment = coupon.assignments[0];
    if (!assignment || !assignment.isActive) {
      throw this.toProblem(403, "Forbidden", "Coupon is not assigned to this user");
    }

    if (coupon.singleUse && assignment.usedAt) {
      throw this.toProblem(400, "Invalid coupon", "Coupon is already used");
    }

    const discountAmount = this.calculateDiscountAmount(
      params.subtotal,
      coupon.discountType as "FIXED" | "PERCENT",
      coupon.discountValue
    );

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType as "FIXED" | "PERCENT",
      discountValue: coupon.discountValue,
      singleUse: coupon.singleUse,
    };
  }

  async redeemCouponInCheckout(tx: CouponTxClient, params: {
    couponValidation: CheckoutCouponValidationResult;
    userId: string;
    orderId: string;
  }) {
    const now = new Date();
    const couponUpdate = await tx.coupon.updateMany({
      where: {
        id: params.couponValidation.couponId,
        isActive: true,
        expiresAt: { gt: now },
        remainingQuantity: { gt: 0 },
      },
      data: {
        remainingQuantity: { decrement: 1 },
      },
    });

    if (couponUpdate.count === 0) {
      throw this.toProblem(400, "Invalid coupon", "Coupon is no longer available");
    }

    const assignmentUpdate = await tx.couponAssignment.updateMany({
      where: {
        couponId: params.couponValidation.couponId,
        userId: params.userId,
        isActive: true,
        ...(params.couponValidation.singleUse ? { usedAt: null } : {}),
      },
      data: {
        useCount: { increment: 1 },
        ...(params.couponValidation.singleUse
          ? { usedAt: now }
          : {}),
      },
    });

    if (assignmentUpdate.count === 0) {
      throw this.toProblem(400, "Invalid coupon", "Coupon is no longer valid for this user");
    }

    await tx.couponRedemption.create({
      data: {
        couponId: params.couponValidation.couponId,
        userId: params.userId,
        orderId: params.orderId,
        discountAmount: params.couponValidation.discountAmount,
      },
    });

    const couponAfterUpdate = await tx.coupon.findUnique({
      where: { id: params.couponValidation.couponId },
      select: { remainingQuantity: true, isActive: true },
    });

    if (couponAfterUpdate && couponAfterUpdate.remainingQuantity <= 0 && couponAfterUpdate.isActive) {
      await tx.coupon.update({
        where: { id: params.couponValidation.couponId },
        data: { isActive: false },
      });
    }
  }
}

export const couponsService = new CouponsService();

