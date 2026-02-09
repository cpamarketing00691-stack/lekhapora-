import React from 'react';

/**
 * BackgroundGrid Component
 * 
 * A high-performance, CSS-only background layer that provides a subtle
 * small grid pattern across the entire application.
 */
const BackgroundGrid: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none z-0 bg-brand-bg"
      aria-hidden="true"
      style={{
        /* 
          Using linear-gradients to create a repeating 20px grid.
          The opacity is kept extremely low (5-8%) for a clean, professional aesthetic.
        */
        backgroundImage: `
          linear-gradient(to right, rgb(var(--brand-text-s) / 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(var(--brand-text-s) / 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
    />
  );
};

export default BackgroundGrid;