import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import VerifySubmissionsView from './VerifySubmissionsView';
import AssignedWorkView from './AssignedWorkView';

export const TeacherAssignments = () => {
  const [activeTab, setActiveTab] = useState<'verify' | 'assigned'>('verify');
  const [filters, setFilters] = useState({
    subject: '',
    grade: '',
    status: '',
    student: ''
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Button onClick={() => navigate('/app/assign')}>
          Assign New Work
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'verify' | 'assigned')}>
        <TabsList>
          <TabsTrigger value="verify">Verify Submissions</TabsTrigger>
          <TabsTrigger value="assigned">Assigned Work</TabsTrigger>
        </TabsList>

        <TabsContent value="verify">
          <VerifySubmissionsView filters={filters} onFilterChange={setFilters} />
        </TabsContent>

        <TabsContent value="assigned">
          <AssignedWorkView />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 