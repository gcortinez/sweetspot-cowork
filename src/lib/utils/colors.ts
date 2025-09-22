/**
 * Utility functions for generating and managing space colors
 */

// Predefined color palette optimized for calendar visibility and accessibility
export const SPACE_COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#22c55e', // Green
  '#fb7185', // Rose
  '#0ea5e9', // Sky
  '#65a30d', // Green-600
  '#dc2626', // Red-600
  '#7c3aed', // Violet-600
  '#059669', // Emerald-600
] as const

/**
 * Generates a color for a space based on its index or randomly
 */
export function generateSpaceColor(index?: number): string {
  if (typeof index === 'number') {
    // Use modulo to cycle through colors if more spaces than colors
    return SPACE_COLOR_PALETTE[index % SPACE_COLOR_PALETTE.length]
  }

  // Random color selection
  const randomIndex = Math.floor(Math.random() * SPACE_COLOR_PALETTE.length)
  return SPACE_COLOR_PALETTE[randomIndex]
}

/**
 * Gets the next available color that's not already used
 */
export function getNextAvailableColor(usedColors: string[]): string {
  // Find first color not in used colors
  for (const color of SPACE_COLOR_PALETTE) {
    if (!usedColors.includes(color)) {
      return color
    }
  }

  // If all colors are used, return a random one
  return generateSpaceColor()
}

/**
 * Validates if a color is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexColorRegex.test(color)
}

/**
 * Converts a hex color to RGB for opacity calculations
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Creates a lighter version of a color for hover states
 */
export function lightenColor(hex: string, percent: number = 20): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const lighten = (value: number) => Math.min(255, Math.floor(value + (255 - value) * (percent / 100)))

  const newR = lighten(rgb.r).toString(16).padStart(2, '0')
  const newG = lighten(rgb.g).toString(16).padStart(2, '0')
  const newB = lighten(rgb.b).toString(16).padStart(2, '0')

  return `#${newR}${newG}${newB}`
}

/**
 * Creates a darker version of a color for border/accent
 */
export function darkenColor(hex: string, percent: number = 20): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const darken = (value: number) => Math.max(0, Math.floor(value * (1 - percent / 100)))

  const newR = darken(rgb.r).toString(16).padStart(2, '0')
  const newG = darken(rgb.g).toString(16).padStart(2, '0')
  const newB = darken(rgb.b).toString(16).padStart(2, '0')

  return `#${newR}${newG}${newB}`
}

/**
 * Determines if a color is light or dark for text contrast
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return true

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5
}

/**
 * Gets the appropriate text color (black or white) for a given background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff'
}