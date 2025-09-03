import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ErrorProps } from "@/types/components/error";

export function Error({
  title = "Oops!",
  message = "Something went wrong. Please try again.",
  fullScreen = false,
  retry,
  className,
  containerClassName,
  showHomeButton = true,
  variant = 'default',
  icon,
  retryButtonText = "Try Again",
  homeButtonText = "Go Home",
  onHome
}: ErrorProps) {
  // Format error message to provide more context when possible
  const formatErrorMessage = (message: string | undefined): string => {
    if (!message) return "An unexpected error occurred";
    if (typeof message !== 'string') {
      return "An unknown error occurred";
    }

    // Check if URL contains a literal :id parameter
    const currentUrl = window.location.href;
    if (currentUrl.includes('/assignment/:id') || message.includes(':id')) {
      return "Invalid assignment ID. The URL contains a placeholder ':id' instead of an actual assignment ID.";
    }

    // Check for specific error patterns
    if (message.includes('Failed to fetch') || message.includes('Network error')) {
      return "Network connection issue. Please check your internet connection and try again.";
    }

    if (message.includes('not found') || message.includes('404')) {
      return "The requested resource could not be found. It may have been deleted or moved.";
    }

    if (message.includes('permission') || message.includes('unauthorized') || message.includes('403')) {
      return "You don't have permission to access this resource. Please log in again or contact support.";
    }

    if (message.includes('timeout')) {
      return "The request timed out. Please try again later when the server is less busy.";
    }

    // If no specific pattern matches, return the original message
    return message;
  };

  const formattedMessage = formatErrorMessage(message);

  const handleRetry = () => {
    if (retry) {
      retry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  // Variant classes
  const variantClasses = {
    default: {
      icon: 'text-destructive',
      title: 'text-gray-900',
      message: 'text-gray-600'
    },
    subtle: {
      icon: 'text-gray-400',
      title: 'text-gray-700',
      message: 'text-gray-500'
    },
    destructive: {
      icon: 'text-red-500',
      title: 'text-red-700',
      message: 'text-red-600'
    }
  };

  const ErrorContent = () => (
    <div className={cn(
      "text-center p-3 md:p-6",
      className
    )}>
      <div className="mb-4">
        {icon || (
          <AlertTriangle 
            className={cn(
              "mx-auto w-10 h-10 md:w-12 md:h-12",
              variantClasses[variant].icon
            )} 
          />
        )}
      </div>
      <h1 className={cn(
        "font-bold mb-2 text-xl md:text-2xl",
        variantClasses[variant].title
      )}>
        {title}
      </h1>
      <p className={cn(
        "mb-6 text-base md:text-lg",
        variantClasses[variant].message
      )}>
        {formattedMessage}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          {retryButtonText}
        </Button>
        {showHomeButton && (
          <Button
            variant="default"
            onClick={handleHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            {homeButtonText}
          </Button>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-3 md:p-4",
        containerClassName
      )}>
        <ErrorContent />
      </div>
    );
  }

  return <ErrorContent />;
} 