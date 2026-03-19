import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@white-shop/db";
import {
  requestPasswordReset,
  resetPasswordByToken,
  adminSendPasswordReset,
} from "./password-reset.service";

vi.mock("@white-shop/db", () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email-templates/password-reset", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("password-reset.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestPasswordReset", () => {
    it("throws when email is empty", async () => {
      await expect(requestPasswordReset("")).rejects.toMatchObject({
        status: 400,
        detail: "Email is required",
      });
      expect(db.user.findFirst).not.toHaveBeenCalled();
    });

    it("returns ok when user not found (no email leak)", async () => {
      (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await requestPasswordReset("unknown@example.com");
      expect(result).toEqual({ ok: true });
      expect(db.user.update).not.toHaveBeenCalled();
      const mod = await import("@/lib/email-templates/password-reset");
      expect(vi.mocked(mod.sendPasswordResetEmail)).not.toHaveBeenCalled();
    });

    it("creates token and sends email when user exists", async () => {
      (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
      });
      (db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const result = await requestPasswordReset("  User@Example.COM  ");
      expect(result).toEqual({ ok: true });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      });
      const emailModule = await import("@/lib/email-templates/password-reset");
      expect(vi.mocked(emailModule.sendPasswordResetEmail).mock.calls[0]).toEqual(["user@example.com", expect.any(String)]);
    });
  });

  describe("resetPasswordByToken", () => {
    it("throws when token is empty", async () => {
      await expect(resetPasswordByToken("", "newpass123")).rejects.toMatchObject({
        status: 400,
        detail: "Token is required",
      });
    });

    it("throws when password too short", async () => {
      await expect(resetPasswordByToken("sometoken", "12345")).rejects.toMatchObject({
        status: 400,
        detail: expect.stringContaining("6"),
      });
    });

    it("throws when token invalid or expired", async () => {
      (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(resetPasswordByToken("bad-token", "newpass123")).rejects.toMatchObject({
        status: 400,
        detail: expect.stringContaining("invalid or has expired"),
      });
    });

    it("updates password and clears token when valid", async () => {
      (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });
      (db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const result = await resetPasswordByToken("valid-token", "newpass123");
      expect(result).toEqual({ ok: true });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      });
    });
  });

  describe("adminSendPasswordReset", () => {
    it("throws 404 when user not found", async () => {
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(adminSendPasswordReset("missing-id")).rejects.toMatchObject({
        status: 404,
        title: "User not found",
      });
    });

    it("throws when user has no email", async () => {
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "u1",
        email: null,
        passwordHash: "hash",
      });
      await expect(adminSendPasswordReset("u1")).rejects.toMatchObject({
        status: 400,
        detail: expect.stringContaining("email"),
      });
    });

    it("throws when user has no password", async () => {
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        passwordHash: null,
      });
      await expect(adminSendPasswordReset("u1")).rejects.toMatchObject({
        status: 400,
        detail: expect.stringContaining("password"),
      });
    });

    it("sends reset email and returns ok", async () => {
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "u1",
        email: "admin-send@test.com",
        passwordHash: "hash",
      });
      (db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const result = await adminSendPasswordReset("u1");
      expect(result).toEqual({ ok: true });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      });
      const emailModule2 = await import("@/lib/email-templates/password-reset");
      expect(vi.mocked(emailModule2.sendPasswordResetEmail).mock.calls[0]).toEqual(["admin-send@test.com", expect.any(String)]);
    });
  });
});
