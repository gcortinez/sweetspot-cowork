import { Request, Response, NextFunction } from 'express';
import https from 'https';
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
export declare const DEFAULT_TLS_CONFIG: TLSConfig;
export declare const loadTLSCertificates: (config: TLSConfig) => {
    key?: Buffer;
    cert?: Buffer;
    ca?: Buffer;
};
export declare const createHTTPSOptions: (config?: TLSConfig) => https.ServerOptions;
export declare const httpsRedirect: (req: Request, res: Response, next: NextFunction) => void;
export declare const strictTransportSecurity: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateTLSConnection: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateSelfSignedCert: (options: {
    days?: number;
    keySize?: number;
    commonName?: string;
    outputDir?: string;
}) => string;
export declare const getTLSConfigFromEnv: () => TLSConfig;
export declare const isTLSConfigured: () => boolean;
export declare const secureSessionHandling: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tls.d.ts.map