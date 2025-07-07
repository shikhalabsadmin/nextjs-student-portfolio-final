import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  toggleLabel?: string;
  toggleText?: string;
  onToggle?: (e: React.MouseEvent) => void;
  isSignUp?: boolean;
}

export function AuthLayout({
  children,
  title,
  description,
  toggleLabel,
  toggleText,
  onToggle,
  isSignUp = false
}: AuthLayoutProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - compact for sign up form */}
      <div className={cn(
        "flex-shrink-0",
        isSignUp ? "mb-3" : "mb-4"
      )}>
        <h1 className={cn(
          "text-xl font-semibold tracking-tight",
          isSignUp ? "text-blue-600" : "text-gray-800"
        )}>
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {description}
        </p>
      </div>

      {/* Content area - takes remaining space */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Footer - fixed height */}
      <div className="h-5 mt-auto flex-shrink-0 flex items-center justify-center">
        {toggleLabel && toggleText && onToggle && (
          <p className="text-center text-xs text-gray-500">
            {toggleLabel}
            <button
              onClick={onToggle}
              className="underline hover:text-blue-500 transition-colors ml-1 font-medium"
            >
              {toggleText}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
