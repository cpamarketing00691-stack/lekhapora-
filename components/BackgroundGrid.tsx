import React from 'react';

/**
 * A highly performant, lightweight background pattern component.
 * Uses CSS background gradients to create a modern grid + dots effect.
 * This approach is significantly more efficient than rendering hundreds of individual DOM nodes.
 */
const BackgroundGrid: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 
        The main pattern layer:
        - Radial gradient for dots at intersections (spaced at 40px)
        - Linear gradients for subtle vertical and horizontal grid lines
      */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgb(var(--brand-text-s) / 0.6) 1.5px, transparent 0),
            linear-gradient(to right, rgb(var(--brand-text-s) / 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(var(--brand-text-s) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
        }}
      />
      
      {/* 
        Ambient depth layer:
        Adds a very soft radial glow from the top to ground the layout visually.
      */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `radial-gradient(circle at 50% -10%, rgb(var(--brand-primary) / 0.1), transparent 85%)`
        }}
      />
    </div>
  );
};

export default BackgroundGrid;