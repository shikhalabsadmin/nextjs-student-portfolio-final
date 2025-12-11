import { memo } from "react";
import { cn } from "@/lib/utils";
import { ProfileAvatarProps } from "@/types/student-portfolio";

/**
 * Profile avatar component - displays student image or initial fallback
 * 
 * UI Visual:
 * ┌──────────────┐
 * │   ┌──────┐   │
 * │   │ IMG  │   │  ← 80x80 rounded circle (customizable via className)
 * │   │  or  │   │
 * │   │  S   │   │  ← Initial letter if no image
 * │   └──────┘   │
 * └──────────────┘
 * 
 * @example
 * <ProfileAvatar 
 *   image="/avatar.jpg" 
 *   name="John" 
 *   className="h-24 w-24" // Override size
 * />
 */
function ProfileAvatar({ 
  image, 
  name, 
  showInitial, 
  onImageError,
  className 
}: ProfileAvatarProps) {
  return (
    <div className={cn(
      "h-20 w-20 overflow-hidden rounded-full border border-slate-300",
      className
    )}>
      {showInitial ? (
        <div className="h-full w-full flex items-center justify-center bg-transparent text-primary text-2xl font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
      ) : (
        <img
          src={image!}
          alt={`${name}'s profile picture`}
          className="object-cover h-full w-full"
          onError={onImageError}
        />
      )}
    </div>
  );
}

export default memo(ProfileAvatar);
