import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { NavVariant } from "@/enums/navigation.enum";

interface MainLayoutProps {
  variant?: NavVariant;
  signOut?: () => Promise<void>;
}

export function MainLayout({ variant = NavVariant.DEFAULT, signOut }: MainLayoutProps) {
  return (
    <div className="flex flex-col">
      <Navbar variant={variant} signOut={signOut} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
