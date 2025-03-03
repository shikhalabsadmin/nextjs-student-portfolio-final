import { useState, useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/notifications/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { formatSubject, formatGrade } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, GraduationCap, Mail } from "lucide-react";
import { Link } from "react-router-dom";

// Add this helper function to get unique subjects
const getUniqueSubjects = (teachingSubjects: { subject: string; grade: string }[] | null) => {
  if (!teachingSubjects) return [];
  return [...new Set(teachingSubjects.map(ts => formatSubject(ts.subject)))]
    .join(', ');
};

export function Header() {
  const navigate = useNavigate();
  const { user, userRole, profile, signOut } = useAuthState();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      console.log('[Header] Starting sign out process');
      await signOut();
    } catch (error) {
      console.error('[Header] Error during sign out:', error);
      // Force reload on error
      window.location.replace('/auth/login');
    }
  };

  // Update the navigation links
  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard' },
    { name: 'Assignments', href: '/app/assignments' }
  ];

  return (
    <header className="relative z-20 border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Portfolio System</h1>
          {user ? (
            <nav className="hidden md:flex space-x-4 pointer-events-auto">
              {userRole === "STUDENT" ? (
                <>
                  <a 
                    href="/app/dashboard" 
                    className={`text-gray-600 hover:text-gray-900 cursor-pointer ${
                      location.pathname === '/app/dashboard' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/app/assignments" 
                    className={`text-gray-600 hover:text-gray-900 cursor-pointer ${
                      location.pathname === '/app/assignments' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    My Assignments
                  </a>
                  <a 
                    href="/app/student/profile" 
                    className={`text-gray-600 hover:text-gray-900 cursor-pointer ${
                      location.pathname === '/app/student/profile' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    My Profile
                  </a>
                </>
              ) : (
                <>
                  <a 
                    href="/app/assignments" 
                    className={`text-gray-600 hover:text-gray-900 cursor-pointer ${
                      location.pathname === '/app/assignments' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Assignments
                  </a>
                  {userRole === 'TEACHER' && (
                    <a 
                      href="/app/teacher/profile" 
                      className={`text-gray-600 hover:text-gray-900 cursor-pointer ${
                        location.pathname === '/app/teacher/profile' ? 'text-blue-600 font-medium' : ''
                      }`}
                    >
                      Profile
                    </a>
                  )}
                </>
              )}
            </nav>
          ) : null}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Name for all users */}
                  {profile?.full_name && (
                    <div className="px-2 py-1.5 flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{profile.full_name}</span>
                    </div>
                  )}
                  
                  {/* Email for all users */}
                  <div className="px-2 py-1.5 flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{userEmail}</span>
                  </div>

                  {/* Role for all users */}
                  <div className="px-2 py-1.5 flex items-center">
                    <GraduationCap className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">
                      {userRole === 'STUDENT' ? 'Student' : 'Teacher'}
                    </span>
                  </div>

                  {/* Role-specific information */}
                  {userRole === 'STUDENT' && profile?.grade && (
                    <div className="px-2 py-1.5 flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Grade:</span>
                      <span className="text-sm text-gray-700">
                        {formatGrade(profile.grade, false)}
                      </span>
                    </div>
                  )}

                  {userRole === 'TEACHER' && profile && (
                    <>
                      {profile.teaching_subjects?.length > 0 && (
                        <div className="px-2 py-1.5">
                          <div className="text-sm text-gray-500 mb-1">Teaching:</div>
                          <div className="text-sm text-gray-700">
                            {getUniqueSubjects(profile.teaching_subjects)}
                          </div>
                        </div>
                      )}
                      {profile.grade_levels?.length > 0 && (
                        <div className="px-2 py-1.5">
                          <div className="text-sm text-gray-500 mb-1">Grades:</div>
                          <div className="text-sm text-gray-700">
                            {profile.grade_levels.map(g => formatGrade(g, false)).join(', ')}
                          </div>
                        </div>
                      )}
                    </>
                  )}

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