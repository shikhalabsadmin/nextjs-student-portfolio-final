type Square = [x: number, y: number];

export interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
  /** Width of each grid cell in pixels */
  width?: number;
  /** Height of each grid cell in pixels */
  height?: number;
  /** X-axis offset of the pattern */
  x?: number;
  /** Y-axis offset of the pattern */
  y?: number;
  /** Array of coordinate pairs for rendering squares in the grid */
  squares?: Square[];
  /** SVG stroke dash array value for the grid lines */
  strokeDasharray?: number | string;
  /** Additional CSS classes to apply to the SVG */
  className?: string;
} 