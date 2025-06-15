import crypto from 'crypto';

/**
 * Generate a unique QR code for visitors
 * In production, this would use a QR code library like qrcode
 * For now, we generate a unique identifier
 */
export async function generateQRCode(data: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  const baseHash = hash.digest('hex');
  
  // Create a visitor-specific QR code format
  return `VISITOR-${baseHash.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}