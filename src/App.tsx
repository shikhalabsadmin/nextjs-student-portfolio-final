import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthState, initAuth } from "@/hooks/useAuthState";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import AssignmentDetail from '@/pages/AssignmentDetail';
import { RootLayout } from "@/components/layouts/RootLayout";
import Index from "@/pages/Index";
import StudentDashboard from "@/pages/StudentDashboard";
import Submit from "@/pages/Submit";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import ErrorPage from './pages/ErrorPage';
import { FormLayout } from "@/components/layouts/FormLayout";
import { RoleBasedAssignments } from "@/pages/RoleBasedAssignments";
import { AssignmentForm } from "@/pages/AssignmentForm";
import { VerifyAssignment } from "@/pages/VerifyAssignment";
import { TeacherProfile } from "@/pages/TeacherProfile";
import { StudentProfile } from "@/pages/StudentProfile";
import { AssignmentView } from "@/components/assignment-form/AssignmentView";
import ViewAssignment from "@/pages/ViewAssignment";

console.log('App.tsx loaded');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity
    },
  },
});

const App: React.FC = () => {
  const { user, userRole, isLoading } = useAuthState();

  useEffect(() => {
    console.log('App mounted with:', { user, userRole, isLoading });
    initAuth();
  }, []);

  useEffect(() => {
    console.log('App auth state changed:', { user, userRole, isLoading });
  }, [user, userRole, isLoading]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: user ? 
            <Navigate to={`/app/${userRole === 'STUDENT' ? 'dashboard' : 'assignments'}`} replace /> : 
            <Index />
        }
      ]
    },
    {
      path: "/app/submit",
      element: (
        <ProtectedRoute>
          <Submit />
        </ProtectedRoute>
      )
    },
    {
      path: "/app/submit/:id",
      element: (
        <ProtectedRoute>
          <Submit />
        </ProtectedRoute>
      )
    },
    {
      path: "/app/drafts/:id/edit",
      element: (
        <ProtectedRoute>
          <Submit />
        </ProtectedRoute>
      )
    },
    {
      path: "/app",
      element: <AuthLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute roles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          )
        },
        {
          path: "assignments",
          element: (
            <ProtectedRoute>
              <RoleBasedAssignments />
            </ProtectedRoute>
          )
        },
        {
          path: "assignments/:id",
          element: (
            <ProtectedRoute>
              <AssignmentDetail />
            </ProtectedRoute>
          )
        },
        {
          path: "assignments/:id/edit",
          element: (
            <ProtectedRoute>
              <AssignmentForm />
            </ProtectedRoute>
          )
        },
        {
          path: "assignments/:id/view",
          element: (
            <ProtectedRoute>
              <ViewAssignment />
            </ProtectedRoute>
          )
        },
        {
          path: "teacher/assignments/new",
          element: (
            <ProtectedRoute roles={['TEACHER']}>
              <AssignmentForm />
            </ProtectedRoute>
          )
        },
        {
          path: "verify/:id",
          element: (
            <ProtectedRoute roles={['TEACHER']}>
              <VerifyAssignment />
            </ProtectedRoute>
          )
        },
        {
          path: "teacher/profile",
          element: (
            <ProtectedRoute roles={['TEACHER']}>
              <TeacherProfile />
            </ProtectedRoute>
          )
        },
        {
          path: "student/profile",
          element: (
            <ProtectedRoute roles={['STUDENT']}>
              <StudentProfile />
            </ProtectedRoute>
          )
        }
      ]
    }
  ]);

  console.log('App rendering with:', { user, userRole, isLoading });

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