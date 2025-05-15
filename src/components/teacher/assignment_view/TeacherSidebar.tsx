import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for individual tab items
 */
interface TabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: ReactNode;
  styles?: TabItemStyles;
}

/**
 * Custom styles for Tab items
 */
interface TabItemStyles {
  root?: string;
  icon?: string;
  label?: string;
}

/**
 * Individual tab component that handles rendering and click behavior
 */
const Tab: React.FC<TabProps> = ({ 
  label, 
  isActive, 
  onClick, 
  icon,
  styles
}) => (
  <div
    className={cn(
      "text-xs sm:text-sm font-normal text-slate-900 px-3 sm:px-4 py-2 sm:py-3 mb-2 cursor-pointer transition-colors rounded flex items-center gap-2",
      isActive ? "bg-indigo-200" : "hover:bg-indigo-100",
      styles?.root
    )}
    onClick={onClick}
  >
    {icon && <span className={cn(styles?.icon)}>{icon}</span>}
    <span className={cn(styles?.label)}>{label}</span>
  </div>
);

/**
 * Configuration for each tab in the sidebar
 */
interface TabConfig {
  id: string;
  label: string;
  icon?: ReactNode;
}

/**
 * Custom styles for TabSidebar components
 */
interface TabSidebarStyles {
  card?: string;
  header?: string;
  title?: string;
  content?: string;
  tabItem?: TabItemStyles;
}

/**
 * Props for the TabSidebar component
 */
interface TabSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title?: string;
  tabs: TabConfig[];
  className?: string;
  styles?: TabSidebarStyles;
}

/**
 * A reusable sidebar component with tabs
 * 
 * Used to display selectable tabs in a card-based sidebar
 */
const TabSidebar: React.FC<TabSidebarProps> = ({ 
  activeTab,
  setActiveTab,
  title,
  tabs,
  className = "",
  styles
}) => (
  <Card className={cn("w-64 h-max", className, styles?.card)}>
    {title && (
      <CardHeader className={cn("border-b border-slate-200 p-0", styles?.header)}>
        <CardTitle className={cn("text-xs sm:text-sm font-medium text-slate-900 px-4 sm:px-6 py-3 sm:py-4", styles?.title)}>
          {title}
        </CardTitle>
      </CardHeader>
    )}
    <CardContent className={cn("p-4 sm:p-6", styles?.content)}>
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          styles={styles?.tabItem}
        />
      ))}
    </CardContent>
  </Card>
);

export default TabSidebar;
