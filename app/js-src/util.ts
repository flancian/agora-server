// app/js-src/util.ts

export const CLIENT_DEFAULTS = {
  user: 'agora',
  autoExpandSearch: false,
  autoExpandWikipedia: false,
  autoExpandAll: false,
  autoPull: true,
  showBrackets: false,
  showGraphLabels: true,
  showHypothesis: false,
  autoExpandStoas: false,
  demoTimeoutSeconds: '17',
  showEditSection: false,
};

export function safeJsonParse(value: string, defaultValue: any) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Darkens a hex color by a given percentage.
 * @param {string} color - The hex color code (e.g., "#RRGGBB").
 * @param {number} percent - The percentage to darken by (0 to 100).
 * @returns {string} The new, darkened hex color code.
 */
export function darkenColor(color: string, percent: number): string {
    // If color is invalid, return a default fallback.
    if (typeof color !== 'string' || !color) {
        return '#000000';
    }

    // Ensure the color starts with a hash
    if (color.startsWith('#')) {
        color = color.slice(1);
    }

    // Parse the R, G, B values
    const num = parseInt(color, 16);
    let r = (num >> 16);
    let g = (num >> 8) & 0x00FF;
    let b = num & 0x0000FF;

    // Apply the darkening percentage
    const factor = 1 - (percent / 100);
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);

    // Ensure values are within the 0-255 range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // Convert back to a hex string and pad with zeros if needed
    const darkened = `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
    
    return darkened;
}