import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  LogOut,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { createClient } from '@supabase/supabase-js';

// Create admin client that bypasses RLS for admin dashboard
// Note: In production, this should be done via a secure API endpoint
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AdminDashboardContentProps {
  onLogout: () => void;
}

interface StudentWithAssignments {
  id: string;
  full_name: string;
  email: string;
  grade: string;
  assignments: {
    id: string;
    title: string;
    subject: string;
    status: string;
    created_at: string;
    submitted_at?: string;
  }[];
}

interface StudentSummary {
  id: string;
  full_name: string;
  email: string;
  totalAssignments: number;
  completedAssignments: number;
  activeAssignments: number; // submitted + needs revision
  completionRate: number;
  lastActivity?: string;
  status: 'excellent' | 'good' | 'needs-attention' | 'inactive';
}

interface GradeSection {
  grade: string;
  students: StudentSummary[];
  totalStudents: number;
  totalAssignments: number;
  completedAssignments: number;
  averageCompletion: number;
  activeStudents: number;
}

export function AdminDashboardContent({ onLogout }: AdminDashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set(['10', '9', '8'])); // Default expanded
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set()); // Track expanded students

  // Fetch all students with shikhaacademy.org email and their assignments
  const { data: studentsData, isLoading, error } = useQuery({
    queryKey: ['admin-shikha-students'],
    queryFn: async () => {
      // First, get students with shikhaacademy.org emails (including those without grades)
      const { data: students, error: studentsError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, grade')
        .like('email', '%shikhaacademy.org%')
        .eq('role', 'STUDENT')
        .order('grade')
        .order('full_name');

      if (studentsError) throw studentsError;

      // Then, get assignments for these students
      const studentIds = students?.map(s => s.id) || [];
      
      console.log('DEBUG - Fetching assignments for', studentIds.length, 'students');
      
      let allAssignments: any[] = [];
      if (studentIds.length > 0) {
        // Fetch ALL assignments - using admin client bypasses RLS
        const { data: assignments, error: assignmentsError, count } = await supabaseAdmin
          .from('assignments')
          .select('id, title, subject, status, created_at, submitted_at, student_id', { count: 'exact' })
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(10000); // Set explicit high limit

        if (assignmentsError) {
          console.error('DEBUG - Assignment fetch error:', assignmentsError);
          throw assignmentsError;
        }
        
        allAssignments = assignments || [];
        
        // Debug: Log what we actually fetched
        console.log('DEBUG - Assignments fetched:', allAssignments.length, 'Total in DB:', count);
        console.log('DEBUG - Status breakdown:', allAssignments.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {}));
      }

      // Combine students with their assignments
      const studentsWithAssignments: StudentWithAssignments[] = students?.map(student => ({
        ...student,
        assignments: allAssignments.filter(a => a.student_id === student.id)
      })) || [];

      return studentsWithAssignments;
    }
  });

  // Process data into simplified student summaries
  const processedStudents: StudentSummary[] = studentsData?.map(student => {
    const assignments = student.assignments || [];
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'APPROVED').length;
    const activeAssignments = assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'NEEDS_REVISION').length;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
    
    // Debug: Simple logging for key students
    if (student.full_name === 'dhanraj.g') {
      console.log('DEBUG - Sample student assignments:', totalAssignments);
    }
    
    // Get last activity date
    const lastActivity = assignments.length > 0 
      ? assignments.reduce((latest, assignment) => {
          const activityDate = assignment.submitted_at || assignment.created_at;
          return !latest || new Date(activityDate) > new Date(latest) ? activityDate : latest;
        }, '')
      : undefined;

    // Determine student status
    let status: StudentSummary['status'];
    if (totalAssignments === 0) {
      status = 'inactive';
    } else if (completionRate >= 80) {
      status = 'excellent';
    } else if (completionRate >= 50 || activeAssignments > 0) {
      status = 'good';
    } else {
      status = 'needs-attention';
    }

    return {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      totalAssignments,
      completedAssignments,
      activeAssignments,
      completionRate,
      lastActivity,
      status
    };
  }) || [];

  // Separate students with and without grades
  const studentsWithGrades = studentsData?.filter(s => s.grade) || [];
  const studentsWithoutGrades = studentsData?.filter(s => !s.grade) || [];

  // Group students by grade
  const gradeSections: GradeSection[] = studentsWithGrades.length > 0 ? 
    Object.values(
      studentsWithGrades.reduce<Record<string, GradeSection>>((acc, student) => {
        const grade = student.grade!;
        if (!acc[grade]) {
          acc[grade] = {
            grade,
            students: [],
            totalStudents: 0,
            totalAssignments: 0,
            completedAssignments: 0,
            averageCompletion: 0,
            activeStudents: 0
          };
        }

        const studentSummary = processedStudents.find(s => s.id === student.id);
        if (studentSummary) {
          acc[grade].students.push(studentSummary);
          acc[grade].totalStudents++;
          acc[grade].totalAssignments += studentSummary.totalAssignments;
          acc[grade].completedAssignments += studentSummary.completedAssignments;
          if (studentSummary.totalAssignments > 0) {
            acc[grade].activeStudents++;
          }
        }

        return acc;
      }, {})
    ).map(section => ({
      ...section,
      averageCompletion: section.activeStudents > 0 
        ? Math.round((section.completedAssignments / section.totalAssignments) * 100) || 0
        : 0,
      students: section.students
        .filter(student => 
          (student.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => b.completionRate - a.completionRate) // Sort by completion rate descending
    }))
    .sort((a, b) => {
      // Sort grades naturally
      const parseGrade = (g: string) => {
        const num = parseInt(g);
        if (isNaN(num)) return g;
        return num;
      };
      return String(parseGrade(a.grade)).localeCompare(String(parseGrade(b.grade)), undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    }) : [];

  // Calculate overall stats
  const totalStats = {
    totalStudents: processedStudents.length,
    totalAssignments: processedStudents.reduce((sum, student) => sum + student.totalAssignments, 0),
    totalCompleted: processedStudents.reduce((sum, student) => sum + student.completedAssignments, 0),
    totalActive: processedStudents.reduce((sum, student) => sum + student.activeAssignments, 0),
    overallCompletion: processedStudents.length > 0 
      ? Math.round((processedStudents.reduce((sum, student) => sum + student.completedAssignments, 0) / processedStudents.reduce((sum, student) => sum + student.totalAssignments, 0)) * 100) || 0
      : 0,
    excellentStudents: processedStudents.filter(s => s.status === 'excellent').length,
    needsAttentionStudents: processedStudents.filter(s => s.status === 'needs-attention').length
  };

  // Debug: Log key metrics
  console.log('Dashboard Stats - Assignments shown:', totalStats.totalAssignments, 'Approved:', totalStats.totalCompleted);

  // Toggle grade expansion
  const toggleGradeExpansion = (grade: string) => {
    const newExpanded = new Set(expandedGrades);
    if (newExpanded.has(grade)) {
      newExpanded.delete(grade);
    } else {
      newExpanded.add(grade);
    }
    setExpandedGrades(newExpanded);
  };

  // Toggle student expansion
  const toggleStudentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // Get assignment status styling
  const getAssignmentStatusDisplay = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { color: 'bg-gray-100 text-gray-700', text: 'Draft' };
      case 'SUBMITTED':
        return { color: 'bg-blue-100 text-blue-700', text: 'Submitted' };
      case 'NEEDS_REVISION':
        return { color: 'bg-yellow-100 text-yellow-700', text: 'Needs Revision' };
      case 'APPROVED':
        return { color: 'bg-green-100 text-green-700', text: 'Approved' };
      default:
        return { color: 'bg-gray-100 text-gray-700', text: status };
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No activity';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return <Error message="Failed to load admin dashboard data" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Shikha Academy
                </h1>
                <p className="text-sm text-gray-600">Student Progress Dashboard</p>
              </div>
            </div>
            
            {/* Key Insights */}
            <div className="hidden md:flex items-center space-x-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalStats.totalAssignments}</div>
                <div className="text-gray-500">Total Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalStats.totalCompleted}</div>
                <div className="text-gray-500">Approved</div>
              </div>
            </div>

            <Button 
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 border-blue-200 focus:border-blue-500 bg-white/60 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Grade Sections */}
        <div className="space-y-4">
          {gradeSections.map((gradeSection) => (
            <Card key={gradeSection.grade} className="overflow-hidden border-blue-100 bg-white/70 backdrop-blur-sm">
              {/* Grade Header */}
              <button
                onClick={() => toggleGradeExpansion(gradeSection.grade)}
                className="w-full p-6 text-left hover:bg-blue-50/50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {expandedGrades.has(gradeSection.grade) ? 
                      <ChevronDown className="w-5 h-5 text-blue-600" /> : 
                      <ChevronRight className="w-5 h-5 text-blue-600" />
                    }
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-lg font-semibold">
                        Grade {gradeSection.grade}
                      </div>
                      <div className="text-sm text-gray-600">
                        {gradeSection.totalStudents} students • {gradeSection.totalAssignments} assignments
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{gradeSection.averageCompletion}%</div>
                      <div className="text-xs text-gray-500">Average</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{gradeSection.completedAssignments}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{gradeSection.activeStudents}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Student List */}
              {expandedGrades.has(gradeSection.grade) && (
                <div className="border-t border-blue-100 bg-white/40 p-4">
                  <div className="space-y-6">
                    {gradeSection.students.map((student, studentIndex) => {
                      const studentData = studentsData?.find(s => s.id === student.id);
                      
                      return (
                        <div key={student.id} className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                          {/* Student Header */}
                          <div className="bg-blue-50/50 p-4 border-b border-blue-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                                  {studentIndex + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{student.full_name}</div>
                                  <div className="text-sm text-gray-600">{student.email}</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{student.completedAssignments}</span>
                                <span className="text-gray-400"> / </span>
                                <span>{student.totalAssignments}</span>
                                <span className="text-gray-400"> assignments</span>
                              </div>
                            </div>
                          </div>

                          {/* Assignments Table */}
                          {studentData?.assignments && studentData.assignments.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="w-12 text-center p-3 text-sm font-medium text-gray-700">#</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-700">Assignment Name</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-700">Subject</th>
                                    <th className="text-center p-3 text-sm font-medium text-gray-700">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {studentData.assignments.map((assignment, assignmentIndex) => {
                                    const statusDisplay = getAssignmentStatusDisplay(assignment.status);
                                    
                                    return (
                                      <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                        <td className="p-3 text-center">
                                          <div className="bg-gray-100 text-gray-700 text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center mx-auto">
                                            {assignmentIndex + 1}
                                          </div>
                                        </td>
                                        <td className="p-3">
                                          <div className="text-sm font-medium text-gray-900">
                                            {assignment.title || <em className="text-gray-400">Untitled</em>}
                                          </div>
                                        </td>
                                        <td className="p-3">
                                          <div className="text-sm text-gray-700">
                                            {assignment.subject || <em className="text-gray-400">No subject</em>}
                                          </div>
                                        </td>
                                        <td className="p-3 text-center">
                                          <Badge className={`${statusDisplay.color} text-xs`}>
                                            {statusDisplay.text}
                                          </Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-gray-500 text-sm">
                              No assignments yet
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {gradeSection.students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No students found in this grade.
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {gradeSections.length === 0 && !studentsWithoutGrades.length && (
          <Card className="p-12 text-center bg-white/70">
            <div className="text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No students found matching your search.</p>
            </div>
          </Card>
        )}

        {/* Warning: Students Without Grades */}
        {studentsWithoutGrades.length > 0 && (
          <Card className="border-2 border-orange-200 bg-orange-50/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-orange-100 p-4 border-b border-orange-200 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">⚠️ Students Missing Grade Assignment</h3>
                <p className="text-sm text-orange-700">{studentsWithoutGrades.length} student(s) need to be assigned to a grade</p>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {studentsWithoutGrades.map((student, index) => {
                const studentData = studentsData?.find(s => s.id === student.id);
                const studentSummary = processedStudents.find(s => s.id === student.id);
                
                return (
                  <div key={student.id} className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                    <div className="bg-orange-50/50 p-4 border-b border-orange-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{student.full_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{student.email || 'No email'}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{studentSummary?.completedAssignments || 0}</span>
                          <span className="text-gray-400"> / </span>
                          <span>{studentSummary?.totalAssignments || 0}</span>
                          <span className="text-gray-400"> assignments</span>
                        </div>
                      </div>
                    </div>

                    {/* Assignments for students without grades */}
                    {studentData?.assignments && studentData.assignments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="w-12 text-center p-3 text-sm font-medium text-gray-700">#</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-700">Assignment Name</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-700">Subject</th>
                              <th className="text-center p-3 text-sm font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentData.assignments.map((assignment, assignmentIndex) => {
                              const statusDisplay = getAssignmentStatusDisplay(assignment.status);
                              
                              return (
                                <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                  <td className="p-3 text-center">
                                    <div className="bg-gray-100 text-gray-700 text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center mx-auto">
                                      {assignmentIndex + 1}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {assignment.title || <em className="text-gray-400">Untitled</em>}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm text-gray-700">
                                      {assignment.subject || <em className="text-gray-400">No subject</em>}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge className={`${statusDisplay.color} text-xs`}>
                                      {statusDisplay.text}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        No assignments yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
