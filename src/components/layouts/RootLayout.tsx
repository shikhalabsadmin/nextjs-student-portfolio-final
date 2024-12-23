import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function RootLayout() {
  const handleSignIn = () => {
    // Find the auth form element and scroll to it
    const authForm = document.querySelector('#auth-form');
    if (authForm) {
      authForm.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Portfolio System</h1>
          <Button 
            onClick={handleSignIn}
            className="bg-[#62C59F] hover:bg-[#51b88e] text-white"
          >
            Sign In
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
} 