import { useState, useEffect } from 'react';

interface UseOptimizedImageOptions {
  quality?: number;
  maxWidth?: number;
}

export function useOptimizedImage(
  src: string | null, 
  options: UseOptimizedImageOptions = {}
) {
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) {
      setOptimizedUrl(null);
      setIsLoading(false);
      return;
    }

    const img = new Image();
    img.src = src;

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        let width = img.width;
        let height = img.height;

        // Apply max width if specified
        if (options.maxWidth && width > options.maxWidth) {
          const ratio = options.maxWidth / width;
          width = options.maxWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and optimize
        ctx.drawImage(img, 0, 0, width, height);
        const optimized = canvas.toDataURL('image/jpeg', options.quality || 0.8);

        setOptimizedUrl(optimized);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to optimize image'));
        setOptimizedUrl(src); // Fallback to original
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setOptimizedUrl(null);
      setIsLoading(false);
    };
  }, [src, options.quality, options.maxWidth]);

  return { optimizedUrl, isLoading, error };
}