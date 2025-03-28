import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useAuthState, initAuth } from "@/hooks/useAuthState";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import AssignmentDetail from "@/pages/AssignmentDetail";
import { MainLayout } from "@/components/layouts/MainLayout";
import Index from "@/pages/Index";
import StudentDashboard from "@/pages/StudentDashboard";
import Submit from "@/pages/Submit";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NavVariant } from "@/enums/navigation.enum";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";
import { Error } from "@/components/ui/error";
import { Loading } from "@/components/ui/loading";
import { RoleBasedAssignments } from "@/pages/RoleBasedAssignments";
import { AssignmentForm } from "@/pages/AssignmentForm";
import { VerifyAssignment } from "@/pages/VerifyAssignment";
import { TeacherProfile } from "@/pages/TeacherProfile";
import { StudentProfile } from "@/pages/StudentProfile";
import ViewAssignment from "@/pages/ViewAssignment";
import AdminDashboard from "@/pages/AdminDashboard";
import { UpdatePassword } from "@/components/auth/UpdatePassword";
import StudentAssignmentForm from "@/components/assignment/AssignmentForm";
import TeacherDashboard from "@/components/teacher/dashboard";

// Debug utility enabled in development
const DEBUG = {
  enabled: process.env.NODE_ENV === "development",
  log: (message: string, data?: unknown) =>
    DEBUG.enabled && console.log(`[App] ${message}`, data ?? ""),
  error: (message: string, error?: unknown) =>
    DEBUG.enabled && console.error(`[App Error] ${message}`, error ?? ""),
};

DEBUG.log("App.tsx loaded");

// QueryClient initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  },
});

DEBUG.log("QueryClient initialized", {
  config: queryClient.getDefaultOptions(),
});

const App: React.FC = () => {
  const { user, userRole, isLoading } = useAuthState();

  DEBUG.log("App component mounted", { user, userRole, isLoading });

  useEffect(() => {
    DEBUG.log("Initializing auth");
    try {
      initAuth();
      DEBUG.log("Auth initialized successfully");
    } catch (error) {
      DEBUG.error("Failed to initialize auth", error);
    }
  }, []);

  // Router configuration
  const router = createBrowserRouter([
    // Common routes (no authentication required)
    {
      path: ROUTES.COMMON.HOME,
      element: <MainLayout variant={NavVariant.DEFAULT} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: user ? (
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
          ),
        },
        {
          path: ROUTES.COMMON.UPDATE_PASSWORD,
          element: <UpdatePassword />,
        },
      ],
    },
    // Student routes
    {
      path: ROUTES.STUDENT.DASHBOARD,
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <StudentDashboard user={user} />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.STUDENT.PROFILE,
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <StudentProfile user={user} />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.STUDENT.MANAGE_ASSIGNMENT,
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <StudentAssignmentForm user={user} />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.STUDENT.FEEDBACK_ASSIGNMENT,
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <div>
                <h1>Feedback Assignment</h1>
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.STUDENT.VERIFIED_ASSIGNMENT,
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <div>
                <h1>Verified Assignment</h1>
              </div>
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Teacher routes
    {
      path: ROUTES.TEACHER.DASHBOARD,
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute roles={[UserRole.TEACHER]}>
              <TeacherDashboard user={user} />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute roles={[UserRole.TEACHER]}>
              <TeacherProfile user={user} />
            </ProtectedRoute>
          ),
        },
        {
          path: "assignments/new",
          element: (
            <ProtectedRoute roles={[UserRole.TEACHER]}>
              <AssignmentForm />
            </ProtectedRoute>
          ),
        },
        {
          path: "verify/:id",
          element: (
            <ProtectedRoute roles={[UserRole.TEACHER]}>
              <VerifyAssignment />
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Shared Assignment routes
    {
      path: ROUTES.ASSIGNMENT.ROOT,
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute>
              <RoleBasedAssignments />
            </ProtectedRoute>
          ),
        },
        {
          path: ":id",
          element: (
            <ProtectedRoute>
              <AssignmentDetail />
            </ProtectedRoute>
          ),
        },
        {
          path: ":id/edit",
          element: (
            <ProtectedRoute>
              <AssignmentForm />
            </ProtectedRoute>
          ),
        },
        {
          path: ":id/view",
          element: (
            <ProtectedRoute>
              <ViewAssignment />
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Admin routes
    {
      path: ROUTES.ADMIN.ROOT,
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "users",
          element: (
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "settings",
          element: (
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "reports",
          element: (
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ]);

  DEBUG.log("Router created", { routes: ROUTES });

  // Render logic
  DEBUG.log("Preparing to render", { user, userRole, isLoading });

  if (isLoading) {
    DEBUG.log("Rendering loading state");
    return <Loading fullScreen />;
  }

  DEBUG.log("Rendering main application");
  try {
    return (
      <ErrorBoundary fallback={<Error fullScreen />}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    DEBUG.error("Failed to render application", error);
    throw error;
  }
};

export default App;
