import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

export const DetailSection = ({ 
  title, 
  icon, 
  children, 
  isActive, 
  onToggle 
}: DetailSectionProps) => {
  return (
    <div className="border rounded-lg bg-white mb-4 transition-all duration-200 hover:shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {isActive ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      
      {isActive && (
        <div className="px-6 py-4 border-t">{children}</div>
      )}
    </div>
  );
};