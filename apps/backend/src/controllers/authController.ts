import { Response } from "express";
import { BaseRequest, AuthenticatedRequest, ErrorCode } from "../types/api";
import { z } from "zod";
import { AuthService } from "../services/authService";
import { UserService } from "../services/userService";
import { TenantService } from "../services/tenantService";
import {
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
  UserRole,
} from "@sweetspot/shared";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  tenantSlug: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  tenantSlug: z.string().min(1, "Tenant slug is required"),
  role: z.enum(["END_USER", "CLIENT_ADMIN", "COWORK_ADMIN"]).optional(),
  clientId: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  tenantSlug: z.string().min(1, "Tenant slug is required"),
});

const confirmResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Login user
 */
export const login = async (req: BaseRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: validation.error.errors,
      });
      return;
    }

    const { email, password, tenantSlug } = validation.data;

    // Attempt login
    const result = await AuthService.login(email, password, tenantSlug);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
      });
      return;
    }

    // Check if we have multiple tenants (user needs to select)
    if (result.tenants && !result.user) {
      res.status(200).json({
        success: true,
        tenants: result.tenants,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      });
      return;
    }

    // Normal response with user and single tenant
    res.status(200).json({
      success: true,
      user: result.user,
      tenant: result.tenant,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Register new user
 */
export const register = async (req: BaseRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: validation.error.errors,
      });
      return;
    }

    const { email, password, firstName, lastName, tenantSlug, role, clientId } =
      validation.data;

    // Attempt registration
    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      tenantSlug,
      role: role || "END_USER",
      clientId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tenant: result.tenant,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req: BaseRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(400).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    const token = authHeader.substring(7);
    await AuthService.logout(token);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: BaseRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: validation.error.errors,
      });
      return;
    }

    const { refreshToken } = validation.data;

    // Attempt token refresh
    const result = await AuthService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Get current user session
 */
export const getSession = async (
  req: BaseRequest,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    const token = authHeader.substring(7);
    const session = await AuthService.getSession(token);

    if (!session.isValid) {
      res.status(401).json({
        success: false,
        error: ErrorCode.TOKEN_INVALID,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: session.user,
        tenant: session.tenant,
        isValid: session.isValid,
      },
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    // Validate request body
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: validation.error.errors,
      });
      return;
    }

    const { currentPassword, newPassword } = validation.data;

    // Attempt password change
    const result = await AuthService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Request password reset
 */
export const resetPassword = async (
  req: BaseRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: validation.error.errors,
      });
      return;
    }

    const { email, tenantSlug } = validation.data;

    // Attempt password reset
    const result = await AuthService.resetPassword(email, tenantSlug);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Confirm password reset
 */
export const confirmResetPassword = async (
  req: BaseRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validation = confirmResetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: validation.error.errors,
      });
      return;
    }

    const { token, newPassword } = validation.data;

    // Attempt password reset confirmation
    const result = await AuthService.confirmResetPassword(token, newPassword);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Confirm reset password error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Verify user permissions
 */
export const verifyPermissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    const { action, resource, resourceId } = req.query;

    if (!action || !resource) {
      res.status(400).json({
        success: false,
        error: ErrorCode.MISSING_REQUIRED_FIELD,
      });
      return;
    }

    // Verify permissions
    const hasPermission = await AuthService.verifyPermissions(
      req.user.id,
      action as string,
      resource as string,
      resourceId as string
    );

    res.status(200).json({
      success: true,
      data: {
        hasPermission,
        user: {
          id: req.user.id,
          role: req.user.role,
          tenantId: req.user.tenantId,
          clientId: req.user.clientId,
        },
      },
    });
  } catch (error) {
    console.error("Verify permissions error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Get user profile
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    // Get full user details
    const user = await UserService.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: ErrorCode.RESOURCE_NOT_FOUND,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        tenant: req.tenant,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.id;
    delete updateData.email;
    delete updateData.tenantId;
    delete updateData.role;
    delete updateData.clientId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Update user profile
    const updatedUser = await UserService.updateUser(req.user.id, updateData);

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: ErrorCode.RESOURCE_NOT_FOUND,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};

/**
 * Get user coworks based on role
 */
export const getUserCoworks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: ErrorCode.UNAUTHORIZED_ACCESS,
      });
      return;
    }

    const result = await AuthService.getUserCoworks(req.user.id, req.user.role as UserRole);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        userCoworks: result.userCoworks,
        defaultCowork: result.defaultCowork,
        isSuperAdmin: result.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Get user coworks error:", error);
    res.status(500).json({
      success: false,
      error: ErrorCode.INTERNAL_ERROR,
    });
  }
};
