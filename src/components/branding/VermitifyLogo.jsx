import React from 'react';

export const FlowArrowLogo = ({ 
  size = 48, 
  primaryColor = '#1E3A8A', 
  accentColor = '#F97316',
  monochrome = false,
  monoColor = '#FFFFFF',
  className = ''
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <defs>
      <linearGradient id={`grad-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={monochrome ? monoColor : primaryColor} />
        <stop offset="100%" stopColor={monochrome ? monoColor : accentColor} />
      </linearGradient>
    </defs>
    <path 
      d="M24 6L42 36H32L24 22L16 36H6L24 6Z" 
      fill={monochrome ? monoColor : `url(#grad-${size})`}
    />
    <circle 
      cx="24" cy="42" r="4" 
      fill={monochrome ? monoColor : accentColor} 
      opacity={monochrome ? 1 : 0.8}
    />
  </svg>
);

export const VermitifyWordmark = ({ 
  className = '',
  gradient = true,
}) => (
  <span 
    className={gradient ? 'vf-sidebar-brand-gradient' : 'vf-sidebar-brand-solid'}
    style={{
      fontFamily: 'Raleway, sans-serif',
      fontWeight: 400,
      letterSpacing: '2px',
      textTransform: 'lowercase',
    }}
  >
    vermitify
  </span>
);

export const VermitifyLogo = ({ 
  size = 'md',
  variant = 'horizontal',
  colorMode = 'gradient',
  className = ''
}) => {
  const sizes = {
    sm: { icon: 24, text: '14px' },
    md: { icon: 32, text: '18px' },
    lg: { icon: 48, text: '24px' },
  };
  
  const { icon, text } = sizes[size];
  const isMonochrome = colorMode.startsWith('mono');
  const monoColor = colorMode === 'mono-white' ? '#FFFFFF' : '#000000';
  
  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        flexDirection: variant === 'vertical' ? 'column' : 'row',
      }}
    >
      <FlowArrowLogo 
        size={icon} 
        monochrome={isMonochrome}
        monoColor={monoColor}
      />
      <span
        className={colorMode === 'gradient' ? 'vf-sidebar-brand-gradient' : ''}
        style={{ 
          fontSize: text,
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 400,
          letterSpacing: '2px',
          textTransform: 'lowercase',
          color: isMonochrome ? monoColor : (colorMode === 'solid' ? '#1E3A8A' : undefined),
        }}
      >
        vermitify
      </span>
    </div>
  );
};

export default VermitifyLogo;