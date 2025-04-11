import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { FaChevronLeft } from "react-icons/fa"; // Using Font Awesome Chevron Left icon

// Interface for individual breadcrumb items
interface BreadcrumbItemConfig {
  label: string; // Display text for the breadcrumb
  to?: string; // Optional URL for navigation; if absent, renders as a non-link
  isCurrent?: boolean; // Indicates if this is the current page
}

// Interface for custom styles to be merged with defaults
interface BreadcrumbStyles {
  root?: string; // Styles for the outer container
  container?: string; // Styles for the inner container
  backIcon?: string; // Styles for the back icon
  breadcrumb?: string; // Styles for the Breadcrumb component
  breadcrumbList?: string; // Styles for the BreadcrumbList
  breadcrumbItem?: string; // Styles for the BreadcrumbItem
  link?: string; // Styles for BreadcrumbLink
  page?: string; // Styles for BreadcrumbPage
  separator?: string; // Styles for BreadcrumbSeparator
}

// Props for the GenericBreadcrumb component
interface GenericBreadcrumbProps {
  items: BreadcrumbItemConfig[]; // Array of breadcrumb items to render
  styles?: BreadcrumbStyles; // Optional custom styles to merge with defaults
  hasBackIcon?: boolean; // Optional flag to show/hide the back icon
  backTo?: string; // Optional URL for the back icon link
}

/**
 * A reusable breadcrumb component that renders a dynamic navigation trail.
 * Supports clickable links, current page indicators, and customizable styling
 * via a styles prop that merges with default classes. Uses optional chaining
 * for safe style access with default values. All CSS is configurable via props.
 * @param {GenericBreadcrumbProps} props - Component props
 * @returns {JSX.Element} The rendered breadcrumb component
 */
export function GenericBreadcrumb({
  items,
  styles,
  hasBackIcon = false,
  backTo = "/",
}: GenericBreadcrumbProps) {
  // Render a fallback UI if no items are provided
  if (!items.length) {
    return (
      <div className={cn("py-3 bg-gray-100", styles?.root ?? "")}>
        No breadcrumbs available
      </div>
    );
  }

  return (
    // Outer container with light background, merged with custom root styles
    <div className={cn("", styles?.root ?? "bg-transparent p-2.5")}>
      {/* Inner container for content width constraint, merged with custom container styles */}
      <div className={cn("", styles?.container ?? "container mx-auto")}>
        <div className={cn("flex items-center", styles?.breadcrumb ?? "gap-2")}>
          {/* Optional back icon */}
          {hasBackIcon && (
            <Link to={backTo} className={cn("", styles?.backIcon ?? "mr-0")}>
              <FaChevronLeft className={cn("", styles?.backIcon ?? "h-5 w-5 text-slate-900")} />
            </Link>
          )}
          {/* Breadcrumb component with padding, merged with custom breadcrumb styles */}
          <Breadcrumb className={cn("flex items-center", styles?.breadcrumb ?? "")}>
            <BreadcrumbList className={cn("", styles?.breadcrumbList ?? "!gap-2")}>
              {items.map((item, index) => (
                // Unique key based on label to ensure proper rendering
                <BreadcrumbItem key={item.label} className={cn("", styles?.breadcrumbItem ?? "!gap-2")}>
                  {item.to && !item.isCurrent ? (
                    // Render clickable link for non-current items with a URL, merged with custom link styles
                    <BreadcrumbLink
                      asChild
                      className={cn(
                        "",
                        styles?.link ?? "text-sm text-slate-900 font-normal"
                      )}
                    >
                      <Link to={item.to}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    // Render non-clickable text for current page or items without URL, merged with custom page styles
                    <BreadcrumbPage
                      className={cn(
                        "",
                        styles?.page ?? "text-sm",
                        item.isCurrent
                          ? "bg-transparent text-slate-900 px-2 py-1 rounded-full border-2 border-slate-200"
                          : "text-slate-900"
                      )}
                    >
                      {item.label}
                    </BreadcrumbPage>
                  )}
                  {/* Render separator only between items, merged with custom separator styles */}
                  {index < items.length - 1 && (
                    <BreadcrumbSeparator
                      className={cn("", styles?.separator ?? "text-gray-400 mx-0")}
                    />
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
}