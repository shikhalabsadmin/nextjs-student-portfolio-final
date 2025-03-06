/**
 * A reusable grid pattern component that creates a customizable SVG grid background
 * with optional square patterns. Useful for creating decorative backgrounds.
 */

import { cn } from '@/lib/utils';
import { memo, useId, useMemo } from 'react';
import { GridPatternProps } from '@/types/grid-pattern';

const GridPatternBase: React.FC<GridPatternProps> = ({
  width = 30,
  height = 30,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  squares,
  className,
  ...props
}) => {
  // Generate unique ID for SVG pattern
  const patternId = useId();

  // Memoize squares rendering to prevent unnecessary recalculations
  const squaresElements = useMemo(() => {
    if (!squares) return null;

    return squares.map(([squareX, squareY]) => (
      <rect
        key={`${squareX}-${squareY}`}
        width={width - 1}
        height={height - 1}
        x={squareX * width + 1}
        y={squareY * height + 1}
        className="opacity-10"
        strokeWidth="0"
      />
    ));
  }, [squares, width, height]);

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        'fill-zinc-400/30 stroke-zinc-950/30',
        'opacity-40',
        className
      )}
      {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>

      {/* Base grid pattern */}
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />

      {/* Optional square patterns */}
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squaresElements}
        </svg>
      )}
    </svg>
  );
}

// Memoize the entire component for better performance
export default memo(GridPatternBase);