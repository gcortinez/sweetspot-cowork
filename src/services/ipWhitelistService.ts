import { prisma } from '../lib/prisma';
import { ValidationError } from '../utils/errors';
import { auditLogService } from './auditLogService';
import { securityEventService } from './securityEventService';
import { Request } from 'express';

// Add IP whitelist model to schema first, then implement this service
export interface IPWhitelistEntry {
  id: string;
  tenantId: string;
  ipAddress: string;
  cidrRange?: string;
  description?: string;
  allowedFor: string[]; // e.g., ['admin', 'api', 'all']
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface IPWhitelistCheck {
  allowed: boolean;
  matchedRule?: IPWhitelistEntry;
  reason?: string;
}

export class IPWhitelistService {
  /**
   * Check if an IP address is whitelisted for a specific access type
   */
  async isIPWhitelisted(
    tenantId: string,
    ipAddress: string,
    accessType: string = 'all'
  ): Promise<IPWhitelistCheck> {
    try {
      // For now, implement in-memory whitelist until we add the database model
      const whitelist = this.getEnvironmentWhitelist();
      
      // Check exact IP match
      if (whitelist.exactIPs.includes(ipAddress)) {
        return {
          allowed: true,
          reason: 'IP in environment whitelist'
        };
      }

      // Check CIDR ranges
      for (const cidr of whitelist.cidrRanges) {
        if (this.isIPInCIDR(ipAddress, cidr)) {
          return {
            allowed: true,
            reason: `IP in CIDR range: ${cidr}`
          };
        }
      }

      // Check localhost and private IPs in development
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
    } catch (error) {
      return {
        allowed: false,
        reason: `Whitelist check failed: ${error.message}`
      };
    }
  }

  /**
   * Add IP to whitelist (when database model is available)
   */
  async addToWhitelist(
    tenantId: string,
    ipAddress: string,
    options: {
      cidrRange?: string;
      description?: string;
      allowedFor?: string[];
      expiresAt?: Date;
      createdBy: string;
    }
  ): Promise<void> {
    // This would be implemented once we add the database model
    // For now, log the action
    await auditLogService.log({
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

  /**
   * Remove IP from whitelist
   */
  async removeFromWhitelist(
    tenantId: string,
    ipAddress: string,
    removedBy: string
  ): Promise<void> {
    await auditLogService.log({
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

  /**
   * Middleware to enforce IP whitelisting for admin routes
   */
  createIPWhitelistMiddleware(accessType: string = 'admin') {
    return async (req: Request, res: any, next: any) => {
      const tenantId = (req as any).user?.tenantId;
      const ipAddress = req.ip;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const check = await this.isIPWhitelisted(tenantId, ipAddress, accessType);

      if (!check.allowed) {
        // Log security event
        await securityEventService.logUnauthorizedAccess(
          tenantId,
          req.path,
          (req as any).user?.id,
          ipAddress,
          req.get('User-Agent')
        );

        return res.status(403).json({
          error: 'Access denied: IP not whitelisted',
          reason: check.reason
        });
      }

      // IP is whitelisted, continue
      next();
    };
  }

  /**
   * Get whitelist from environment variables
   */
  private getEnvironmentWhitelist() {
    const exactIPs = (process.env.WHITELIST_IPS || '').split(',').filter(Boolean);
    const cidrRanges = (process.env.WHITELIST_CIDRS || '').split(',').filter(Boolean);

    return {
      exactIPs,
      cidrRanges
    };
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInCIDR(ip: string, cidr: string): boolean {
    try {
      const [network, prefixLength] = cidr.split('/');
      const ipNum = this.ipToNumber(ip);
      const networkNum = this.ipToNumber(network);
      const mask = 0xFFFFFFFF << (32 - parseInt(prefixLength));
      
      return (ipNum & mask) === (networkNum & mask);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert IP address to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Check if IP is localhost
   */
  private isLocalhost(ip: string): boolean {
    return ['127.0.0.1', '::1', 'localhost'].includes(ip);
  }

  /**
   * Check if IP is in private range
   */
  private isPrivateIP(ip: string): boolean {
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

  /**
   * Validate IP address format
   */
  private isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Validate CIDR format
   */
  private isValidCIDR(cidr: string): boolean {
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[1-2]?[0-9]|3[0-2])$/;
    return cidrRegex.test(cidr);
  }

  /**
   * Get client IP with proxy support
   */
  static getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection as any).socket?.remoteAddress || 
           req.ip;
  }

  /**
   * Emergency IP whitelist for critical access
   */
  private getEmergencyWhitelist(): string[] {
    return (process.env.EMERGENCY_WHITELIST_IPS || '').split(',').filter(Boolean);
  }

  /**
   * Check emergency whitelist (always allowed)
   */
  async isEmergencyWhitelisted(ipAddress: string): Promise<boolean> {
    const emergencyIPs = this.getEmergencyWhitelist();
    return emergencyIPs.includes(ipAddress);
  }
}

export const ipWhitelistService = new IPWhitelistService();