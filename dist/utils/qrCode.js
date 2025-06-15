"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = generateQRCode;
const crypto_1 = __importDefault(require("crypto"));
async function generateQRCode(data) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(data);
    const baseHash = hash.digest('hex');
    return `VISITOR-${baseHash.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}
//# sourceMappingURL=qrCode.js.map