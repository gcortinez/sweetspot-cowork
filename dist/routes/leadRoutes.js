"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = void 0;
const express_1 = require("express");
const leadController_1 = require("../controllers/leadController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.leadRoutes = router;
router.use(auth_1.authenticate);
router.get('/stats', leadController_1.leadController.getLeadStats);
router.get('/', leadController_1.leadController.getLeads);
router.get('/:id', leadController_1.leadController.getLeadById);
router.post('/', leadController_1.leadController.createLead);
router.put('/:id', leadController_1.leadController.updateLead);
router.delete('/:id', leadController_1.leadController.deleteLead);
router.post('/:id/assign', leadController_1.leadController.assignLead);
router.post('/:id/update-score', leadController_1.leadController.updateLeadScore);
router.post('/:id/add-note', leadController_1.leadController.addLeadNote);
//# sourceMappingURL=leadRoutes.js.map