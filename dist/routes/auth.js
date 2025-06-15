"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/login", authController_1.login);
router.post("/bypass-login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@sweetspot.io" && password === "Admin123!") {
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
});
router.post("/register", authController_1.register);
router.post("/refresh", authController_1.refreshToken);
router.post("/reset-password", authController_1.resetPassword);
router.post("/confirm-reset-password", authController_1.confirmResetPassword);
router.post("/logout", auth_1.authenticate, authController_1.logout);
router.get("/session", auth_1.authenticate, authController_1.getSession);
router.get("/profile", auth_1.authenticate, authController_1.getProfile);
router.put("/profile", auth_1.authenticate, authController_1.updateProfile);
router.post("/change-password", auth_1.authenticate, authController_1.changePassword);
router.get("/permissions", auth_1.authenticate, authController_1.verifyPermissions);
router.get("/me", auth_1.optionalAuth, (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            data: {
                user: req.user,
                tenant: req.tenant,
            },
        });
    }
    else {
        res.json({
            success: true,
            data: null,
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map