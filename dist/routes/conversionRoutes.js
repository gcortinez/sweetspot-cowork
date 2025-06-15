"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversionRoutes = void 0;
const express_1 = require("express");
const conversionController_1 = require("../controllers/conversionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.conversionRoutes = router;
router.use(auth_1.authenticate);
router.get('/stats', conversionController_1.conversionController.getConversionStats);
router.get('/conversion-funnel', conversionController_1.conversionController.getConversionFunnel);
router.get('/qualified-leads', conversionController_1.conversionController.getQualifiedLeads);
router.get('/performance/:userId', conversionController_1.conversionController.getUserConversionPerformance);
router.post('/preview', conversionController_1.conversionController.previewConversion);
router.post('/lead-to-client', conversionController_1.conversionController.convertLeadToClient);
router.post('/batch-convert', conversionController_1.conversionController.batchConvertLeads);
router.get('/', conversionController_1.conversionController.getConversions);
router.get('/:id', conversionController_1.conversionController.getConversionById);
//# sourceMappingURL=conversionRoutes.js.map