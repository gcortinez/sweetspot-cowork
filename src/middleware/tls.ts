import { Request, Response, NextFunction } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * TLS Configuration options
 */
export interface TLSConfig {
  key?: string;
  cert?: string;
  ca?: string;
  keyPath?: string;
  certPath?: string;
  caPath?: string;
  minVersion?: string;
  maxVersion?: string;
  ciphers?: string;
  honorCipherOrder?: boolean;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
}

/**
 * Default secure TLS configuration
 */
export const DEFAULT_TLS_CONFIG: TLSConfig = {
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  // Secure cipher suites (prioritize perfect forward secrecy)
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

/**
 * Load TLS certificates from files
 */
export const loadTLSCertificates = (config: TLSConfig): { key?: Buffer; cert?: Buffer; ca?: Buffer } => {
  const result: { key?: Buffer; cert?: Buffer; ca?: Buffer } = {};

  try {
    // Load private key
    if (config.keyPath && fs.existsSync(config.keyPath)) {
      result.key = fs.readFileSync(config.keyPath);
      logger.info('TLS private key loaded', { path: config.keyPath });
    } else if (config.key) {
      result.key = Buffer.from(config.key);
      logger.info('TLS private key loaded from environment');
    }

    // Load certificate
    if (config.certPath && fs.existsSync(config.certPath)) {
      result.cert = fs.readFileSync(config.certPath);
      logger.info('TLS certificate loaded', { path: config.certPath });
    } else if (config.cert) {
      result.cert = Buffer.from(config.cert);
      logger.info('TLS certificate loaded from environment');
    }

    // Load CA certificate
    if (config.caPath && fs.existsSync(config.caPath)) {
      result.ca = fs.readFileSync(config.caPath);
      logger.info('TLS CA certificate loaded', { path: config.caPath });
    } else if (config.ca) {
      result.ca = Buffer.from(config.ca);
      logger.info('TLS CA certificate loaded from environment');
    }

  } catch (error) {
    logger.error('Failed to load TLS certificates', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new Error(`TLS certificate loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};

/**
 * Create HTTPS server options with secure defaults
 */
export const createHTTPSOptions = (config: TLSConfig = {}): https.ServerOptions => {
  const mergedConfig = { ...DEFAULT_TLS_CONFIG, ...config };
  const certificates = loadTLSCertificates(mergedConfig);

  if (!certificates.key || !certificates.cert) {
    throw new Error('TLS private key and certificate are required for HTTPS');
  }

  return {
    key: certificates.key,
    cert: certificates.cert,
    ca: certificates.ca,
    secureProtocol: 'TLSv1_2_method',
    secureOptions: 
      require('constants').SSL_OP_NO_SSLv2 |
      require('constants').SSL_OP_NO_SSLv3 |
      require('constants').SSL_OP_NO_TLSv1 |
      require('constants').SSL_OP_NO_TLSv1_1,
    ciphers: mergedConfig.ciphers,
    honorCipherOrder: mergedConfig.honorCipherOrder,
    requestCert: mergedConfig.requestCert,
    rejectUnauthorized: mergedConfig.rejectUnauthorized
  };
};

/**
 * Middleware to enforce HTTPS redirect
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    // Check if request is already secure
    const isSecure = req.secure || 
                    req.get('x-forwarded-proto') === 'https' ||
                    req.get('x-forwarded-ssl') === 'on';

    if (!isSecure) {
      const httpsUrl = `https://${req.get('host')}${req.url}`;
      
      logger.warn('HTTP request redirected to HTTPS', {
        originalUrl: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.redirect(301, httpsUrl);
    }
  }

  next();
};

/**
 * Middleware to add strict transport security headers
 */
export const strictTransportSecurity = (req: Request, res: Response, next: NextFunction) => {
  // HSTS header for HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
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

/**
 * Middleware to validate TLS connection quality
 */
export const validateTLSConnection = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && req.secure) {
    const socket = (req as any).connection;
    
    if (socket && socket.getCipher) {
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();
      
      // Log TLS connection details
      logger.debug('TLS connection established', {
        cipher: cipher?.name,
        version: cipher?.version,
        protocol,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Warn about weak ciphers
      if (cipher?.name && cipher.name.includes('RC4')) {
        logger.warn('Weak cipher detected', { 
          cipher: cipher.name,
          ip: req.ip 
        });
      }
      
      // Warn about old TLS versions
      if (protocol && (protocol.includes('TLSv1.0') || protocol.includes('TLSv1.1'))) {
        logger.warn('Old TLS version detected', { 
          protocol,
          ip: req.ip 
        });
      }
    }
  }

  next();
};

/**
 * Generate self-signed certificate for development
 */
export const generateSelfSignedCert = (options: {
  days?: number;
  keySize?: number;
  commonName?: string;
  outputDir?: string;
}) => {
  const {
    days = 365,
    keySize = 2048,
    commonName = 'localhost',
    outputDir = path.join(process.cwd(), 'certs')
  } = options;

  // This would typically use a library like 'selfsigned' or 'node-forge'
  // For now, we'll provide instructions
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

  logger.info('Self-signed certificate generation instructions', { instructions });
  return instructions;
};

/**
 * TLS configuration from environment variables
 */
export const getTLSConfigFromEnv = (): TLSConfig => {
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

/**
 * Check if TLS is properly configured
 */
export const isTLSConfigured = (): boolean => {
  const config = getTLSConfigFromEnv();
  
  const hasKeyAndCert = Boolean((config.key && config.cert) || 
                                (config.keyPath && config.certPath && 
                                 fs.existsSync(config.keyPath) && fs.existsSync(config.certPath)));
  
  return hasKeyAndCert;
};

/**
 * Middleware to ensure secure session handling
 */
export const secureSessionHandling = (req: Request, res: Response, next: NextFunction) => {
  // Ensure session cookies are secure in production
  if (process.env.NODE_ENV === 'production') {
    // These headers help ensure secure session handling
    res.setHeader('Set-Cookie', res.getHeaders()['set-cookie']?.toString().replace(/; secure/gi, '') + '; Secure; SameSite=Strict');
  }

  next();
};