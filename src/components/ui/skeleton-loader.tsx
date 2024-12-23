import { cn } from "@/lib/utils";

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  className?: string;
  containerClassName?: string;
}

export function SkeletonLoader({ 
  count = 1, 
  className,
  containerClassName,
  ...props 
}: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-4", containerClassName)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-md bg-gray-200 h-4",
            className
          )}
          {...props}
        />
      ))}
    </div>
  );
}