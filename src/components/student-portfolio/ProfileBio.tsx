import { memo } from "react";
import { cn } from "@/lib/utils";
import { ProfileBioProps } from "@/types/student-portfolio";

/**
 * Profile bio component - displays student bio text
 * 
 * UI Visual:
 * ┌─────────────────────────────────────────────────┐
 * │  "Hi! I'm a passionate student who loves..."   │
 * └─────────────────────────────────────────────────┘
 * 
 * @example
 * <ProfileBio 
 *   bio="Hello world" 
 *   className="text-lg text-blue-600" // Override text styles
 * />
 */
function ProfileBio({ bio, className }: ProfileBioProps) {
  if (!bio) return null;

  return (
    <p className={cn(
      "mt-4 text-base text-gray-900 leading-relaxed",
      className
    )}>
      {bio}
    </p>
  );
}

export default memo(ProfileBio);
