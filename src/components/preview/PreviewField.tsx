import { cn } from "@/lib/utils";
import { PreviewFieldProps } from "@/lib/types/preview";
import { BadgeCheck } from "lucide-react";

export function PreviewField({ label, value, className }: PreviewFieldProps) {
  if (value === undefined || value === null) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {typeof value === "boolean" ? (
        <p className="text-sm text-gray-900 font-medium">
          {value ? (
            <span className="flex items-center gap-1 text-green-600">
              <BadgeCheck className="h-4 w-4" /> Yes
            </span>
          ) : (
            "No"
          )}
        </p>
      ) : Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-900 whitespace-pre-wrap break-words max-w-full overflow-hidden">{value}</p>
      )}
    </div>
  );
} 