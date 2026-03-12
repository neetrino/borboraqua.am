const MOBILE_UA_REGEX = /Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i;
const TABLET_UA_REGEX = /iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 9|Nexus 10|SM-T/i;
export const DESKTOP_LAYOUT_MIN_WIDTH = 1025;

/**
 * Returns true only for touch-first phone/tablet devices.
 * Desktop/laptop environments stay on desktop layout even at narrow viewport widths.
 */
export function isTouchPhoneOrTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const isPhoneOrTabletByUserAgent = MOBILE_UA_REGEX.test(userAgent) || TABLET_UA_REGEX.test(userAgent);

  const hasTouchSupport = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hasNoHover = window.matchMedia('(hover: none)').matches;

  return isPhoneOrTabletByUserAgent && hasTouchSupport && hasCoarsePointer && hasNoHover;
}

/**
 * Mobile/tablet layout should be active only on touch devices and only below desktop breakpoint.
 * 1024px is still treated as mobile/tablet.
 */
export function shouldUseTouchMobileLayout(): boolean {
  if (typeof window === 'undefined') return false;
  return isTouchPhoneOrTabletDevice() && window.matchMedia(`(max-width: ${DESKTOP_LAYOUT_MIN_WIDTH - 1}px)`).matches;
}

/**
 * Compact layout should be used on any narrow viewport, including desktop/laptop screens.
 * This prevents mixed or cramped desktop UI on small laptop displays.
 */
export function shouldUseCompactLayout(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${DESKTOP_LAYOUT_MIN_WIDTH - 1}px)`).matches;
}
