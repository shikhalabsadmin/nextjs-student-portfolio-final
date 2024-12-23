import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { AuthLayout } from "./AuthLayout";
import { FormLayout } from "./FormLayout";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import Index from "@/pages/Index";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentAssignments from "@/pages/StudentAssignments";
import AssignmentDetail from "@/pages/AssignmentDetail";
import Submit from "@/pages/Submit";
import ErrorPage from "@/pages/ErrorPage";
import { useAuthState } from "@/hooks/useAuthState";

export const AppRouter = () => {
  const { isAuthenticated, userRole } = useAuthState();
  const navigate = useNavigate();

  const handleSubmitNew = () => {
    localStorage.removeItem('assignment_draft');
    localStorage.removeItem('assignment_draft_step');
    navigate('/app/submit');
  };

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route
          index
          element={
            isAuthenticated ? (
              <Navigate
                to={`/app/${userRole === 'student' ? 'dashboard' : 'assignments'}`}
                replace
              />
            ) : (
              <Index />
            )
          }
        />
      </Route>
      <Route path="/app">
        <Route element={<AuthLayout />} errorElement={<ErrorPage />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="assignments"
            element={
              <ProtectedRoute>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="assignments/:id"
            element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="submit"
          element={
            <ProtectedRoute>
              <FormLayout>
                <Submit />
              </FormLayout>
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}; 