import fs from 'fs'
import path from 'path'

/**
 * Convert an image file to base64 string with data URI prefix
 * @param filePath - Path to the image file
 * @returns Promise<string> - Base64 encoded image with data URI prefix
 */
export async function convertImageToBase64(filePath: string): Promise<string> {
  try {
    // Read the file
    const imageBuffer = fs.readFileSync(filePath)
    
    // Get file extension to determine MIME type
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = getMimeType(ext)
    
    // Convert to base64
    const base64String = imageBuffer.toString('base64')
    
    // Return with data URI prefix
    return `data:${mimeType};base64,${base64String}`
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw new Error(`Failed to convert image to base64: ${error}`)
  }
}

/**
 * Convert a Buffer to base64 string with data URI prefix
 * @param buffer - Image buffer
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @returns string - Base64 encoded image with data URI prefix
 */
export function convertBufferToBase64(buffer: Buffer, mimeType: string): string {
  try {
    const base64String = buffer.toString('base64')
    return `data:${mimeType};base64,${base64String}`
  } catch (error) {
    console.error('Error converting buffer to base64:', error)
    throw new Error(`Failed to convert buffer to base64: ${error}`)
  }
}

/**
 * Get MIME type from file extension
 * @param extension - File extension (e.g., '.jpg', '.png')
 * @returns string - MIME type
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
  }
  
  return mimeTypes[extension] || 'image/jpeg'
}

/**
 * Validate if file is a supported image format
 * @param fileName - Name of the file
 * @returns boolean - True if supported format
 */
export function validateImageFormat(fileName: string): boolean {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const ext = path.extname(fileName).toLowerCase()
  return supportedExtensions.includes(ext)
}

/**
 * Validate if a string is a valid base64 data URI
 * @param dataUri - Base64 data URI string
 * @returns boolean - True if valid
 */
export function validateBase64DataUri(dataUri: string): boolean {
  // Check if it starts with data: and contains base64,
  const dataUriRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
  if (!dataUriRegex.test(dataUri)) {
    return false
  }
  
  try {
    // Extract and validate base64 portion
    const base64Part = dataUri.split(',')[1]
    // Try to decode to validate
    Buffer.from(base64Part, 'base64')
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get file size in bytes from a base64 data URI
 * @param dataUri - Base64 data URI string
 * @returns number - Size in bytes
 */
export function getBase64Size(dataUri: string): number {
  try {
    const base64Part = dataUri.split(',')[1]
    const buffer = Buffer.from(base64Part, 'base64')
    return buffer.length
  } catch (error) {
    return 0
  }
}

/**
 * Check if base64 image size is within limits
 * @param dataUri - Base64 data URI string
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 5MB)
 * @returns boolean - True if within limits
 */
export function validateBase64Size(dataUri: string, maxSizeBytes: number = 5 * 1024 * 1024): boolean {
  const size = getBase64Size(dataUri)
  return size <= maxSizeBytes
}

/**
 * Extract MIME type from base64 data URI
 * @param dataUri - Base64 data URI string
 * @returns string | null - MIME type or null if invalid
 */
export function extractMimeType(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}