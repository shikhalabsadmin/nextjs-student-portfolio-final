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
  const { user, userRole, signOut } = useAuthState();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    console.log('[Header] Component mounted with:', { 
      userId: user?.id,
      userRole,
      pathname: location.pathname,
      userEmail,
      userDetails
    });
    return () => {
      console.log('[Header] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[Header] Auth state changed:', { 
      userId: user?.id,
      userRole,
      hasUser: !!user,
      userMetadata: user?.user_metadata
    });
  }, [user, userRole]);

  console.log('[Header] Rendering with:', { 
    userId: user?.id,
    userRole,
    pathname: location.pathname,
    hasUserDetails: !!userDetails,
    userEmail
  });

  // Fetch user details when component mounts
  useEffect(() => {
    const getUserDetails = async () => {
      try {
        console.log('[Header] Fetching user details');
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        console.log('[Header] Auth getUser result:', {
          success: !!currentUser,
          error: userError,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userMetadata: currentUser?.user_metadata
        });

        if (currentUser) {
          setUserEmail(currentUser.email || "");
          
          console.log('[Header] Fetching profile data for user:', currentUser.id);
          const { data, error } = await supabase
            .from('profiles')
            .select(userRole === 'TEACHER' ? 'full_name, teaching_subjects, grade_levels' : 'full_name, grade')
            .eq('id', currentUser.id)
            .single();
            
          console.log('[Header] Profile fetch result:', {
            success: !!data,
            error,
            errorCode: error?.code,
            errorMessage: error?.message,
            data
          });

          if (!error) {
            setUserDetails(data);
          } else {
            console.error('[Header] Profile fetch error:', {
              error,
              context: {
                userId: currentUser.id,
                userRole
              }
            });
          }
        }
      } catch (error) {
        console.error('[Header] Error in getUserDetails:', {
          error,
          context: {
            userId: user?.id,
            userRole
          }
        });
      }
    };

    if (user) {
      getUserDetails();
    }
  }, [user, userRole]);

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
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Portfolio System</h1>
          {user ? (
            <nav className="hidden md:flex space-x-4">
              {userRole === "STUDENT" ? (
                <>
                  <Link 
                    to="/app/dashboard" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/dashboard' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/app/assignments" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/assignments' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    My Assignments
                  </Link>
                  <Link 
                    to="/app/student/profile" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/student/profile' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    My Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/app/assignments" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/assignments' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Review Assignments
                  </Link>
                  <Link 
                    to="/app/templates" 
                    className={`text-gray-600 hover:text-gray-900 ${
                      location.pathname === '/app/templates' ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    Templates
                  </Link>
                  {userRole === 'TEACHER' ? (
                    <>
                      <Link 
                        to="/app/assignments" 
                        className="text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Verify Assignments
                      </Link>
                      <Link 
                        to="/app/teacher/assignments/new" 
                        className="text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Create Assignment
                      </Link>
                      <Link 
                        to="/app/teacher/profile" 
                        className="text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Teaching Profile
                      </Link>
                    </>
                  ) : null}
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
                  {userDetails?.full_name && (
                    <div className="px-2 py-1.5 flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{userDetails.full_name}</span>
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
                  {userRole === 'STUDENT' && userDetails?.grade && (
                    <div className="px-2 py-1.5 flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Grade:</span>
                      <span className="text-sm text-gray-700">
                        {formatGrade(userDetails.grade, false)}
                      </span>
                    </div>
                  )}

                  {userRole === 'TEACHER' && userDetails && (
                    <>
                      {userDetails.teaching_subjects?.length > 0 && (
                        <div className="px-2 py-1.5">
                          <span className="text-sm text-gray-500 block mb-1">Subjects:</span>
                          <span className="text-sm text-gray-700">
                            {getUniqueSubjects(userDetails.teaching_subjects)}
                          </span>
                        </div>
                      )}
                      {userDetails.grade_levels?.length > 0 && (
                        <div className="px-2 py-1.5">
                          <span className="text-sm text-gray-500 block mb-1">Grade Levels:</span>
                          <span className="text-sm text-gray-700">
                            {userDetails.grade_levels.join(', ')}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="text-sm">Sign Out</span>
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
}