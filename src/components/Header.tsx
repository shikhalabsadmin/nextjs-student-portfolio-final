import { useState, useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/notifications/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, GraduationCap, Mail } from "lucide-react";

export const Header = () => {
  const { isAuthenticated, userRole } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any>(null);

  // Fetch user details when component mounts
  useEffect(() => {
    const getUserDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        // Fetch additional details based on role
        if (userRole === 'teacher') {
          const { data } = await supabase
            .from('profiles')
            .select('subjects, grade_levels')
            .eq('id', user.id)
            .single();
          setUserDetails(data);
        } else if (userRole === 'student') {
          const { data } = await supabase
            .from('profiles')
            .select('grade')
            .eq('id', user.id)
            .single();
          setUserDetails(data);
        }
      }
    };

    if (isAuthenticated) {
      getUserDetails();
    }
  }, [isAuthenticated, userRole]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Update the navigation links
  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard' },
    { name: 'Assignments', href: '/app/assignments' }
  ];

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Portfolio System</h1>
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-4">
              {userRole === "student" ? (
                <>
                  <a 
                    href="/app/dashboard" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/dashboard' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/app/assignments" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/assignments' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    My Assignments
                  </a>
                </>
              ) : (
                <>
                  <a 
                    href="/app/assignments" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/assignments' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Review Assignments
                  </a>
                  <a 
                    href="/app/templates" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/templates' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Templates
                  </a>
                </>
              )}
            </nav>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Email for all users */}
                  <div className="px-2 py-1.5 flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{userEmail}</span>
                  </div>

                  {/* Role for all users */}
                  <div className="px-2 py-1.5 flex items-center text-sm">
                    <GraduationCap className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 capitalize">{userRole}</span>
                  </div>

                  {/* Role-specific information */}
                  {userRole === 'student' && userDetails && (
                    <div className="px-2 py-1.5 text-sm">
                      <span className="text-gray-500">Grade:</span>
                      <span className="ml-2 text-gray-700">{userDetails.grade}</span>
                    </div>
                  )}

                  {userRole === 'teacher' && userDetails && (
                    <>
                      <div className="px-2 py-1.5 text-sm">
                        <span className="text-gray-500">Subjects:</span>
                        <span className="ml-2 text-gray-700">
                          {userDetails.subjects?.join(', ') || 'Not set'}
                        </span>
                      </div>
                      <div className="px-2 py-1.5 text-sm">
                        <span className="text-gray-500">Grade Levels:</span>
                        <span className="ml-2 text-gray-700">
                          {userDetails.grade_levels?.join(', ') || 'Not set'}
                        </span>
                      </div>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="default"
              className="bg-[#62C59F] hover:bg-[#51b88e] transition-colors text-white"
              onClick={() => navigate('/')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};