import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import Index from "@/pages/Index";
import Submit from "@/pages/Submit";
import Portfolio from "@/pages/Portfolio";
import Assignments from "@/pages/Assignments";
import StudentDashboard from "@/pages/StudentDashboard";
import AssignmentDetail from "@/pages/AssignmentDetail";
import AssignmentTemplates from "@/pages/AssignmentTemplates";
import QuestionManagement from "@/pages/QuestionManagement";
import { RoleSelectionModal } from "@/components/auth/RoleSelectionModal";
import { supabase } from "@/integrations/supabase/client";

interface AppRoutesProps {
  isAuthenticated: boolean | null;
  userRole: string | null;
  showRoleModal: boolean;
  setShowRoleModal: (show: boolean) => void;
}

export const AppRoutes = ({ isAuthenticated, userRole, showRoleModal, setShowRoleModal }: AppRoutesProps) => {
  console.log('AppRoutes rendering:', { isAuthenticated, userRole });

  // If authenticated but no role, show role selection
  if (isAuthenticated && !userRole) {
    return (
      <RoleSelectionModal 
        isOpen={true}
        onRoleSelected={async (role) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase.from('profiles').update({ 
              role: role 
            }).eq('id', user.id);
            
            if (error) {
              console.error('Profile update error:', error);
              return;
            }
            window.location.reload(); // Reload to update state
          }
        }} 
      />
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated && userRole ? (
              userRole === "student" ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/assignments" replace />
              )
            ) : (
              <Index />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && userRole === "student" ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/submit" 
          element={
            isAuthenticated && userRole === "student" ? (
              <Submit />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/portfolio" 
          element={
            isAuthenticated ? (
              <Portfolio />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/assignments" 
          element={
            isAuthenticated && userRole === "teacher" ? (
              <Assignments />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/assignments/:id" 
          element={
            isAuthenticated ? (
              <AssignmentDetail />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/templates" 
          element={
            isAuthenticated && userRole === "teacher" ? (
              <AssignmentTemplates />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/questions" 
          element={
            isAuthenticated && userRole === "teacher" ? (
              <QuestionManagement />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </ErrorBoundary>
  );
};
