'use client';

interface ExitIconProps {
  size?: number;
  className?: string;
}

// Slightly larger/bolder logout icon for header (default 22px)
export function ExitIcon({ size = 22, className = '' }: ExitIconProps) {
  // Logout icon SVG saved locally from Figma: public/assets/home/Group 2146.svg
  const imgExitIcon = "/assets/home/Group 2146.svg";
  
  return (
    <img 
      alt="Exit" 
      className={`block max-w-none ${className}`}
      src={imgExitIcon}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}

