"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = void 0;
const errors_1 = require("../utils/errors");
const prisma_1 = require("../lib/prisma");
const tenantMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.AppError('Authentication required', 401);
        }
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            throw new errors_1.AppError('No tenant associated with user', 400);
        }
        const tenant = await prisma_1.prisma.tenant.findFirst({
            where: {
                id: tenantId,
                status: 'ACTIVE',
            },
        });
        if (!tenant) {
            throw new errors_1.AppError('Tenant not found or inactive', 404);
        }
        req.tenantId = tenantId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.tenantMiddleware = tenantMiddleware;
//# sourceMappingURL=tenant.js.map