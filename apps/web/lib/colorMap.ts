/**
 * Color map utility for converting color names to hex codes
 * Used across the application for consistent color handling
 */

/**
 * Color mapping from name to hex code
 */
const colorMap: Record<string, string> = {
  'beige': '#F5F5DC',
  'black': '#000000',
  'blue': '#0000FF',
  'brown': '#A52A2A',
  'gray': '#808080',
  'grey': '#808080',
  'green': '#008000',
  'red': '#FF0000',
  'white': '#FFFFFF',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'navy': '#000080',
  'maroon': '#800000',
  'olive': '#808000',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'lime': '#00FF00',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
};

/**
 * Get hex color code from color name
 * @param colorName - The name of the color (case-insensitive)
 * @returns Hex color code (e.g., '#FF0000') or '#CCCCCC' as default if color not found
 */
export function getColorHex(colorName: string): string {
  if (!colorName) {
    return '#CCCCCC';
  }
  
  const normalizedName = colorName.toLowerCase().trim();
  return colorMap[normalizedName] || '#CCCCCC';
}


