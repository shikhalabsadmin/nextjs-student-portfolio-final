import { useState, useEffect, FC, memo, useCallback } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCircle,
  LogOut,
  Menu,
  X,
  Home,
  BookOpen,
  User,
  Settings,
  BarChart,
  Users,
  FileText,
  Mail,
  GraduationCap,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES, getNavLinks } from "@/config/routes";
import { NavVariant } from "@/enums/navigation.enum";
import { NavbarProps } from "@/types/navigation";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/enums/user.enum";
import { Button } from "@/components/ui/button";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";

// Navigation icons mapping
const NAV_ICONS = {
  Dashboard: Home,
  "My Assignments": FileText,
  Assignments: FileText,
  "My Profile": User,
  Profile: User,
  Users: Users,
  Reports: BarChart,
  Settings: Settings,
  Home: Home,
  Portfolio: BookOpen,
} as const;

// Reusable Tailwind classes for navigation items
const navItemClass = `
  flex items-center gap-2 p-3 rounded-lg cursor-pointer
  transition-all duration-200 ease-in-out
  hover:bg-background hover:scale-105 focus:bg-background focus:outline-none
`;

// Use consistent colors for both mobile and desktop
const activeNavItemClass = "text-primary";
const inactiveNavItemClass = "text-slate-700 hover:text-primary";

export const Navbar: FC<NavbarProps> = ({ logo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, profile, signOut } = useAuthState();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setUserEmail(user?.email || "");
  }, [user]);

  // Handle sign-out with navigation
  const handleSignOut = async () => {
    try {
      // Close any open menus
      setIsOpen(false);

      // Attempt to sign out
      await signOut();

      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "See you again soon!",
        variant: "default",
      });

      // Navigate to home page
      setTimeout(() => {
        window.location.href = ROUTES.COMMON.HOME;
      }, 100);
    } catch (error) {
      console.error("[Navbar] Sign out error:", error);
      toast({
        title: "Failed to log out",
        description:
          "Please try again. If the problem persists, refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Navigate and close mobile menu
  const handleNavClick = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  // Render navigation icon with consistent styling
  const renderNavIcon = (
    label: keyof typeof NAV_ICONS,
    onClick?: () => void,
    isActive: boolean = false
  ) => {
    const Icon = NAV_ICONS[label] || FileText;
    return (
      <Icon
        className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-600"}`}
        onClick={onClick}
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick?.();
          }
        }}
      />
    );
  };

  // User dropdown component for desktop
  const UserDropdown = () => {
    const links = user ? getNavLinks(userRole) : [];

    if (links?.length === 0) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="relative h-10 w-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200 bg-white shadow-sm"
            aria-label="User menu"
            tabIndex={0}
          >
            <UserCircle
              className="h-6 w-6 text-slate-700 hover:text-primary transition-colors"
              aria-label="User profile"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-lg shadow-lg bg-background"
        >
          <DropdownMenuLabel className="font-semibold text-primary">
            Menu
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {links.map((link) => (
            <DropdownMenuItem key={link.to} asChild>
              <Link
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-background"
                    : "text-slate-700 hover:bg-background hover:text-primary"
                }`}
              >
                {renderNavIcon(
                  link.label as keyof typeof NAV_ICONS,
                  undefined,
                  location.pathname === link.to
                )}
                <span>{link.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 cursor-pointer"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Mobile navigation component (horizontal layout)
  const MobileNav = () => {
    const links = user ? getNavLinks(userRole) : [];

    if (links?.length === 0) {
      return null;
    }

    // Find the profile link based on user role
    const profileLink = links.find(link => 
      link.label === "My Profile" || link.label === "Profile"
    );

    return (
      <div className="block lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <div
              className="h-10 w-10 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 shadow-sm"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setIsOpen(!isOpen);
                }
              }}
            >
              {isOpen ? (
                <X className="h-6 w-6 text-slate-800" />
              ) : (
                <Menu className="h-6 w-6 text-slate-800" />
              )}
            </div>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[85vw] max-w-[300px] sm:max-w-[400px] bg-background shadow-xl px-2 py-4"
          >
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold text-primary">
                Menu
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-2 p-2">
              {/* Profile link with special styling if it exists */}
              {profileLink && (
                <div
                  key={profileLink.to}
                  className={`${navItemClass} bg-slate-50 border border-slate-200 rounded-lg ${
                    location.pathname === profileLink.to
                      ? "text-primary border-primary/30 bg-primary/5"
                      : "text-slate-700"
                  }`}
                  onClick={() => handleNavClick(profileLink.to)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleNavClick(profileLink.to);
                    }
                  }}
                >
                  <User className={`h-5 w-5 ${
                    location.pathname === profileLink.to ? "text-primary" : "text-slate-600"
                  }`} />
                  <span className="text-sm font-medium">
                    {profileLink.label}
                  </span>
                </div>
              )}

              {/* Other navigation links */}
              {links
                .filter(link => link.label !== "My Profile" && link.label !== "Profile")
                .map((link) => (
                  <div
                    key={link.to}
                    className={`${navItemClass} ${
                      location.pathname === link.to
                        ? activeNavItemClass
                        : inactiveNavItemClass
                    }`}
                    onClick={() => handleNavClick(link.to)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleNavClick(link.to);
                      }
                    }}
                  >
                    {renderNavIcon(
                      link.label as keyof typeof NAV_ICONS,
                      undefined,
                      location.pathname === link.to
                    )}
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                ))}
              
              {/* Sign out option */}
              {user && (
                <div
                  className={`${navItemClass} text-primary hover:bg-background mt-4`}
                  onClick={handleSignOut}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSignOut();
                    }
                  }}
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    Sign out
                  </span>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  };

  // Student navigation options based on current route
  const StudentNavOptions = memo(function StudentNavOptions() {
    const { openPreview } = usePortfolioPreview();
    
    const handleOpenPortfolioPreview = useCallback(() => {
      if (profile?.id) {
        openPreview(profile.id);
      }
    }, [profile?.id, openPreview]);
    
    if (!user || userRole !== UserRole.STUDENT || !profile) return null;

    return (
      <>
        {location.pathname === ROUTES.STUDENT.DASHBOARD && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex" 
            onClick={handleOpenPortfolioPreview}
          >
            Portfolio Preview
          </Button>
        )}
      </>
    );
  });

  return (
    <header className="sticky top-0 left-0 right-0 border-b bg-background backdrop-blur-sm shadow-sm z-50">
      <div className="flex items-center justify-between px-4 sm:px-5 lg:px-16 py-3 sm:py-4">
        <div>
          {logo || (
            <Link to={ROUTES.COMMON.HOME} aria-label="Home">
              <img
                src="/shikha_labs.png"
                alt="Shikha Labs Logo"
                className="w-[28px] h-[38px] sm:w-[32px] sm:h-[42px] lg:w-[42px] lg:h-[56px] object-contain transition-transform hover:scale-105"
              />
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <div className="hidden sm:block">
                <UserDropdown />
              </div>
              <StudentNavOptions />
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
};
