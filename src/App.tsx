import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import AssignmentDetail from '@/pages/AssignmentDetail';
import { RootLayout } from "@/components/layouts/RootLayout";
import Index from "@/pages/Index";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentAssignments from "@/pages/StudentAssignments";
import Submit from "@/pages/Submit";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import ErrorPage from './pages/ErrorPage';
import { FormLayout } from "@/components/layouts/FormLayout";
import { RoleBasedAssignments } from "@/pages/RoleBasedAssignments";
import { AssignmentForm } from "@/pages/AssignmentForm";
import { VerifyAssignment } from "@/pages/VerifyAssignment";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated, userRole } = useAuthState();

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: isAuthenticated ? 
            <Navigate to={`/app/${userRole === 'student' ? 'dashboard' : 'assignments'}`} replace /> : 
            <Index />
        }
      ]
    },
    {
      path: "/app",
      children: [
        {
          element: <AuthLayout />,
          errorElement: <ErrorPage />,
          children: [
            {
              path: "dashboard",
              element: (
                <ProtectedRoute roles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              ),
            },
            {
              path: "assignments",
              element: (
                <ProtectedRoute>
                  <RoleBasedAssignments />
                </ProtectedRoute>
              ),
            },
            {
              path: "assignments/:id",
              element: (
                <ProtectedRoute>
                  <AssignmentDetail />
                </ProtectedRoute>
              ),
            },
            {
              path: "assign",
              element: (
                <ProtectedRoute roles={['teacher']}>
                  <AssignmentForm />
                </ProtectedRoute>
              ),
            },
            {
              path: "verify/:id",
              element: (
                <ProtectedRoute roles={['teacher']}>
                  <VerifyAssignment />
                </ProtectedRoute>
              ),
            }
          ],
        },
        {
          path: "submit",
          element: (
            <ProtectedRoute>
              <FormLayout>
                <Submit />
              </FormLayout>
            </ProtectedRoute>
          ),
        },
        {
          path: "drafts/:id/edit",
          element: (
            <ProtectedRoute>
              <FormLayout>
                <Submit />
              </FormLayout>
            </ProtectedRoute>
          ),
        },
      ],
    }
  ]);

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