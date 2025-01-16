import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { useEffect } from "react";

export function AuthLayout() {
  useEffect(() => {
    console.log('AuthLayout mounted');
    return () => {
      console.log('AuthLayout unmounted');
    };
  }, []);

  console.log('AuthLayout rendering');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
} 