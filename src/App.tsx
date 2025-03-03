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
import ErrorPage from "./pages/ErrorPage";
import { RoleBasedAssignments } from "@/pages/RoleBasedAssignments";
import { AssignmentForm } from "@/pages/AssignmentForm";
import { VerifyAssignment } from "@/pages/VerifyAssignment";
import { TeacherProfile } from "@/pages/TeacherProfile";
import { StudentProfile } from "@/pages/StudentProfile";
import ViewAssignment from "@/pages/ViewAssignment";
import AdminDashboard from "@/pages/AdminDashboard";

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
    // Public routes
    {
      path: ROUTES.PUBLIC.HOME,
      element: <MainLayout variant={NavVariant.DEFAULT} />,
      errorElement: <ErrorPage />,
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
      ],
    },
    // Student routes
    {
      path: ROUTES.STUDENT.ROOT,
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <StudentProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "submit",
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <Submit />
            </ProtectedRoute>
          ),
        },
        {
          path: "submit/:id",
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <Submit />
            </ProtectedRoute>
          ),
        },
        {
          path: "drafts/:id/edit",
          element: (
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <Submit />
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Teacher routes
    {
      path: ROUTES.TEACHER.ROOT,
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute roles={[UserRole.TEACHER]}>
              <RoleBasedAssignments />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute roles={[UserRole.TEACHER]}>
              <TeacherProfile />
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
      errorElement: <ErrorPage />,
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
      errorElement: <ErrorPage />,
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  DEBUG.log("Rendering main application");
  try {
    return (
      <ErrorBoundary>
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
    throw error; // Re-throw to let ErrorBoundary handle it
  }
};

export default App;
