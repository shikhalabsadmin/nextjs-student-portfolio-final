import { memo } from "react";
import { ProfileBioProps } from "@/types/student-portfolio";

/**
 * Profile bio component - displays student bio text
 * 
 * UI Visual:
 * ┌─────────────────────────────────────────────────┐
 * │  "Hi! I'm a passionate student who loves..."   │
 * └─────────────────────────────────────────────────┘
 */
function ProfileBio({ bio }: ProfileBioProps) {
  if (!bio) return null;

  return (
    <p className="mt-4 text-base text-gray-900 leading-relaxed">
      {bio}
    </p>
  );
}

export default memo(ProfileBio);
