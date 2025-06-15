"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractRenewalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contractRenewalController_1 = require("../controllers/contractRenewalController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.contractRenewalRoutes = router;
router.use(auth_1.authenticate);
router.get('/rules', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.getRenewalRules.bind(contractRenewalController_1.contractRenewalController));
router.post('/rules', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.createRenewalRule.bind(contractRenewalController_1.contractRenewalController));
router.put('/rules/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.updateRenewalRule.bind(contractRenewalController_1.contractRenewalController));
router.delete('/rules/:id', (0, auth_1.authorize)(['ADMIN']), contractRenewalController_1.contractRenewalController.deleteRenewalRule.bind(contractRenewalController_1.contractRenewalController));
router.patch('/rules/:id/toggle', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.toggleRuleStatus.bind(contractRenewalController_1.contractRenewalController));
router.get('/proposals', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractRenewalController_1.contractRenewalController.getRenewalProposals.bind(contractRenewalController_1.contractRenewalController));
router.post('/proposals/contract/:contractId', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.createRenewalProposal.bind(contractRenewalController_1.contractRenewalController));
router.post('/proposals/:id/process', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.processRenewalProposal.bind(contractRenewalController_1.contractRenewalController));
router.post('/check', (0, auth_1.authorize)(['ADMIN']), contractRenewalController_1.contractRenewalController.checkAndCreateRenewals.bind(contractRenewalController_1.contractRenewalController));
router.get('/stats', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractRenewalController_1.contractRenewalController.getRenewalStats.bind(contractRenewalController_1.contractRenewalController));
//# sourceMappingURL=contractRenewalRoutes.js.map