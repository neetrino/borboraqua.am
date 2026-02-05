'use client';

interface LanguageIconProps {
  size?: number;
  className?: string;
}

export function LanguageIcon({ size = 20, className = '' }: LanguageIconProps) {
  // Language icon exported from Figma (node-id: 96:926)
  // If you later download the SVG into /public, you can replace this URL with a local path.
  const imgLanguageIcon = "http://localhost:3845/assets/1eee720937e2553599a0392b5ba9ee89423b3b80.svg";
  
  return (
    <img 
      alt="Language" 
      className={`block max-w-none ${className}`}
      src={imgLanguageIcon}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}

