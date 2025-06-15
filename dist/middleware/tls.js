"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureSessionHandling = exports.isTLSConfigured = exports.getTLSConfigFromEnv = exports.generateSelfSignedCert = exports.validateTLSConnection = exports.strictTransportSecurity = exports.httpsRedirect = exports.createHTTPSOptions = exports.loadTLSCertificates = exports.DEFAULT_TLS_CONFIG = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
exports.DEFAULT_TLS_CONFIG = {
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA',
        'ECDHE-RSA-AES256-SHA',
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384',
        'AES128-SHA256',
        'AES256-SHA256',
        'AES128-SHA',
        'AES256-SHA'
    ].join(':'),
    honorCipherOrder: true,
    requestCert: false,
    rejectUnauthorized: true
};
const loadTLSCertificates = (config) => {
    const result = {};
    try {
        if (config.keyPath && fs_1.default.existsSync(config.keyPath)) {
            result.key = fs_1.default.readFileSync(config.keyPath);
            logger_1.logger.info('TLS private key loaded', { path: config.keyPath });
        }
        else if (config.key) {
            result.key = Buffer.from(config.key);
            logger_1.logger.info('TLS private key loaded from environment');
        }
        if (config.certPath && fs_1.default.existsSync(config.certPath)) {
            result.cert = fs_1.default.readFileSync(config.certPath);
            logger_1.logger.info('TLS certificate loaded', { path: config.certPath });
        }
        else if (config.cert) {
            result.cert = Buffer.from(config.cert);
            logger_1.logger.info('TLS certificate loaded from environment');
        }
        if (config.caPath && fs_1.default.existsSync(config.caPath)) {
            result.ca = fs_1.default.readFileSync(config.caPath);
            logger_1.logger.info('TLS CA certificate loaded', { path: config.caPath });
        }
        else if (config.ca) {
            result.ca = Buffer.from(config.ca);
            logger_1.logger.info('TLS CA certificate loaded from environment');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to load TLS certificates', { error: error.message });
        throw new Error(`TLS certificate loading failed: ${error.message}`);
    }
    return result;
};
exports.loadTLSCertificates = loadTLSCertificates;
const createHTTPSOptions = (config = {}) => {
    const mergedConfig = { ...exports.DEFAULT_TLS_CONFIG, ...config };
    const certificates = (0, exports.loadTLSCertificates)(mergedConfig);
    if (!certificates.key || !certificates.cert) {
        throw new Error('TLS private key and certificate are required for HTTPS');
    }
    return {
        key: certificates.key,
        cert: certificates.cert,
        ca: certificates.ca,
        secureProtocol: 'TLSv1_2_method',
        secureOptions: require('constants').SSL_OP_NO_SSLv2 |
            require('constants').SSL_OP_NO_SSLv3 |
            require('constants').SSL_OP_NO_TLSv1 |
            require('constants').SSL_OP_NO_TLSv1_1,
        ciphers: mergedConfig.ciphers,
        honorCipherOrder: mergedConfig.honorCipherOrder,
        requestCert: mergedConfig.requestCert,
        rejectUnauthorized: mergedConfig.rejectUnauthorized
    };
};
exports.createHTTPSOptions = createHTTPSOptions;
const httpsRedirect = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        const isSecure = req.secure ||
            req.get('x-forwarded-proto') === 'https' ||
            req.get('x-forwarded-ssl') === 'on';
        if (!isSecure) {
            const httpsUrl = `https://${req.get('host')}${req.url}`;
            logger_1.logger.warn('HTTP request redirected to HTTPS', {
                originalUrl: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.redirect(301, httpsUrl);
        }
    }
    next();
};
exports.httpsRedirect = httpsRedirect;
const strictTransportSecurity = (req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
    ].join('; '));
    next();
};
exports.strictTransportSecurity = strictTransportSecurity;
const validateTLSConnection = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.secure) {
        const socket = req.connection;
        if (socket && socket.getCipher) {
            const cipher = socket.getCipher();
            const protocol = socket.getProtocol();
            logger_1.logger.debug('TLS connection established', {
                cipher: cipher?.name,
                version: cipher?.version,
                protocol,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            if (cipher?.name && cipher.name.includes('RC4')) {
                logger_1.logger.warn('Weak cipher detected', {
                    cipher: cipher.name,
                    ip: req.ip
                });
            }
            if (protocol && (protocol.includes('TLSv1.0') || protocol.includes('TLSv1.1'))) {
                logger_1.logger.warn('Old TLS version detected', {
                    protocol,
                    ip: req.ip
                });
            }
        }
    }
    next();
};
exports.validateTLSConnection = validateTLSConnection;
const generateSelfSignedCert = (options) => {
    const { days = 365, keySize = 2048, commonName = 'localhost', outputDir = path_1.default.join(process.cwd(), 'certs') } = options;
    const instructions = `
To generate a self-signed certificate for development:

1. Install openssl
2. Run the following commands:

mkdir -p ${outputDir}
openssl genrsa -out ${outputDir}/key.pem ${keySize}
openssl req -new -key ${outputDir}/key.pem -out ${outputDir}/csr.pem -subj "/CN=${commonName}"
openssl x509 -req -days ${days} -in ${outputDir}/csr.pem -signkey ${outputDir}/key.pem -out ${outputDir}/cert.pem
rm ${outputDir}/csr.pem

Then set environment variables:
TLS_KEY_PATH=${outputDir}/key.pem
TLS_CERT_PATH=${outputDir}/cert.pem
`;
    logger_1.logger.info('Self-signed certificate generation instructions', { instructions });
    return instructions;
};
exports.generateSelfSignedCert = generateSelfSignedCert;
const getTLSConfigFromEnv = () => {
    return {
        keyPath: process.env.TLS_KEY_PATH,
        certPath: process.env.TLS_CERT_PATH,
        caPath: process.env.TLS_CA_PATH,
        key: process.env.TLS_KEY,
        cert: process.env.TLS_CERT,
        ca: process.env.TLS_CA,
        minVersion: process.env.TLS_MIN_VERSION || 'TLSv1.2',
        maxVersion: process.env.TLS_MAX_VERSION || 'TLSv1.3'
    };
};
exports.getTLSConfigFromEnv = getTLSConfigFromEnv;
const isTLSConfigured = () => {
    const config = (0, exports.getTLSConfigFromEnv)();
    const hasKeyAndCert = (config.key && config.cert) ||
        (config.keyPath && config.certPath &&
            fs_1.default.existsSync(config.keyPath) && fs_1.default.existsSync(config.certPath));
    return hasKeyAndCert;
};
exports.isTLSConfigured = isTLSConfigured;
const secureSessionHandling = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Set-Cookie', res.getHeaders()['set-cookie']?.toString().replace(/; secure/gi, '') + '; Secure; SameSite=Strict');
    }
    next();
};
exports.secureSessionHandling = secureSessionHandling;
//# sourceMappingURL=tls.js.map