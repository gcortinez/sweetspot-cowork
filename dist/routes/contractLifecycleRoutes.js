"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractLifecycleRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contractLifecycleController_1 = require("../controllers/contractLifecycleController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.contractLifecycleRoutes = router;
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractLifecycleController_1.contractLifecycleController.getContracts.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.createContract.bind(contractLifecycleController_1.contractLifecycleController));
router.get('/stats', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.getContractStats.bind(contractLifecycleController_1.contractLifecycleController));
router.get('/expiring', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractLifecycleController_1.contractLifecycleController.getExpiringContracts.bind(contractLifecycleController_1.contractLifecycleController));
router.get('/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractLifecycleController_1.contractLifecycleController.getContractById.bind(contractLifecycleController_1.contractLifecycleController));
router.put('/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.updateContract.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/:id/activate', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.activateContract.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/:id/suspend', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.suspendContract.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/:id/reactivate', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.reactivateContract.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/:id/terminate', (0, auth_1.authorize)(['ADMIN']), contractLifecycleController_1.contractLifecycleController.terminateContract.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/:id/cancel', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.cancelContract.bind(contractLifecycleController_1.contractLifecycleController));
router.get('/:id/activity', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractLifecycleController_1.contractLifecycleController.getContractActivity.bind(contractLifecycleController_1.contractLifecycleController));
router.post('/:id/send-for-signature', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractLifecycleController_1.contractLifecycleController.sendContractForSignature.bind(contractLifecycleController_1.contractLifecycleController));
//# sourceMappingURL=contractLifecycleRoutes.js.map