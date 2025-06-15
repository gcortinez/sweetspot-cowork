"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionService = exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
class EncryptionService {
    algorithm = 'aes-256-gcm';
    keyLength = 32;
    ivLength = 16;
    tagLength = 16;
    getEncryptionKey() {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new Error('ENCRYPTION_KEY environment variable is required');
        }
        if (key.length === this.keyLength * 2) {
            return Buffer.from(key, 'hex');
        }
        if (key.length === Math.ceil(this.keyLength * 4 / 3)) {
            return Buffer.from(key, 'base64');
        }
        return crypto_1.default.createHash('sha256').update(key).digest();
    }
    generateEncryptionKey() {
        return crypto_1.default.randomBytes(this.keyLength).toString('hex');
    }
    encrypt(data) {
        try {
            const key = this.getEncryptionKey();
            const iv = crypto_1.default.randomBytes(this.ivLength);
            const cipher = crypto_1.default.createCipherGCM(this.algorithm, key, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        }
        catch (error) {
            logger_1.logger.error('Encryption failed', { error: error.message });
            throw new Error('Failed to encrypt data');
        }
    }
    decrypt(options) {
        try {
            const key = this.getEncryptionKey();
            const iv = Buffer.from(options.iv, 'hex');
            const tag = Buffer.from(options.tag, 'hex');
            const decipher = crypto_1.default.createDecipherGCM(this.algorithm, key, iv);
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(options.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Decryption failed', { error: error.message });
            throw new Error('Failed to decrypt data');
        }
    }
    hash(data, salt) {
        const actualSalt = salt || crypto_1.default.randomBytes(16).toString('hex');
        const hash = crypto_1.default.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
        return `${actualSalt}:${hash.toString('hex')}`;
    }
    verifyHash(data, hashedData) {
        try {
            const [salt, hash] = hashedData.split(':');
            const verifyHash = crypto_1.default.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
            return hash === verifyHash.toString('hex');
        }
        catch (error) {
            logger_1.logger.error('Hash verification failed', { error: error.message });
            return false;
        }
    }
    encryptField(value) {
        if (!value)
            return null;
        const result = this.encrypt(value);
        return `${result.encryptedData}:${result.iv}:${result.tag}`;
    }
    decryptField(encryptedValue) {
        if (!encryptedValue)
            return null;
        try {
            const [encryptedData, iv, tag] = encryptedValue.split(':');
            return this.decrypt({ encryptedData, iv, tag });
        }
        catch (error) {
            logger_1.logger.error('Field decryption failed', { error: error.message });
            return null;
        }
    }
    encryptObject(obj) {
        const jsonString = JSON.stringify(obj);
        const result = this.encrypt(jsonString);
        return `${result.encryptedData}:${result.iv}:${result.tag}`;
    }
    decryptObject(encryptedValue) {
        try {
            const [encryptedData, iv, tag] = encryptedValue.split(':');
            const decryptedString = this.decrypt({ encryptedData, iv, tag });
            return JSON.parse(decryptedString);
        }
        catch (error) {
            logger_1.logger.error('Object decryption failed', { error: error.message });
            return null;
        }
    }
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    generateSecurePassword(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto_1.default.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        return password;
    }
    encryptPrismaFields(data, fieldsToEncrypt) {
        const encrypted = { ...data };
        fieldsToEncrypt.forEach(field => {
            if (encrypted[field] !== undefined && encrypted[field] !== null) {
                encrypted[field] = this.encryptField(encrypted[field]);
            }
        });
        return encrypted;
    }
    decryptPrismaFields(data, fieldsToDecrypt) {
        const decrypted = { ...data };
        fieldsToDecrypt.forEach(field => {
            if (decrypted[field] !== undefined && decrypted[field] !== null) {
                decrypted[field] = this.decryptField(decrypted[field]);
            }
        });
        return decrypted;
    }
    createEncryptedBackup(data) {
        const timestamp = new Date().toISOString();
        const backupData = {
            timestamp,
            data,
            checksum: crypto_1.default.createHash('sha256').update(JSON.stringify(data)).digest('hex')
        };
        return this.encryptObject(backupData);
    }
    restoreFromEncryptedBackup(encryptedBackup) {
        try {
            const backupData = this.decryptObject(encryptedBackup);
            if (!backupData)
                return null;
            const expectedChecksum = crypto_1.default.createHash('sha256')
                .update(JSON.stringify(backupData.data))
                .digest('hex');
            if (expectedChecksum !== backupData.checksum) {
                logger_1.logger.error('Backup checksum verification failed');
                return null;
            }
            return backupData.data;
        }
        catch (error) {
            logger_1.logger.error('Backup restoration failed', { error: error.message });
            return null;
        }
    }
}
exports.EncryptionService = EncryptionService;
exports.encryptionService = new EncryptionService();
//# sourceMappingURL=encryptionService.js.map