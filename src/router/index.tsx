import React, { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { NavVariant } from "@/enums/navigation.enum";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Error } from "@/components/ui/error";
import { Loading } from "@/components/ui/loading";
import { User } from "@supabase/supabase-js";
import { EnhancedUser } from "@/hooks/useAuthState";
import { AuthenticatedRole } from "@/types/auth";

// Function to convert Supabase User to EnhancedUser
const enhanceUser = (user: User | null, role: UserRole | null): EnhancedUser | null => {
  if (!user || !role) return null;
  return {
    ...user,
    role: role as AuthenticatedRole
  };
};

// Lazy loaded components for better performance
const Index = lazy(() => import("@/pages/Index"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const TeacherProfile = lazy(() => import("@/pages/TeacherProfile").then(module => ({ default: module.TeacherProfile })));
const StudentProfile = lazy(() => import("@/pages/StudentProfile").then(module => ({ default: module.StudentProfile })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UpdatePassword = lazy(() => import("@/components/auth/UpdatePassword").then(module => ({ default: module.UpdatePassword })));
const StudentAssignmentForm = lazy(() => import("@/components/assignment/AssignmentForm"));
const TeacherDashboard = lazy(() => import("@/components/teacher/dashboard"));
const TeacherAssignmentView = lazy(() => import("@/components/teacher/assignment_view"));
const AssignmentDetailView = lazy(() => import("@/components/assignment/AssignmentDetailView").then(module => ({ default: module.AssignmentDetailView })));
const NotFound = lazy(() => import("@/pages/NotFound"));
const StudentPortfolio = lazy(() => import("@/pages/StudentPortfolio"));

// Loading component for suspense fallback
const SuspenseFallback = () => <Loading />;

interface AppRouterProps {
  user: User | null;
  userRole: UserRole | null;
}

export const createAppRouter = (user: User | null, userRole: UserRole | null) => {
  return createBrowserRouter([
    // Common routes (no authentication required)
    {
      path: ROUTES.COMMON.HOME,
      element: <MainLayout variant={NavVariant.DEFAULT} />,
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
      ],
    },
    // Student Portfolio route (public)
    {
      path: ROUTES.PORTFOLIO.STUDENT,
      element: <MainLayout variant={NavVariant.DEFAULT} />,
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
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <Error message="An error occurred loading the student dashboard" fullScreen />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.STUDENT]}>
                <StudentDashboard user={enhanceUser(user, userRole)} />
              </ProtectedRoute>
            </Suspense>
          ),
          errorElement: <Error message="An error occurred loading student dashboard content" fullScreen />,
        },
        {
          path: ROUTES.STUDENT.PROFILE,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.STUDENT]}>
                <StudentProfile user={enhanceUser(user, userRole)} />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: ROUTES.STUDENT.MANAGE_ASSIGNMENT,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.STUDENT]}>
                <StudentAssignmentForm user={enhanceUser(user, userRole)} />
              </ProtectedRoute>
            </Suspense>
          ),
        }
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
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.TEACHER]}>
                <TeacherDashboard user={enhanceUser(user, userRole)} />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: ROUTES.TEACHER.PROFILE,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.TEACHER]}>
                <TeacherProfile user={enhanceUser(user, userRole)} />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: ROUTES.TEACHER.MANAGE_ASSIGNMENT,
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.TEACHER]}>
                <TeacherAssignmentView user={enhanceUser(user, userRole)} />
              </ProtectedRoute>
            </Suspense>
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
      element: <MainLayout variant={NavVariant.AUTH} />,
      errorElement: <Error fullScreen />,
      children: [
        {
          path: "dashboard",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: "users",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: "settings",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          ),
        },
        {
          path: "reports",
          element: (
            <Suspense fallback={<SuspenseFallback />}>
              <ProtectedRoute roles={[UserRole.ADMIN]}>
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
};

export const AppRouter: React.FC<AppRouterProps> = ({ user, userRole }) => {
  const router = createAppRouter(user, userRole);
  return <RouterProvider router={router} />;
};