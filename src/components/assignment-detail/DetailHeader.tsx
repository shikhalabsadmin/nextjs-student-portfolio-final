import { Button } from '@/components/ui/button';
import { formatSubject } from '@/lib/utils';

interface DetailHeaderProps {
  title: string;
  subject: string;
  artifactType: string;
  month: string;
  artifactUrl: string | null;
}

export const DetailHeader = ({ 
  title, 
  subject, 
  artifactType, 
  month, 
  artifactUrl 
}: DetailHeaderProps) => {
  return (
    <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {formatSubject(subject)}
            </span>
            <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
              {artifactType}
            </span>
            <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
              {month}
            </span>
          </div>
        </div>
        {artifactUrl && (
          <Button 
            variant="outline"
            onClick={() => window.open(artifactUrl, '_blank')}
            className="text-[#62C59F] border-[#62C59F] hover:bg-[#62C59F]/5"
          >
            View Artifact
          </Button>
        )}
      </div>
      
      {artifactUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
          <img 
            src={artifactUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        </div>
      )}
    </div>
  );
};