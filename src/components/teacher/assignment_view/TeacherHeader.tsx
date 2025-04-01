import React from 'react';
import { Button } from '@/components/ui/button';
import { STATUS_DISPLAY_NAMES, STATUS_COLORS } from '@/constants/assignment-status';

interface TeacherHeaderProps {
  title: string;
  studentName?: string;
  subject?: string;
  grade?: string;
  status: string;
  submittedDate?: string;
  canApprove: boolean;
  isApproved: boolean;
  needsRevision: boolean;
  onApprove: () => void;
  openRevisionModal: () => void;
}

export const TeacherHeader = ({
  title,
  studentName,
  subject,
  grade,
  status,
  submittedDate,
  canApprove,
  isApproved,
  needsRevision,
  onApprove,
  openRevisionModal,
}: TeacherHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-200 bg-white">
      <div className="flex flex-col mb-4 sm:mb-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">
          {studentName || 'Unknown Student'}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1 break-words">
          {grade ? `Class ${grade}` : 'No Class'} • {subject || 'No Subject'}
        </p>
      </div>
      
      <div className="flex flex-wrap w-full sm:w-auto gap-2 sm:gap-4">
        {!isApproved && (
          <>
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm text-sm sm:text-base px-3 sm:px-4"
              onClick={openRevisionModal}
            >
              Send for revision
            </Button>
            
            <Button 
              className="flex-1 sm:flex-none bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-sm text-sm sm:text-base px-3 sm:px-4"
              onClick={onApprove}
            >
              Approve Artefact
            </Button>
          </>
        )}
      </div>
    </div>
  );
}; 