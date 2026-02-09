import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

const CELL_SIZE = 60;

const GridCell = React.memo(({ r, c, rippleOrigin, onClick }: { r: number, c: number, rippleOrigin: { r: number, c: number, time: number }, onClick: (r: number, c: number) => void }) => {
  // Use useMemo to avoid recalculating distance unless necessary
  const distance = useMemo(() => 
    Math.sqrt(Math.pow(r - rippleOrigin.r, 2) + Math.pow(c - rippleOrigin.c, 2)),
    [r, c, rippleOrigin.r, rippleOrigin.c]
  );
  
  return (
    <motion.div
      onClick={(e) => {
        e.stopPropagation();
        onClick(r, c);
      }}
      // Fixed: key must remain constant for the cell to prevent remounting
      animate={rippleOrigin.time > 0 ? {
        backgroundColor: [
          "rgba(91, 125, 190, 0)", 
          "rgba(91, 125, 190, 0.15)", 
          "rgba(91, 125, 190, 0)"
        ],
      } : {}}
      transition={{
        duration: 1.0,
        delay: distance * 0.05,
        ease: "easeOut"
      }}
      className="border-[0.5px] border-brand-text-s/5 w-full h-full cursor-pointer hover:bg-brand-primary/5 transition-colors relative z-0"
    />
  );
}, (prev, next) => {
  // Only re-render if ripple time changes
  return prev.rippleOrigin.time === next.rippleOrigin.time;
});

GridCell.displayName = 'GridCell';

const BackgroundGrid: React.FC = () => {
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [rippleOrigin, setRippleOrigin] = useState({ r: -1, c: -1, time: 0 });

  const updateDimensions = useCallback(() => {
    setDimensions({
      cols: Math.ceil(window.innerWidth / CELL_SIZE),
      rows: Math.ceil(window.innerHeight / CELL_SIZE)
    });
  }, []);

  useEffect(() => {
    updateDimensions();
    const handleResize = () => {
      requestAnimationFrame(updateDimensions);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  const handleCellClick = useCallback((r: number, c: number) => {
    setRippleOrigin({ r, c, time: Date.now() });
  }, []);

  const cells = useMemo(() => {
    const arr = [];
    for (let r = 0; r < dimensions.rows; r++) {
      for (let c = 0; c < dimensions.cols; c++) {
        arr.push({ r, c });
      }
    }
    return arr;
  }, [dimensions]);

  if (dimensions.cols === 0) return null;

  return (
    <div 
      className="fixed inset-0 overflow-hidden select-none pointer-events-none" 
      style={{ zIndex: 0 }}
    >
      <div 
        className="grid w-full h-full pointer-events-auto" 
        style={{ 
          gridTemplateColumns: `repeat(${dimensions.cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${dimensions.rows}, ${CELL_SIZE}px)`,
        }}
      >
        {cells.map((cell) => (
          <GridCell 
            key={`${cell.r}-${cell.c}`} 
            r={cell.r} 
            c={cell.c} 
            rippleOrigin={rippleOrigin} 
            onClick={handleCellClick} 
          />
        ))}
      </div>
    </div>
  );
};

export default BackgroundGrid;