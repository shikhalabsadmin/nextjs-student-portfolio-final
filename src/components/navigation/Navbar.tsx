import { useState, useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
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
  GraduationCap,
  Mail,
  Menu,
  X,
  LucideIcon,
  Shield,
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

export function Navbar({
  variant = NavVariant.DEFAULT,
  title,
  logo,
  steps,
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, profile, signOut } = useAuthState();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      window.location.replace(ROUTES.PUBLIC.HOME);
    }
  };

  const handleSignIn = () => {
    const authForm = document.querySelector("#auth-form");
    if (authForm) {
      authForm.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavClick = (to: string) => {
    setIsOpen(false); // Close sheet when nav item is clicked
    navigate(to);
  };

  const renderMobileNav = () => {
    if (!user || variant !== NavVariant.DEFAULT) return null;

    const links = getNavLinks(userRole);

    return (
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 p-0 hover:bg-slate-100 transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {links.map((link) => (
                <Button
                  key={link.to}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavClick(link.to)}
                >
                  {link.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  };

  const renderNavigation = () => {
    if (variant === NavVariant.FORM && steps) {
      return (
        <div className="flex items-center gap-14">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className={`flex items-center gap-2.5 cursor-pointer ${
                  step.isActive ? "text-gray-900" : "text-gray-400"
                }`}
                onClick={step.onClick}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.isActive
                      ? "bg-[#62C59F] text-white"
                      : step.isCompleted
                      ? "bg-[#62C59F]/10 text-[#62C59F]"
                      : "bg-gray-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (variant === NavVariant.PORTFOLIO) {
      return (
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Portfolio</h1>
            <p className="mt-2 text-gray-600">
              Showcase of your academic journey and achievements
            </p>
          </div>
        </div>
      );
    }

    if (variant === NavVariant.AUTH) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
        </div>
      );
    }

    // Default navigation based on user role
    if (!user) {
      return (
        <Button
          onClick={handleSignIn}
          className="bg-[#62C59F] hover:bg-[#51b88e] text-white"
        >
          Sign In
        </Button>
      );
    }

    const links = getNavLinks(userRole);

    return (
      <nav className="hidden lg:flex space-x-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-gray-600 hover:text-gray-900 ${
              location.pathname === link.to ? "text-blue-600 font-medium" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    );
  };

  const defaultLogo = (
    <Link to={ROUTES.PUBLIC.HOME} aria-label="Home">
      <img
        src="/shikha_labs.png"
        alt="Shikha Labs Logo"
        className="w-[32px] h-[42px] lg:w-[42px] lg:h-[56px] object-contain"
      />
    </Link>
  );

  const getRoleIcon = () => {
    switch (userRole) {
      case UserRole.STUDENT:
        return <GraduationCap className="h-4 w-4 text-gray-500 mr-2" />;
      case UserRole.TEACHER:
        return <GraduationCap className="h-4 w-4 text-gray-500 mr-2" />;
      case UserRole.ADMIN:
        return <Shield className="h-4 w-4 text-gray-500 mr-2" />;
      default:
        return <UserCircle className="h-4 w-4 text-gray-500 mr-2" />;
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case UserRole.STUDENT:
        return "Student";
      case UserRole.TEACHER:
        return "Teacher";
      case UserRole.ADMIN:
        return "Administrator";
      default:
        return "Guest";
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 border-b bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side - Logo only */}
        <div>{logo || defaultLogo}</div>

        {/* Right side - Navigation links and user menu */}
        <div className="flex items-center space-x-4">
          {renderNavigation()}
          {renderMobileNav()}
          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="font-semibold">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {profile?.full_name && (
                    <div className="px-2 py-1.5 flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {profile.full_name}
                      </span>
                    </div>
                  )}

                  <div className="px-2 py-1.5 flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{userEmail}</span>
                  </div>

                  <div className="px-2 py-1.5 flex items-center">
                    {getRoleIcon()}
                    <span className="text-sm text-gray-700">
                      {getRoleLabel()}
                    </span>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
