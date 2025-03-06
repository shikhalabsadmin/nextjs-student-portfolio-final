import { Backpack, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { StudentCardProps } from '@/types/components/studentCard';

 const StudentCard = ({
  name,
  className_name,
  school,
  imageUrl,
  description,
}: StudentCardProps) => {
  const [imageError, setImageError] = useState(false);

  const showInitial = !imageUrl || imageError;

  return (
    <div className="flex flex-col">
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-300">
        {showInitial ? (
          <div className="h-full w-full flex items-center justify-center bg-transparent text-primary text-2xl font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img
            src={imageUrl!}
            alt={`${name}'s profile picture`}
            className="object-cover h-full w-full"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-bold text-primary tracking-tight">{name}</h3>

        <div className="mt-3 flex items-center gap-6">
          <div className="flex items-center gap-1 text-secondary">
            <Backpack className="h-4 w-4" />
            <span>{className_name}</span>
          </div>

          <div className="flex items-center gap-1 text-secondary">
            <GraduationCap className="h-4 w-4" />
            <span>{school}</span>
          </div>
        </div>

        <p className="mt-4 text-base text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default StudentCard;