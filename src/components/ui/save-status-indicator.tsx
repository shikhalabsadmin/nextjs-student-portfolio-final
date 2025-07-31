import React from 'react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: 'saved' | 'saving' | 'error' | 'idle';
  show?: boolean;
  className?: string;
}

export function SaveStatusIndicator({ status, show = true, className }: SaveStatusIndicatorProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return {
          text: 'Saving...',
          icon: (
            <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ),
          textColor: 'text-gray-500'
        };
      case 'saved':
        return {
          text: 'Saved',
          icon: (
            <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ),
          textColor: 'text-gray-500'
        };
      case 'error':
        return {
          text: 'Save failed - retrying',
          icon: (
            <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ),
          textColor: 'text-red-500'
        };
      case 'idle':
      default:
        return { text: '', icon: null, textColor: '' };
    }
  };

  const { text, icon, textColor } = getStatusInfo();

  // Don't render anything if no status or hidden
  if (!text || !show) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs font-medium transition-all duration-300 ease-in-out",
      textColor,
      // Smooth fade in/out
      show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
      className
    )}>
      {icon}
      <span>{text}</span>
    </div>
  );
} 