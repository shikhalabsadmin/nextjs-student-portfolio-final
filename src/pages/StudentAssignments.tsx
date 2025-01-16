import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AssignmentsList } from "@/components/assignments/AssignmentsList";
import { Plus } from "lucide-react";

export const StudentAssignments = () => {
  const navigate = useNavigate();

  console.log('StudentAssignments rendering');

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">My Assignments</h1>
            <p className="text-base text-gray-500 mt-1">
              Manage and track your academic portfolio
            </p>
          </div>
          <Button 
            onClick={() => navigate('/app/submit')}
            className="bg-[#62C59F] hover:bg-[#51b88e]"
            size="default"
          >
            <Plus className="w-5 h-5 mr-2" />
            Submit New
          </Button>
        </div>

        <AssignmentsList />
      </div>
    </div>
  );
}; 