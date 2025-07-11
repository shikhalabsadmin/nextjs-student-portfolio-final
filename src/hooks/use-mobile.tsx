import { useState, useEffect, useMemo } from 'react';

// Define standard breakpoints (matching Tailwind's default breakpoints)
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to check if viewport is below a specific breakpoint
 * @param breakpoint - The breakpoint to check against (sm, md, lg, xl, 2xl)
 * @returns boolean indicating if the viewport is below the specified breakpoint
 */
export function useIsMobile(breakpoint: Breakpoint = 'md'): boolean {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if current width is less than the specified breakpoint
  return windowWidth < breakpoints[breakpoint];
}

/**
 * Hook to get the current active breakpoint
 * @returns The current active breakpoint (xs, sm, md, lg, xl, 2xl)
 */
export function useActiveBreakpoint(): Breakpoint {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine current breakpoint
  const activeBreakpoint = useMemo(() => {
    if (windowWidth < breakpoints.sm) return 'xs';
    if (windowWidth < breakpoints.md) return 'sm';
    if (windowWidth < breakpoints.lg) return 'md';
    if (windowWidth < breakpoints.xl) return 'lg';
    if (windowWidth < breakpoints['2xl']) return 'xl';
    return '2xl';
  }, [windowWidth]);

  return activeBreakpoint;
}

/**
 * Hook to check if the viewport matches a specific breakpoint
 * @param min - The minimum breakpoint (inclusive)
 * @param max - The maximum breakpoint (exclusive)
 * @returns boolean indicating if the viewport is within the specified range
 */
export function useBreakpoint(min?: Breakpoint, max?: Breakpoint): boolean {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return useMemo(() => {
    const minWidth = min ? breakpoints[min] : 0;
    const maxWidth = max ? breakpoints[max] : Infinity;
    
    return windowWidth >= minWidth && windowWidth < maxWidth;
  }, [windowWidth, min, max]);
}

export default useIsMobile;
