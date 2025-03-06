import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { NavVariant } from "@/enums/navigation.enum";

interface MainLayoutProps {
  variant?: NavVariant;
}

export function MainLayout({ variant = NavVariant.DEFAULT }: MainLayoutProps) {
  return (
    <div className="flex flex-col">
      <Navbar variant={variant} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
