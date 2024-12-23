import { Users, Lightbulb, Book } from 'lucide-react';

interface KeyDetailsProps {
  isTeamProject: boolean;
  isOriginalWork: boolean;
  subject: string;
}

export const KeyDetails = ({ isTeamProject, isOriginalWork, subject }: KeyDetailsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-[#62C59F]" />
          <h3 className="font-medium">Collaboration</h3>
        </div>
        <p className="text-sm text-gray-600">
          {isTeamProject ? "Team Project" : "Individual Work"}
        </p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-5 w-5 text-[#62C59F]" />
          <h3 className="font-medium">Originality</h3>
        </div>
        <p className="text-sm text-gray-600">
          {isOriginalWork ? "Original Work" : "Interpretive Work"}
        </p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Book className="h-5 w-5 text-[#62C59F]" />
          <h3 className="font-medium">Subject Area</h3>
        </div>
        <p className="text-sm text-gray-600">{subject}</p>
      </div>
    </div>
  );
};