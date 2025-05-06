import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { NavVariant } from "@/enums/navigation.enum";
import { UserRole } from "@/enums";

interface MainLayoutProps {
  variant?: NavVariant;
  signOut?: () => Promise<void>;
  role?: UserRole;
}

export function MainLayout({ variant = NavVariant.DEFAULT, signOut, role }: MainLayoutProps) {
  return (
    <div className="flex flex-col">
      <Navbar variant={variant} signOut={signOut} role={role} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
