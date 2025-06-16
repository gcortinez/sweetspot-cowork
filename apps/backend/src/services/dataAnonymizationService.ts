import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { auditLogService } from "./auditLogService";

/**
 * Data Anonymization Service
 * Handles GDPR/CCPA compliance for data anonymization and pseudonymization
 */

export interface AnonymizationConfig {
  strategy: "MASK" | "HASH" | "RANDOMIZE" | "DELETE" | "PSEUDONYMIZE";
  preserveFormat?: boolean;
  salt?: string;
  algorithm?: "sha256" | "md5" | "bcrypt";
}

export interface PseudonymizationMapping {
  originalId: string;
  pseudonym: string;
  entityType: string;
  createdAt: Date;
  salt: string;
}

export interface AnonymizationRule {
  entityType: string;
  fieldName: string;
  config: AnonymizationConfig;
  isRequired: boolean;
  retentionDays?: number;
}

export class DataAnonymizationService {
  private readonly defaultSalt: string;
  private readonly pseudonymMappings: Map<string, string> = new Map();

  constructor() {
    this.defaultSalt =
      process.env.ANONYMIZATION_SALT || crypto.randomBytes(32).toString("hex");
  }

  /**
   * Anonymize user data for GDPR compliance
   */
  async anonymizeUser(
    tenantId: string,
    userId: string,
    requestedBy: string,
    reason: string = "GDPR_REQUEST"
  ): Promise<{
    success: boolean;
    anonymizedFields: string[];
    errors: string[];
  }> {
    const anonymizedFields: string[] = [];
    const errors: string[] = [];

    try {
      // Get user data
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Define anonymization rules for user entity
      const userRules: AnonymizationRule[] = [
        {
          entityType: "User",
          fieldName: "email",
          config: { strategy: "HASH" },
          isRequired: false,
        },
        {
          entityType: "User",
          fieldName: "firstName",
          config: { strategy: "MASK" },
          isRequired: true,
        },
        {
          entityType: "User",
          fieldName: "lastName",
          config: { strategy: "MASK" },
          isRequired: true,
        },
        {
          entityType: "User",
          fieldName: "phone",
          config: { strategy: "MASK", preserveFormat: true },
          isRequired: false,
        },
        {
          entityType: "User",
          fieldName: "address",
          config: { strategy: "DELETE" },
          isRequired: false,
        },
      ];

      // Apply anonymization rules
      const anonymizedData: any = {};

      for (const rule of userRules) {
        const originalValue = (user as any)[rule.fieldName];
        if (originalValue) {
          try {
            const anonymizedValue = await this.anonymizeField(
              originalValue,
              rule.config
            );
            anonymizedData[rule.fieldName] = anonymizedValue;
            anonymizedFields.push(rule.fieldName);
          } catch (error) {
            errors.push(
              `Failed to anonymize ${rule.fieldName}: ${
                (error as Error).message
              }`
            );
          }
        }
      }

      // Update user with anonymized data
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...anonymizedData,
          updatedAt: new Date(),
        },
      });

      // Anonymize related data
      await this.anonymizeUserRelatedData(tenantId, userId, requestedBy);

      // Log anonymization action
      await auditLogService.log({
        tenantId,
        userId: requestedBy,
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        details: {
          action: "Data anonymized",
          reason,
          anonymizedFields,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      logger.info("User data anonymized", {
        tenantId,
        userId,
        requestedBy,
        anonymizedFields,
        errors,
      });

      return {
        success: errors.length === 0,
        anonymizedFields,
        errors,
      };
    } catch (error) {
      logger.error("User anonymization failed", {
        tenantId,
        userId,
        error: (error as Error).message,
      });

      return {
        success: false,
        anonymizedFields,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Create pseudonym for data processing
   */
  async createPseudonym(
    originalId: string,
    entityType: string,
    salt?: string
  ): Promise<string> {
    const effectiveSalt = salt || this.defaultSalt;
    const pseudonym = crypto
      .createHash("sha256")
      .update(originalId + effectiveSalt + entityType)
      .digest("hex")
      .substring(0, 16); // Use first 16 characters for readability

    // Store mapping for potential de-pseudonymization
    this.pseudonymMappings.set(pseudonym, originalId);

    return `pseudo_${pseudonym}`;
  }

  /**
   * Pseudonymize dataset for analytics
   */
  async pseudonymizeDataset(
    tenantId: string,
    entityType: string,
    dataIds: string[],
    requestedBy: string
  ): Promise<{
    pseudonymMappings: Array<{ originalId: string; pseudonym: string }>;
    success: boolean;
    errors: string[];
  }> {
    const pseudonymMappings: Array<{ originalId: string; pseudonym: string }> =
      [];
    const errors: string[] = [];

    try {
      for (const originalId of dataIds) {
        try {
          const pseudonym = await this.createPseudonym(originalId, entityType);
          pseudonymMappings.push({ originalId, pseudonym });
        } catch (error) {
          errors.push(
            `Failed to pseudonymize ${originalId}: ${(error as Error).message}`
          );
        }
      }

      // Log pseudonymization action
      await auditLogService.log({
        tenantId,
        userId: requestedBy,
        action: "CREATE",
        entityType: "Pseudonymization",
        details: {
          action: "Dataset pseudonymized",
          entityType,
          recordCount: pseudonymMappings.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      return {
        pseudonymMappings,
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Dataset pseudonymization failed", {
        tenantId,
        entityType,
        error: (error as Error).message,
      });

      return {
        pseudonymMappings,
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Anonymize field based on configuration
   */
  private async anonymizeField(
    value: any,
    config: AnonymizationConfig
  ): Promise<any> {
    if (!value) return value;

    switch (config.strategy) {
      case "MASK":
        return this.maskValue(value, config.preserveFormat);

      case "HASH":
        return this.hashValue(value, config.salt, config.algorithm);

      case "RANDOMIZE":
        return this.randomizeValue(value);

      case "DELETE":
        return null;

      case "PSEUDONYMIZE":
        return this.createPseudonym(value, "field");

      default:
        throw new Error(`Unknown anonymization strategy: ${config.strategy}`);
    }
  }

  /**
   * Mask value while optionally preserving format
   */
  private maskValue(value: string, preserveFormat: boolean = false): string {
    if (!preserveFormat) {
      return "*".repeat(Math.min(value.length, 8));
    }

    // Preserve format for common patterns
    if (this.isEmail(value)) {
      const [local, domain] = value.split("@");
      return `${local.charAt(0)}${"*".repeat(local.length - 1)}@${domain}`;
    }

    if (this.isPhone(value)) {
      return value.replace(/\d/g, "*");
    }

    // Default masking
    return (
      value.substring(0, 2) +
      "*".repeat(Math.max(0, value.length - 4)) +
      value.slice(-2)
    );
  }

  /**
   * Hash value using specified algorithm
   */
  private hashValue(
    value: string,
    salt?: string,
    algorithm: string = "sha256"
  ): string {
    const effectiveSalt = salt || this.defaultSalt;
    const hash = crypto.createHash(algorithm);
    hash.update(value + effectiveSalt);
    return hash.digest("hex");
  }

  /**
   * Randomize value maintaining type and approximate structure
   */
  private randomizeValue(value: any): any {
    if (typeof value === "string") {
      if (this.isEmail(value)) {
        return `random${Math.floor(Math.random() * 10000)}@example.com`;
      }
      if (this.isPhone(value)) {
        return (
          "+1555" +
          Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, "0")
        );
      }
      return "random_" + crypto.randomBytes(4).toString("hex");
    }

    if (typeof value === "number") {
      return Math.floor(Math.random() * 1000000);
    }

    if (value instanceof Date) {
      const randomTime =
        new Date("2020-01-01").getTime() +
        Math.random() *
          (new Date("2023-12-31").getTime() - new Date("2020-01-01").getTime());
      return new Date(randomTime);
    }

    return value;
  }

  /**
   * Anonymize user-related data across all entities
   */
  private async anonymizeUserRelatedData(
    tenantId: string,
    userId: string,
    requestedBy: string
  ): Promise<void> {
    try {
      // Anonymize access logs
      await prisma.accessLog.updateMany({
        where: { tenantId, userId },
        data: {
          metadata: undefined,
        },
      });

      // Anonymize audit logs (keep structure but remove personal data)
      await prisma.auditLog.updateMany({
        where: { tenantId, userId },
        data: {
          details: { anonymized: true },
        },
      });

      // Note: Bookings, payments, and other business data may need
      // different treatment based on legal requirements and business needs
    } catch (error) {
      logger.error("Failed to anonymize user related data", {
        tenantId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if value matches email pattern
   */
  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /**
   * Check if value matches phone pattern
   */
  private isPhone(value: string): boolean {
    return /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ""));
  }

  /**
   * Bulk anonymize users based on retention policy
   */
  async bulkAnonymizeByRetention(
    tenantId: string,
    retentionDays: number,
    requestedBy: string
  ): Promise<{
    processedCount: number;
    successCount: number;
    errors: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let processedCount = 0;
    let successCount = 0;
    const errors: string[] = [];

    try {
      // Find users that should be anonymized based on retention policy
      const usersToAnonymize = await prisma.user.findMany({
        where: {
          tenantId,
          OR: [
            { lastLoginAt: { lt: cutoffDate } },
            { AND: [{ lastLoginAt: null }, { createdAt: { lt: cutoffDate } }] },
          ],
        },
        select: { id: true, email: true },
      });

      for (const user of usersToAnonymize) {
        processedCount++;

        try {
          const result = await this.anonymizeUser(
            tenantId,
            user.id,
            requestedBy,
            "RETENTION_POLICY"
          );

          if (result.success) {
            successCount++;
          } else {
            errors.push(...result.errors);
          }
        } catch (error) {
          errors.push(
            `Failed to anonymize user ${user.id}: ${(error as Error).message}`
          );
        }
      }

      logger.info("Bulk anonymization completed", {
        tenantId,
        processedCount,
        successCount,
        errorCount: errors.length,
      });

      return { processedCount, successCount, errors };
    } catch (error) {
      logger.error("Bulk anonymization failed", {
        tenantId,
        error: (error as Error).message,
      });

      return {
        processedCount,
        successCount,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate anonymization report
   */
  async generateAnonymizationReport(tenantId: string): Promise<{
    totalUsers: number;
    anonymizedUsers: number;
    pseudonymizedRecords: number;
    retentionCompliance: boolean;
  }> {
    try {
      const totalUsers = await prisma.user.count({
        where: { tenantId },
      });

      const anonymizedUsers = 0; // Placeholder since we don't have isAnonymized field

      return {
        totalUsers,
        anonymizedUsers,
        pseudonymizedRecords: this.pseudonymMappings.size,
        retentionCompliance: anonymizedUsers / totalUsers >= 0.95, // 95% threshold
      };
    } catch (error) {
      logger.error("Failed to generate anonymization report", {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const dataAnonymizationService = new DataAnonymizationService();
