import React from 'react';
import { STATUS_DISPLAY_NAMES, STATUS_COLORS } from '@/constants/assignment-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudentProfile {
  id: string;
  full_name?: string;
  grade?: string;
  email?: string;
  avatar_url?: string;
}

interface TeacherSidebarProps {
  student: StudentProfile | null;
  assignmentStatus: string;
}

export const TeacherSidebar = ({ student, assignmentStatus }: TeacherSidebarProps) => {
  // Get the status display name and color
  const statusDisplay = assignmentStatus in STATUS_DISPLAY_NAMES 
    ? STATUS_DISPLAY_NAMES[assignmentStatus as keyof typeof STATUS_DISPLAY_NAMES] 
    : 'Unknown';
  
  const statusColor = assignmentStatus in STATUS_COLORS 
    ? STATUS_COLORS[assignmentStatus as keyof typeof STATUS_COLORS] 
    : '';

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-2xl font-medium text-gray-900">Artefact</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="bg-[#E6EFFE] rounded-lg p-6">
          <h3 className="text-xl font-medium text-gray-900">Artefact details</h3>
        </div>
      </CardContent>
    </Card>
  );
}; 