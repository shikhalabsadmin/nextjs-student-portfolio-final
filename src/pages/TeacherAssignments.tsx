import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VerifySubmissionsView } from '@/components/teacher/VerifySubmissionsView';
import { useAuthState } from '@/hooks/useAuthState';

export const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuthState();

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Redirect if not a teacher
  if (!isLoading && userRole !== 'TEACHER') {
    navigate('/app/dashboard');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
      </div>

      <VerifySubmissionsView />
    </div>
  );
}; 