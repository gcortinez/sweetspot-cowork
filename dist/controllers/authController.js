"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.verifyPermissions = exports.confirmResetPassword = exports.resetPassword = exports.changePassword = exports.getSession = exports.refreshToken = exports.logout = exports.register = exports.login = void 0;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const userService_1 = require("../services/userService");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
    tenantSlug: zod_1.z.string().optional(),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    tenantSlug: zod_1.z.string().min(1, "Tenant slug is required"),
    role: zod_1.z.enum(["END_USER", "CLIENT_ADMIN", "COWORK_ADMIN"]).optional(),
    clientId: zod_1.z.string().optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z.string().min(8, "New password must be at least 8 characters"),
});
const resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    tenantSlug: zod_1.z.string().min(1, "Tenant slug is required"),
});
const confirmResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    newPassword: zod_1.z.string().min(8, "New password must be at least 8 characters"),
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validation.error.errors,
            });
            return;
        }
        const { email, password, tenantSlug } = validation.data;
        const result = await authService_1.AuthService.login(email, password, tenantSlug);
        if (!result.success) {
            res.status(401).json({
                success: false,
                error: result.error,
            });
            return;
        }
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
        res.status(200).json({
            success: true,
            user: result.user,
            tenant: result.tenant,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: result.expiresAt,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validation.error.errors,
            });
            return;
        }
        const { email, password, firstName, lastName, tenantSlug, role, clientId } = validation.data;
        const result = await authService_1.AuthService.register({
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
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.register = register;
const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(400).json({
                success: false,
                error: "Access token required",
            });
            return;
        }
        const token = authHeader.substring(7);
        await authService_1.AuthService.logout(token);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.logout = logout;
const refreshToken = async (req, res) => {
    try {
        const validation = refreshTokenSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validation.error.errors,
            });
            return;
        }
        const { refreshToken } = validation.data;
        const result = await authService_1.AuthService.refreshToken(refreshToken);
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
    }
    catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.refreshToken = refreshToken;
const getSession = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "Access token required",
            });
            return;
        }
        const token = authHeader.substring(7);
        const session = await authService_1.AuthService.getSession(token);
        if (!session.isValid) {
            res.status(401).json({
                success: false,
                error: "Invalid or expired session",
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
    }
    catch (error) {
        console.error("Get session error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getSession = getSession;
const changePassword = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }
        const validation = changePasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validation.error.errors,
            });
            return;
        }
        const { currentPassword, newPassword } = validation.data;
        const result = await authService_1.AuthService.changePassword(req.user.id, currentPassword, newPassword);
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
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.changePassword = changePassword;
const resetPassword = async (req, res) => {
    try {
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validation.error.errors,
            });
            return;
        }
        const { email, tenantSlug } = validation.data;
        const result = await authService_1.AuthService.resetPassword(email, tenantSlug);
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
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.resetPassword = resetPassword;
const confirmResetPassword = async (req, res) => {
    try {
        const validation = confirmResetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validation.error.errors,
            });
            return;
        }
        const { token, newPassword } = validation.data;
        const result = await authService_1.AuthService.confirmResetPassword(token, newPassword);
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
    }
    catch (error) {
        console.error("Confirm reset password error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.confirmResetPassword = confirmResetPassword;
const verifyPermissions = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }
        const { action, resource, resourceId } = req.query;
        if (!action || !resource) {
            res.status(400).json({
                success: false,
                error: "Action and resource parameters required",
            });
            return;
        }
        const hasPermission = await authService_1.AuthService.verifyPermissions(req.user.id, action, resource, resourceId);
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
    }
    catch (error) {
        console.error("Verify permissions error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.verifyPermissions = verifyPermissions;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }
        const user = await userService_1.UserService.getUserById(req.user.id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
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
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }
        const updateData = req.body;
        delete updateData.id;
        delete updateData.email;
        delete updateData.tenantId;
        delete updateData.role;
        delete updateData.clientId;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        const updatedUser = await userService_1.UserService.updateUser(req.user.id, updateData);
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                user: updatedUser,
            },
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map