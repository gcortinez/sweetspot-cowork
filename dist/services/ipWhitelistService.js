"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipWhitelistService = exports.IPWhitelistService = void 0;
const auditLogService_1 = require("./auditLogService");
const securityEventService_1 = require("./securityEventService");
class IPWhitelistService {
    async isIPWhitelisted(tenantId, ipAddress, accessType = 'all') {
        try {
            const whitelist = this.getEnvironmentWhitelist();
            if (whitelist.exactIPs.includes(ipAddress)) {
                return {
                    allowed: true,
                    reason: 'IP in environment whitelist'
                };
            }
            for (const cidr of whitelist.cidrRanges) {
                if (this.isIPInCIDR(ipAddress, cidr)) {
                    return {
                        allowed: true,
                        reason: `IP in CIDR range: ${cidr}`
                    };
                }
            }
            if (process.env.NODE_ENV === 'development') {
                if (this.isLocalhost(ipAddress) || this.isPrivateIP(ipAddress)) {
                    return {
                        allowed: true,
                        reason: 'Development mode - localhost/private IP'
                    };
                }
            }
            return {
                allowed: false,
                reason: 'IP not in whitelist'
            };
        }
        catch (error) {
            return {
                allowed: false,
                reason: `Whitelist check failed: ${error.message}`
            };
        }
    }
    async addToWhitelist(tenantId, ipAddress, options) {
        await auditLogService_1.auditLogService.log({
            tenantId,
            userId: options.createdBy,
            action: 'CREATE',
            entityType: 'IPWhitelist',
            newValues: {
                ipAddress,
                cidrRange: options.cidrRange,
                description: options.description,
                allowedFor: options.allowedFor || ['all'],
                expiresAt: options.expiresAt
            },
            details: {
                action: 'IP added to whitelist'
            }
        });
        console.log(`IP ${ipAddress} would be added to whitelist for tenant ${tenantId}`);
    }
    async removeFromWhitelist(tenantId, ipAddress, removedBy) {
        await auditLogService_1.auditLogService.log({
            tenantId,
            userId: removedBy,
            action: 'DELETE',
            entityType: 'IPWhitelist',
            details: {
                action: 'IP removed from whitelist',
                ipAddress
            }
        });
        console.log(`IP ${ipAddress} would be removed from whitelist for tenant ${tenantId}`);
    }
    createIPWhitelistMiddleware(accessType = 'admin') {
        return async (req, res, next) => {
            const tenantId = req.user?.tenantId;
            const ipAddress = req.ip;
            if (!tenantId) {
                return res.status(401).json({ error: 'Tenant context required' });
            }
            const check = await this.isIPWhitelisted(tenantId, ipAddress, accessType);
            if (!check.allowed) {
                await securityEventService_1.securityEventService.logUnauthorizedAccess(tenantId, req.path, req.user?.id, ipAddress, req.get('User-Agent'));
                return res.status(403).json({
                    error: 'Access denied: IP not whitelisted',
                    reason: check.reason
                });
            }
            next();
        };
    }
    getEnvironmentWhitelist() {
        const exactIPs = (process.env.WHITELIST_IPS || '').split(',').filter(Boolean);
        const cidrRanges = (process.env.WHITELIST_CIDRS || '').split(',').filter(Boolean);
        return {
            exactIPs,
            cidrRanges
        };
    }
    isIPInCIDR(ip, cidr) {
        try {
            const [network, prefixLength] = cidr.split('/');
            const ipNum = this.ipToNumber(ip);
            const networkNum = this.ipToNumber(network);
            const mask = 0xFFFFFFFF << (32 - parseInt(prefixLength));
            return (ipNum & mask) === (networkNum & mask);
        }
        catch (error) {
            return false;
        }
    }
    ipToNumber(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    }
    isLocalhost(ip) {
        return ['127.0.0.1', '::1', 'localhost'].includes(ip);
    }
    isPrivateIP(ip) {
        const privateRanges = [
            { start: '10.0.0.0', end: '10.255.255.255' },
            { start: '172.16.0.0', end: '172.31.255.255' },
            { start: '192.168.0.0', end: '192.168.255.255' }
        ];
        const ipNum = this.ipToNumber(ip);
        return privateRanges.some(range => {
            const startNum = this.ipToNumber(range.start);
            const endNum = this.ipToNumber(range.end);
            return ipNum >= startNum && ipNum <= endNum;
        });
    }
    isValidIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }
    isValidCIDR(cidr) {
        const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[1-2]?[0-9]|3[0-2])$/;
        return cidrRegex.test(cidr);
    }
    static getClientIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket?.remoteAddress ||
            req.ip;
    }
    getEmergencyWhitelist() {
        return (process.env.EMERGENCY_WHITELIST_IPS || '').split(',').filter(Boolean);
    }
    async isEmergencyWhitelisted(ipAddress) {
        const emergencyIPs = this.getEmergencyWhitelist();
        return emergencyIPs.includes(ipAddress);
    }
}
exports.IPWhitelistService = IPWhitelistService;
exports.ipWhitelistService = new IPWhitelistService();
//# sourceMappingURL=ipWhitelistService.js.map