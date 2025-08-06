import React, { lazy, Suspense, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Loading } from "@/components/ui/loading";
import { logger } from "@/lib/logger";
import { Error } from "@/components/ui/error";
import { useAuthState } from "@/hooks/useAuthState";
import { MainLayout } from "@/components/layouts/MainLayout";
import { NavVariant } from "@/enums/navigation.enum";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryClient } from "@/query-key/client";
import { PortfolioPreviewProvider } from "@/contexts/PortfolioPreviewContext";
import { migrateYoutubeLinksToExternalLinks } from "@/scripts/migrate-youtube-to-external-links";

// Create module-specific logger
const appLogger = logger.forModule("App");

// Lazy loaded components for better performance
const Index = lazy(() => import("@/pages/Index"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const TeacherProfile = lazy(() => import("@/pages/TeacherProfile").then(module => ({ default: module.TeacherProfile })));
const StudentProfile = lazy(() => import("@/pages/StudentProfile").then(module => ({ default: module.StudentProfile })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UpdatePassword = lazy(() => import("@/components/auth/UpdatePassword").then(module => ({ default: module.UpdatePassword })));
const SSOLogin = lazy(() => import("@/pages/SSOLogin"));
// Updated to use default export
const StudentAssignmentForm = lazy(() => import("@/components/assignment/AssignmentForm"));
const TeacherDashboard = lazy(() => import("@/components/teacher/dashboard"));
// Ensure TeacherAssignmentView uses default export
const TeacherAssignmentView = lazy(() => import("@/components/teacher/assignment_view"));
const AssignmentDetailView = lazy(() => import("@/components/assignment/AssignmentDetailView").then(module => ({ default: module.AssignmentDetailView })));
const NotFound = lazy(() => import("@/pages/NotFound"));
const StudentPortfolio = lazy(() => import("@/pages/StudentPortfolio"));

// Loading component for suspense fallback
const SuspenseFallback = () => <Loading fullScreen={true} />;

appLogger.info("QueryClient initialized");

// Main app content with authentication
const AppContent = () => {
  appLogger.debug("Rendering AppContent");
  
  // Use our unified auth hook
  const { user, userRole, isLoading, error, signOut } = useAuthState();
  
  // Run migrations when user is authenticated
  useEffect(() => {
    if (user) {
      // This will automatically apply migrations to any assignment data
      // the user loads, ensuring backward compatibility with YouTube links
      appLogger.debug("User authenticated, assignment data migration will be applied automatically");
    }
  }, [user]);

  if (isLoading) {
    appLogger.debug("Auth loading, showing spinner");
    return <Loading fullScreen />;
  }
  
  if (error) {
    appLogger.error("Authentication error", { error });
    return <Error fullScreen message="Authentication failed. Please try again later." />;
  }
  
  appLogger.debug("Auth complete, creating router", { 
    authenticated: !!user,
    userRole
  });

  // Create the router with access to the auth state
  const router = createBrowserRouter([
    // Common routes (no authentication required)
    {
      path: ROUTES.COMMON.HOME,
      element: <MainLayout variant={NavVariant.DEFAULT} signOut={signOut} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              {user ? (
                <Navigate
                  to={
                    userRole === UserRole.STUDENT
                      ? ROUTES.STUDENT.DASHBOARD
                      : ROUTES.TEACHER.DASHBOARD
                  }
                  replace
                />
              ) : (
                <Index />
              )}
            </Suspense>
          ),
          errorElement: <Error message="An error occurred loading the index page" fullScreen />,
        },
        {
          path: ROUTES.COMMON.UPDATE_PASSWORD,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <UpdatePassword />
            </Suspense>
          ),
          errorElement: <Error message="An error occurred updating your password" fullScreen />,
        },
        {
          path: ROUTES.COMMON.SSO_LOGIN,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <SSOLogin />
            </Suspense>
          ),
          errorElement: <Error message="An error occurred with SSO login" fullScreen />,
        },
      ],
    },
    // Student Portfolio route (public)
    {
      path: ROUTES.PORTFOLIO.STUDENT,
      element: <MainLayout variant={NavVariant.DEFAULT} signOut={signOut} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <StudentPortfolio />
            </Suspense>
          ),
          errorElement: <Error message="An error occurred loading the student portfolio" fullScreen />,
        },
      ],
    },
    // Student routes
    {
      path: ROUTES.STUDENT.DASHBOARD,
      element: <MainLayout variant={NavVariant.AUTH} signOut={signOut} role={user ? UserRole.STUDENT : undefined} />,
      errorElement: <Error message="An error occurred loading the student dashboard" fullScreen />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.STUDENT]} user={user} userRole={userRole}>
                {user && <StudentDashboard user={user} />}
              </ProtectedRoute>
            </Suspense>
          ),
          errorElement: <Error message="An error occurred loading student dashboard content" fullScreen />,
        },
        {
          path: ROUTES.STUDENT.PROFILE,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.STUDENT]} user={user} userRole={userRole}>
                {user && <StudentProfile user={user} />}
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: ROUTES.STUDENT.MANAGE_ASSIGNMENT,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.STUDENT]} user={user} userRole={userRole}>
                {user && <StudentAssignmentForm user={user} />}
              </ProtectedRoute>
            </Suspense>
          ),
        }
      ],
    },
    // Teacher routes
    {
      path: ROUTES.TEACHER.DASHBOARD,
      element: <MainLayout variant={NavVariant.AUTH} signOut={signOut} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.TEACHER]} user={user} userRole={userRole}>
                {user && <TeacherDashboard user={user} />}
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: ROUTES.TEACHER.PROFILE,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.TEACHER]} user={user} userRole={userRole}>
                {user && <TeacherProfile user={user} />}
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: ROUTES.TEACHER.MANAGE_ASSIGNMENT,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.TEACHER]} user={user} userRole={userRole}>
                {user && <TeacherAssignmentView user={user} />}
              </ProtectedRoute>
            </Suspense>
          ),
        },
      ],
    },
    // Shared Assignment routes
    {
      path: ROUTES.ASSIGNMENT.ROOT,
      element: <MainLayout variant={NavVariant.AUTH} signOut={signOut} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <div className="flex items-center justify-center h-full min-h-screen">
              <h1 className="text-2xl font-bold">Coming Soon</h1>
            </div>
          ),
        },
        {
          path: ROUTES.ASSIGNMENT.DETAIL,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <AssignmentDetailView />
            </Suspense>
          ),
        }
      ],
    },
    // Admin routes
    {
      path: ROUTES.ADMIN.ROOT,
      element: <MainLayout variant={NavVariant.AUTH} signOut={signOut} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          path: "dashboard",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]} user={user} userRole={userRole}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: "users",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]} user={user} userRole={userRole}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: "settings",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]} user={user} userRole={userRole}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: "reports",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]} user={user} userRole={userRole}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
      ],
    },
    // NotFound route
    {
      path: "/not-found",
      element: (
        <Suspense fallback={<SuspenseFallback />}>
          <NotFound />
        </Suspense>
      ),
    },
    // Fallback route for any unmatched routes
    {
      path: "*",
      element: (
        <Suspense fallback={<SuspenseFallback />}>
          <NotFound />
        </Suspense>
      ),
    },
  ]);
  
  return <RouterProvider router={router} />;
};

const App: React.FC = () => {
  appLogger.info("App component mounting");
  
  return (
    <ErrorBoundary fallback={<Error fullScreen={true} message="Something went wrong" />}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PortfolioPreviewProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </PortfolioPreviewProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;