import { User } from "@supabase/supabase-js";
import { useMemo } from "react";
import ProfileCompletionPrompt from "./ProfileCompletionPrompt";
import DashboardContent from "./DashboardContent";

interface TeacherData {
  grade_levels?: string[];
  teaching_subjects?: { subject: string; grade: string }[];
}

type UserWithTeacherData = User & TeacherData;

const TeacherDashboard = ({ user }: { user: UserWithTeacherData }) => {
  const isProfileComplete = useMemo(
    () =>
      Boolean(user?.grade_levels?.length && user?.teaching_subjects?.length),
    [user?.grade_levels, user?.teaching_subjects]
  );

  return isProfileComplete ? <DashboardContent user={user} /> : <ProfileCompletionPrompt />;
};

export default TeacherDashboard;
