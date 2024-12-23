export const RoleBasedAssignments = () => {
  const { userRole } = useAuthState();

  if (userRole === 'teacher') {
    return <TeacherAssignments />;
  }

  return <StudentAssignments />;
}; 