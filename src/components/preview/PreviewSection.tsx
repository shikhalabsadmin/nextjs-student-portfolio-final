import { cn } from "@/lib/utils";
import { PreviewSectionProps } from "@/lib/types/preview";

export function PreviewSection({
  title,
  icon,
  children,
  className,
}: PreviewSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-lg text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4 bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
} 