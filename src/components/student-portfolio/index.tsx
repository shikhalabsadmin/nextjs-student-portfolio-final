import { memo } from "react";
import ProfileAvatar from "./ProfileAvatar";
import ProfileInfo from "./ProfileInfo";
import ProfileBio from "./ProfileBio";
import AssignmentsGrid from "./AssignmentsGrid";
import { StudentPortfolioViewProps } from "@/types/student-portfolio";

/**
 * StudentPortfolioView - Composes all portfolio UI components
 * This is a presentational component - receives all data via props
 * 
 * UI Visual:
 * ┌────────────────────────────────────────────────────────────┐
 * │  container mx-auto px-4 pt-8                               │
 * │  ┌──────────────┐                                          │
 * │  │ ProfileAvatar │  ← Avatar image or initial              │
 * │  └──────────────┘                                          │
 * │                                                            │
 * │  ─────────────────────────────────────────────────────     │
 * │  Gradient background starts here (absolute positioned)    │
 * │  ─────────────────────────────────────────────────────     │
 * │                                                            │
 * │  ┌──────────────────────────────────────────────────────┐ │
 * │  │ ProfileInfo                                          │ │
 * │  │ Name + Grade + School                                │ │
 * │  └──────────────────────────────────────────────────────┘ │
 * │                                                            │
 * │  ┌──────────────────────────────────────────────────────┐ │
 * │  │ ProfileBio                                           │ │
 * │  │ Bio text                                             │ │
 * │  └──────────────────────────────────────────────────────┘ │
 * │                                                            │
 * │  ┌──────────────────────────────────────────────────────┐ │
 * │  │ AssignmentsGrid                                      │ │
 * │  │ Grid of assignment cards                             │ │
 * │  └──────────────────────────────────────────────────────┘ │
 * └────────────────────────────────────────────────────────────┘
 */
function StudentPortfolioView({
  // Avatar props
  image,
  name,
  showInitial,
  onImageError,
  // Info props
  grade,
  schoolName,
  // Bio props
  bio,
  // Grid props
  assignments,
  isBusy,
  onAssignmentClick,
  previewMode,
}: StudentPortfolioViewProps) {
  return (
    <>
      {/* Avatar section */}
      <div className="container mx-auto px-4 pt-8">
        <ProfileAvatar
          image={image}
          name={name}
          showInitial={showInitial}
          onImageError={onImageError}
        />
      </div>

      {/* Gradient background */}
      <div className="absolute left-0 right-0 top-[128px] bottom-0 bg-gradient-to-b from-gray-50 via-gray-100 to-white" />

      {/* Main content */}
      <div className="relative container mx-auto px-4">
        <ProfileInfo
          name={name}
          grade={grade}
          schoolName={schoolName}
        />

        <ProfileBio bio={bio} />

        <AssignmentsGrid
          assignments={assignments}
          isBusy={isBusy}
          onAssignmentClick={onAssignmentClick}
          previewMode={previewMode}
        />
      </div>
    </>
  );
}

export default memo(StudentPortfolioView);
