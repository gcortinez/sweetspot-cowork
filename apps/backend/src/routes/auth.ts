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
  getUserCoworks,
} from "../controllers/authController";
import { authenticate, optionalAuth } from "../middleware/auth";
import { setCoworkContext, CoworkContextRequest } from "../middleware/coworkContext";
import { BaseRequest } from "../types/api";

const router = Router();

/**
 * Public authentication routes (no authentication required)
 */

// POST /auth/login - User login
router.post("/login", login);

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

// GET /auth/coworks - Get user's accessible coworks
router.get("/coworks", authenticate, getUserCoworks as any);

// GET /auth/context - Get current cowork context
const getContextHandler = async (req: any, res: Response, next: any) => {
  await setCoworkContext(req, res, () => {
    res.json({
      success: true,
      data: {
        activeCowork: req.activeCowork,
        userCoworks: req.userCoworks,
        isSuperAdmin: req.isSuperAdmin
      }
    });
  });
};

router.get("/context", authenticate, getContextHandler as any);

// POST /auth/set-active-cowork - Set active cowork for session
router.post("/set-active-cowork", authenticate, ((req: Request, res: Response): void => {
  const { coworkId } = req.body;
  
  if (!coworkId) {
    res.status(400).json({
      success: false,
      error: "MISSING_COWORK_ID",
      message: "Cowork ID is required"
    });
    return;
  }

  // This endpoint just validates the request
  // The actual cowork switching is handled by frontend via headers
  res.json({
    success: true,
    message: "Active cowork can be set via x-active-cowork header"
  });
}) as any);

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
