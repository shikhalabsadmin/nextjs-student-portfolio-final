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

console.log("App.tsx loaded");

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

const App: React.FC = () => {
  const { user, userRole, isLoading } = useAuthState();

  useEffect(() => {
    console.log("App mounted with:", { user, userRole, isLoading });
    initAuth();
  }, []);

  useEffect(() => {
    console.log("App auth state changed:", { user, userRole, isLoading });
  }, [user, userRole, isLoading]);

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
    // Auth routes
    {
      path: ROUTES.AUTH.ROOT,
      element: user ? (
        <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />
      ) : (
        <MainLayout variant={NavVariant.AUTH} />
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          path: "login",
          element: user ? (
            <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />
          ) : (
            <Index />
          ),
        },
        {
          path: "signup",
          element: user ? (
            <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />
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

  console.log("App rendering with:", { user, userRole, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
};

export default App;
