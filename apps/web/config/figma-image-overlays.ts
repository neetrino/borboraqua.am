/**
 * Figma Image Overlays Configuration
 * 
 * Այս file-ը պահում է բոլոր նկարների overlay colors, opacity, և blend modes
 * Figma design-ից exact արժեքներով
 */

export interface ImageOverlay {
  glow?: {
    color: string;
    blur: string;
    blend: 'darken' | 'lighten' | 'multiply' | 'overlay' | 'normal';
  };
  overlay?: {
    color: string;
    blend: 'darken' | 'lighten' | 'multiply' | 'overlay' | 'normal';
  };
}

export const imageOverlays: Record<string, ImageOverlay> = {
  // Hero section decorative images
  'image-9': {
    glow: { color: 'rgba(118,179,233,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0.15)', blend: 'overlay' }
  },
  'image-5': {
    glow: { color: 'rgba(118,179,233,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0.15)', blend: 'overlay' }
  },
  'image-11': {
    glow: { color: 'rgba(118,179,233,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0.15)', blend: 'overlay' }
  },
  'image-12': {
    glow: { color: 'rgba(118,179,233,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0.15)', blend: 'overlay' }
  },
  'image-10': {
    glow: { color: 'rgba(255,255,255,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0)', blend: 'overlay' }
  },
  'image-16': {
    glow: { color: 'rgba(255,255,255,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0)', blend: 'overlay' }
  },
  'image-14': {
    glow: { color: 'rgba(255,255,255,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(255,255,255,0.23)', blend: 'overlay' }
  },
  'image-15': {
    glow: { color: 'rgba(255,255,255,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(255,255,255,0.23)', blend: 'overlay' }
  },
  'image-13': {
    glow: { color: 'rgba(118,179,233,0.1)', blur: '4px', blend: 'darken' },
    overlay: { color: 'rgba(0,132,255,0.15)', blend: 'overlay' }
  },
};

/**
 * Helper function to get overlay styles for an image
 */
export function getImageOverlayStyles(imageKey: string): React.CSSProperties {
  const overlay = imageOverlays[imageKey];
  if (!overlay) return {};

  const styles: React.CSSProperties = {};

  if (overlay.glow) {
    styles.backdropFilter = `blur(${overlay.glow.blur})`;
    styles.backgroundColor = overlay.glow.color;
    styles.mixBlendMode = overlay.glow.blend;
  }

  return styles;
}

/**
 * Helper function to get overlay div styles
 */
export function getOverlayDivStyles(imageKey: string): React.CSSProperties {
  const overlay = imageOverlays[imageKey];
  if (!overlay?.overlay) return {};

  return {
    backgroundColor: overlay.overlay.color,
    mixBlendMode: overlay.overlay.blend,
  };
}










