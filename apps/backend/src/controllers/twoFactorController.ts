import { Response } from "express";
import { z } from "zod";
import { twoFactorService } from "../services/twoFactorService";
import { handleController } from "../utils/response";
import { ValidationError } from "../utils/errors";
import { AuthenticatedRequest } from "../types/api";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const EnableTwoFactorSchema = z.object({
  secret: z.string().min(1, "Secret is required"),
  token: z.string().regex(/^\d{6}$/, "Token must be 6 digits"),
  backupCodes: z.array(z.string()).min(10, "Must have 10 backup codes"),
});

const VerifyTwoFactorSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const DisableTwoFactorSchema = z.object({
  token: z.string().regex(/^\d{6}$/, "Token must be 6 digits"),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTenantId = (req: AuthenticatedRequest): string => {
  if (!req.user?.tenantId) {
    throw new ValidationError("Tenant context required");
  }
  return req.user.tenantId;
};

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.user?.id) {
    throw new ValidationError("User context required");
  }
  return req.user.id;
};

// ============================================================================
// 2FA CONTROLLERS
// ============================================================================

/**
 * Setup 2FA - Generate secret and QR code
 * POST /api/auth/2fa/setup
 */
export const setupTwoFactor = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const setupData = await twoFactorService.setupTwoFactor(userId, tenantId);

    return {
      secret: setupData.secret,
      qrCodeUrl: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      backupCodes: setupData.backupCodes,
      message:
        "2FA setup initiated. Please verify with your authenticator app.",
    };
  }, res);
};

/**
 * Enable 2FA after setup verification
 * POST /api/auth/2fa/enable
 */
export const enableTwoFactor = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const validatedData = EnableTwoFactorSchema.parse(req.body);

    await twoFactorService.enableTwoFactor(
      userId,
      tenantId,
      validatedData.secret,
      validatedData.token,
      validatedData.backupCodes
    );

    return { message: "2FA has been enabled successfully" };
  }, res);
};

/**
 * Disable 2FA
 * POST /api/auth/2fa/disable
 */
export const disableTwoFactor = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const validatedData = DisableTwoFactorSchema.parse(req.body);

    await twoFactorService.disableTwoFactor(
      userId,
      tenantId,
      validatedData.token
    );

    return { message: "2FA has been disabled" };
  }, res);
};

/**
 * Verify 2FA token
 * POST /api/auth/2fa/verify
 */
export const verifyTwoFactor = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const validatedData = VerifyTwoFactorSchema.parse(req.body);

    const result = await twoFactorService.verifyTwoFactor(
      userId,
      tenantId,
      validatedData.token
    );

    if (result.success) {
      return {
        verified: true,
        usedBackupCode: result.usedBackupCode,
        remainingBackupCodes: result.remainingBackupCodes,
        message: "2FA verification successful",
      };
    } else {
      throw new ValidationError("Invalid verification code");
    }
  }, res);
};

/**
 * Generate new backup codes
 * POST /api/auth/2fa/backup-codes
 */
export const generateBackupCodes = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const backupCodes = await twoFactorService.generateNewBackupCodes(
      userId,
      tenantId
    );

    return {
      backupCodes,
      message: "New backup codes generated. Please store them securely.",
    };
  }, res);
};

/**
 * Get 2FA status
 * GET /api/auth/2fa/status
 */
export const getTwoFactorStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const status = await twoFactorService.getTwoFactorStatus(userId, tenantId);

    return {
      ...status,
      message: "2FA status retrieved",
    };
  }, res);
};

/**
 * Check if 2FA is required for an operation
 * POST /api/auth/2fa/require-check
 */
export const checkTwoFactorRequired = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { operation } = req.body;

    if (!operation) {
      throw new ValidationError("Operation is required");
    }

    const required = await twoFactorService.requireTwoFactorForOperation(
      userId,
      tenantId,
      operation
    );

    return {
      required,
      operation,
      message: required
        ? "2FA verification required for this operation"
        : "2FA not required",
    };
  }, res);
};
