import { cn } from "@/lib/utils";
import { PreviewFieldProps } from "@/lib/types/preview";
import { BadgeCheck } from "lucide-react";
import { memo } from "react";
import { HtmlContent } from "@/components/ui/html-content";

const PreviewField = memo(({ label = "", value, className = "" }: PreviewFieldProps) => {
  if (value === undefined || value === null) return null;

  // Function to detect if a string contains HTML
  const containsHtml = (str: string) => {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  };

  return (
    <div className={cn("space-y-1.5 sm:space-y-2", className)}>
      <p className="text-lg sm:text-xl font-semibold text-slate-900">{label}</p>
      {typeof value === "boolean" ? (
        <p className="text-base sm:text-lg text-slate-700">
          {value ? (
            <span className="flex items-center gap-1 text-green-600">
              <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5" /> Yes
            </span>
          ) : (
            "No"
          )}
        </p>
      ) : Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {value.length > 0 ? (
            value.map((item, i) => (
              <span
                key={i}
                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm sm:text-base font-medium"
              >
                {item || ""}
              </span>
            ))
          ) : (
            <span className="text-base sm:text-lg text-slate-500 italic">None selected</span>
          )}
        </div>
      ) : typeof value === "string" && containsHtml(value) ? (
        <HtmlContent html={value} className="text-slate-700" />
      ) : (
        <p className="text-base sm:text-lg text-slate-700 whitespace-pre-wrap break-words max-w-full overflow-hidden font-normal">
          {String(value) || ""}
        </p>
      )}
    </div>
  );
});

// Add display name for debugging
PreviewField.displayName = "PreviewField";

export { PreviewField }; 