import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { NavVariant } from "@/enums/navigation.enum";
import { UserRole } from "@/enums";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";
import { PortfolioFullScreenView } from "@/components/preview/PortfolioFullScreenView";
import { memo } from "react";

interface MainLayoutProps {
  variant?: NavVariant;
  signOut?: () => Promise<void>;
  role?: UserRole;
}

// Memoized MainLayout to prevent unnecessary re-renders
export const MainLayout = memo(function MainLayout({ 
  variant = NavVariant.DEFAULT, 
  signOut, 
  role 
}: MainLayoutProps) {
  const { isPreviewOpen } = usePortfolioPreview();
  
  return (
    <div className="flex flex-col">
      <Navbar variant={variant} signOut={signOut} role={role} />
      <main>
        <Outlet />
      </main>
      
      {/* Only render PortfolioFullScreenView when needed */}
      {isPreviewOpen && <PortfolioFullScreenView />}
    </div>
  );
});
