import { cn } from "@/lib/utils";
import { LoadingProps } from "@/types/components/loading";

export function Loading({ 
  fullScreen = false,
  className,
  text,
  containerClassName,
  variant = 'primary'
}: LoadingProps) {
  // Variant classes
  const variantClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    white: 'border-white'
  };

  const Spinner = () => (
    <div className={cn(
      "animate-spin rounded-full border-2 border-t-transparent",
      "w-6 h-6 md:w-8 md:h-8", // Responsive by default
      variantClasses[variant],
      className
    )} 
    role="status"
    aria-label="Loading"
    />
  );

  const LoadingContent = () => (
    <div className="flex flex-col items-center gap-2 md:gap-3">
      <Spinner />
      {text && (
        <p className={cn(
          "text-sm md:text-base text-gray-600",
          variant === 'white' && "text-white"
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-3 md:p-4",
        containerClassName
      )}>
        <LoadingContent />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center",
      containerClassName
    )}>
      <LoadingContent />
    </div>
  );
} 