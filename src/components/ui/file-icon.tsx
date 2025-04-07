import { Image, FileText, Music, Video, FileSpreadsheet, Presentation } from "lucide-react";
import React from "react";

interface FileIconProps {
  type: string;
  className?: string;
}

export function FileIcon({ type, className = "w-4 h-4" }: FileIconProps) {
  const iconProps = {
    className,
    strokeWidth: 2
  };

  switch (type) {
    case 'youtube':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
          <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      );
    case 'image':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
          <Image {...iconProps} className="w-4 h-4 text-blue-600" />
        </div>
      );
    case 'audio':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded">
          <Music {...iconProps} className="w-4 h-4 text-purple-600" />
        </div>
      );
    case 'video':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-pink-50 rounded">
          <Video {...iconProps} className="w-4 h-4 text-pink-600" />
        </div>
      );
    case 'pdf':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
          <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
        </div>
      );
    case 'excel':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded">
          <FileSpreadsheet {...iconProps} className="w-4 h-4 text-green-600" />
        </div>
      );
    case 'powerpoint':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded">
          <Presentation {...iconProps} className="w-4 h-4 text-orange-600" />
        </div>
      );
    case 'doc':
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
          <FileText {...iconProps} className="w-4 h-4 text-blue-600" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded">
          <FileText {...iconProps} className="w-4 h-4 text-gray-600" />
        </div>
      );
  }
} 