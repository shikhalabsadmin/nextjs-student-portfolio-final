import { useState, useEffect, FC } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { NotificationBell } from "@/components/ui/notifications/NotificationBell";
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
  Mail,
  Menu,
  X,
  Home,
  BookOpen,
  User,
  Settings,
  BarChart,
  Users,
  FileText,
  Bell,
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
import { UserRole } from "@/enums/user.enum";
import { NavVariant } from "@/enums/navigation.enum";
import { NavbarProps } from "@/types/navigation";

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

const verticalNavItemClass = `
  flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer
  transition-all duration-200 ease-in-out
  hover:bg-background hover:scale-105 focus:bg-background focus:outline-none
`;

const activeNavItemClass = "text-primary";
const inactiveNavItemClass = "text-secondary hover:text-primary";

export const Navbar: FC<NavbarProps> = ({
  variant = NavVariant.DEFAULT,
  title,
  logo,
  steps,
}) => {
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
      await signOut();
      navigate(ROUTES.PUBLIC.HOME);
    } catch (error) {
      window.location.replace(ROUTES.PUBLIC.HOME);
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
        className={`h-5 w-5 ${isActive ? "text-primary" : "text-secondary"}`}
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

  // Render profile icon with consistent styling
  const renderProfileIcon = () => (
    <UserCircle
      className="h-6 w-6 text-secondary hover:text-primary transition-colors"
      aria-label="User profile"
    />
  );

  // Default logo component
  const DefaultLogo = () => (
    <Link to={ROUTES.PUBLIC.HOME} aria-label="Home">
      <img
        src="/shikha_labs.png"
        alt="Shikha Labs Logo"
        className="w-[32px] h-[42px] lg:w-[42px] lg:h-[56px] object-contain transition-transform hover:scale-105"
      />
    </Link>
  );

  // Desktop navigation component
  const DesktopNav = () => {
    if (variant !== NavVariant.DEFAULT) return null;
    const links = user ? getNavLinks(userRole) : getNavLinks(UserRole.PUBLIC);

    return (
      <div className="hidden lg:flex items-center gap-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`${verticalNavItemClass} ${
              location.pathname === link.to
                ? activeNavItemClass
                : inactiveNavItemClass
            }`}
          >
            {renderNavIcon(
              link.label as keyof typeof NAV_ICONS,
              undefined,
              location.pathname === link.to
            )}
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    );
  };

  // User dropdown component for desktop
  const UserDropdown = () => {
    const links = user ? getNavLinks(userRole) : getNavLinks(UserRole.PUBLIC);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="relative h-10 w-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-background transition-colors"
            aria-label="User menu"
            tabIndex={0}
          >
            {renderProfileIcon()}
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
                    : "text-secondary hover:bg-background hover:text-primary"
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
    const links = user ? getNavLinks(userRole) : getNavLinks(UserRole.PUBLIC);

    return (
      <div className="block lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <div
              className="h-9 w-9 flex items-center justify-center rounded-md transition-colors cursor-pointer hover:bg-background"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setIsOpen(!isOpen);
                }
              }}
            >
              {isOpen ? (
                <X className="h-5 w-5 text-secondary" />
              ) : (
                <Menu className="h-5 w-5 text-secondary" />
              )}
            </div>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] sm:w-[400px] bg-background shadow-xl"
          >
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold text-primary">
                Menu
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2 p-2">
              {links.map((link) => (
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
              {user && (
                <>
                  <div
                    className={`${navItemClass} text-primary hover:bg-background`}
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
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  };

  return (
    <header className="sticky top-0 left-0 right-0 border-b bg-background backdrop-blur-sm shadow-sm z-50">
      <div className="flex items-center justify-between px-5 lg:px-16 py-4">
        <div>{logo || <DefaultLogo />}</div>
        <div className="flex items-center gap-4">
          <DesktopNav />
          {user && (
            <>
              <NotificationBell />
              <div className="hidden lg:block">
                <UserDropdown />
              </div>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
};
