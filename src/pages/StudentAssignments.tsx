import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Filters } from "@/components/assignments/Filters";
import { AssignmentsList } from "@/components/assignments/AssignmentsList";
import { FileText, Plus } from "lucide-react";

export default function StudentAssignments() {
  console.log('StudentAssignments page mounted');
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <Button 
          onClick={() => navigate('/app/submit')}
          className="bg-[#62C59F] hover:bg-[#51b88e]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit New
        </Button>
      </div>

      <Filters />

      <AssignmentsList />
    </div>
  );
} 