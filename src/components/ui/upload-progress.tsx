import React, { useEffect, useState } from 'react';

interface UploadProgressProps {
  fileName: string;
  progress: number;
}

export function UploadProgress({ fileName, progress }: UploadProgressProps) {
  // Use internal state to track progress with animation
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Log the progress value for debugging
  useEffect(() => {
  
    
    // Smoothly update the progress
    if (progress > displayProgress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => {
          const newValue = Math.min(progress, prev + 1);
          return newValue;
        });
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress, fileName]);
  
  // Ensure progress is between 0 and 100
  const safeProgress = Math.max(0, Math.min(100, Math.round(displayProgress)));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs text-gray-500 truncate">
          {safeProgress < 100 ? `Uploading (${safeProgress}%)` : "Upload complete"}
        </p>
        <span className="text-xs font-medium text-gray-700">{safeProgress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-200 ${
            safeProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
          }`} 
          style={{ width: `${safeProgress}%` }}
        ></div>
      </div>
    </div>
  );
} 