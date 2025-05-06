import { User } from "@supabase/supabase-js";
import { useMemo, lazy, Suspense } from "react";
import { Loading } from "@/components/ui/loading";

// Lazy load components
const ProfileCompletionPrompt = lazy(
  () => import("@/components/teacher/dashboard/ProfileCompletionPrompt")
);
const DashboardContent = lazy(
  () => import("@/components/teacher/dashboard/DashboardContent")
);

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

  const renderDashboardContent = () => {
    switch (true) {
      case isProfileComplete:
        return <DashboardContent user={user} />;
      default:
        return <ProfileCompletionPrompt />;
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loading text="Loading dashboard..." />
        </div>
      }
    >
      {renderDashboardContent()}
    </Suspense>
  );
};

export default TeacherDashboard;
