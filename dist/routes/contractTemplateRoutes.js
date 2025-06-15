"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractTemplateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contractTemplateController_1 = require("../controllers/contractTemplateController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.contractTemplateRoutes = router;
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractTemplateController_1.contractTemplateController.getTemplates.bind(contractTemplateController_1.contractTemplateController));
router.post('/', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractTemplateController_1.contractTemplateController.createTemplate.bind(contractTemplateController_1.contractTemplateController));
router.get('/categories', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractTemplateController_1.contractTemplateController.getTemplateCategories.bind(contractTemplateController_1.contractTemplateController));
router.post('/generate', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractTemplateController_1.contractTemplateController.generateContract.bind(contractTemplateController_1.contractTemplateController));
router.get('/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractTemplateController_1.contractTemplateController.getTemplateById.bind(contractTemplateController_1.contractTemplateController));
router.put('/:id', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractTemplateController_1.contractTemplateController.updateTemplate.bind(contractTemplateController_1.contractTemplateController));
router.delete('/:id', (0, auth_1.authorize)(['ADMIN']), contractTemplateController_1.contractTemplateController.deleteTemplate.bind(contractTemplateController_1.contractTemplateController));
router.get('/:id/validate', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractTemplateController_1.contractTemplateController.validateTemplate.bind(contractTemplateController_1.contractTemplateController));
router.post('/:id/duplicate', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractTemplateController_1.contractTemplateController.duplicateTemplate.bind(contractTemplateController_1.contractTemplateController));
router.post('/:id/preview', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractTemplateController_1.contractTemplateController.previewTemplate.bind(contractTemplateController_1.contractTemplateController));
//# sourceMappingURL=contractTemplateRoutes.js.map