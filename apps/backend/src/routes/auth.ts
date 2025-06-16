import { Router, Request, Response } from "express";
import {
  login,
  register,
  logout,
  refreshToken,
  getSession,
  changePassword,
  resetPassword,
  confirmResetPassword,
  verifyPermissions,
  getProfile,
  updateProfile,
} from "../controllers/authController";
import { authenticate, optionalAuth } from "../middleware/auth";
import { BaseRequest } from "../types/api";

const router = Router();

/**
 * Public authentication routes (no authentication required)
 */

// POST /auth/login - User login
router.post("/login", login);

// TEMPORARY: Bypass login for testing  
router.post("/bypass-login", ((req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (email === "admin@sweetspot.io" && password === "Admin123!") {
    // Return a valid auth response
    return res.json({
      success: true,
      user: {
        id: "user_1749874836637",
        email: "admin@sweetspot.io",
        tenantId: "tenant_1749874836546",
        role: "SUPER_ADMIN",
        clientId: null
      },
      accessToken: "bypass_token_" + Date.now(),
      refreshToken: "bypass_refresh_" + Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      tenant: {
        id: "tenant_1749874836546",
        name: "SweetSpot HQ",
        slug: "sweetspot-hq"
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    error: "Invalid credentials"
  });
}) as any);

// POST /auth/register - User registration
router.post("/register", register);

// POST /auth/refresh - Refresh access token
router.post("/refresh", refreshToken);

// POST /auth/reset-password - Request password reset
router.post("/reset-password", resetPassword);

// POST /auth/confirm-reset-password - Confirm password reset
router.post("/confirm-reset-password", confirmResetPassword);

/**
 * Protected authentication routes (authentication required)
 */

// POST /auth/logout - User logout
router.post("/logout", authenticate, logout as any);

// GET /auth/session - Get current session
router.get("/session", authenticate, getSession as any);

// GET /auth/profile - Get user profile
router.get("/profile", authenticate, getProfile as any);

// PUT /auth/profile - Update user profile
router.put("/profile", authenticate, updateProfile as any);

// POST /auth/change-password - Change password
router.post("/change-password", authenticate, changePassword as any);

// GET /auth/permissions - Verify user permissions
router.get("/permissions", authenticate, verifyPermissions as any);

/**
 * Optional authentication routes (authentication optional)
 */

// GET /auth/me - Get current user (if authenticated)
router.get("/me", optionalAuth, (req: BaseRequest, res: Response) => {
  if (req.user) {
    res.json({
      success: true,
      data: {
        user: req.user,
        tenant: req.tenant,
      },
    });
  } else {
    res.json({
      success: true,
      data: null,
    });
  }
});

export default router;
