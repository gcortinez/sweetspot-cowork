"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitalSignatureRoutes = void 0;
const express_1 = __importDefault(require("express"));
const digitalSignatureController_1 = require("../controllers/digitalSignatureController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.digitalSignatureRoutes = router;
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), digitalSignatureController_1.digitalSignatureController.getWorkflows.bind(digitalSignatureController_1.digitalSignatureController));
router.post('/', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), digitalSignatureController_1.digitalSignatureController.createWorkflow.bind(digitalSignatureController_1.digitalSignatureController));
router.get('/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), digitalSignatureController_1.digitalSignatureController.getWorkflowById.bind(digitalSignatureController_1.digitalSignatureController));
router.put('/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), digitalSignatureController_1.digitalSignatureController.updateWorkflow.bind(digitalSignatureController_1.digitalSignatureController));
router.post('/:id/cancel', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), digitalSignatureController_1.digitalSignatureController.cancelWorkflow.bind(digitalSignatureController_1.digitalSignatureController));
router.get('/:id/audit', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), digitalSignatureController_1.digitalSignatureController.getAuditTrail.bind(digitalSignatureController_1.digitalSignatureController));
router.get('/:workflowId/signer/:signerId', digitalSignatureController_1.digitalSignatureController.getSignerView.bind(digitalSignatureController_1.digitalSignatureController));
router.post('/:workflowId/signer/:signerId/sign', digitalSignatureController_1.digitalSignatureController.signDocument.bind(digitalSignatureController_1.digitalSignatureController));
router.post('/:workflowId/signer/:signerId/decline', digitalSignatureController_1.digitalSignatureController.declineSignature.bind(digitalSignatureController_1.digitalSignatureController));
router.get('/:workflowId/signature/:signatureId/verify', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), digitalSignatureController_1.digitalSignatureController.verifySignature.bind(digitalSignatureController_1.digitalSignatureController));
//# sourceMappingURL=digitalSignatureRoutes.js.map