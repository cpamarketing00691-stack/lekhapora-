import React from 'react';

/**
 * BackgroundGrid Component
 * 
 * A high-performance, CSS-only background layer that provides a subtle, 
 * high-precision square grid pattern across the entire application.
 * 
 * Styled to match modern "Aceternity UI" aesthetics with ultra-thin lines
 * and responsive theme integration.
 */
const BackgroundGrid: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none z-0 bg-brand-bg transition-colors duration-500"
      aria-hidden="true"
      style={{
        /* 
          - Small 25px square grid.
          - 1px line thickness for high-precision look.
          - Opacity is tuned for a professional, clean aesthetic that doesn't 
            distract from content.
        */
        backgroundImage: `
          linear-gradient(to right, rgb(var(--brand-text-s) / 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(var(--brand-text-s) / 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '25px 25px',
      }}
    >
      {/* 
        Optional: Subtle radial overlay to add depth. 
        This prevents the grid from feeling "flat" across the whole screen.
      */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgb(var(--brand-bg) / 0.4) 100%)'
        }}
      />
    </div>
  );
};

export default BackgroundGrid;