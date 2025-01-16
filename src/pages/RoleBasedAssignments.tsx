import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';
import { StudentAssignments } from './StudentAssignments';
import { TeacherAssignments } from './TeacherAssignments';
import { useEffect } from 'react';

export const RoleBasedAssignments = () => {
  const navigate = useNavigate();
  const { userRole } = useAuthState();
  
  useEffect(() => {
    console.log('RoleBasedAssignments mounted with userRole:', userRole);
  }, [userRole]);

  if (!userRole) {
    console.log('RoleBasedAssignments: No userRole, navigating to /');
    navigate('/');
    return null;
  }

  console.log('RoleBasedAssignments rendering:', { userRole });
  
  // Render components directly with keys to maintain identity
  if (userRole === 'TEACHER') {
    return <TeacherAssignments key="teacher" />;
  }
  
  return <StudentAssignments key="student" />;
}; 