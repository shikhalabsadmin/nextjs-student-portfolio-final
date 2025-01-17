import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Teacher {
  id: string;
  email: string;
  full_name: string;
  teaching_subjects: { subject: string; grade: string }[];
}

interface Student {
  id: string;
  email: string;
  full_name: string;
  grade: string;
  assignments: {
    id: string;
    title: string;
    subject: string;
    status: string;
  }[];
}

interface NewTeacherForm {
  email: string;
  full_name: string;
  subjects: string[];
  grades: string[];
  password?: string;
}

interface NewStudentForm {
  email: string;
  full_name: string;
  grade: string;
  password?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const queryClient = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  
  // New teacher form state
  const [newTeacher, setNewTeacher] = useState<NewTeacherForm>({
    email: '',
    full_name: '',
    subjects: [],
    grades: []
  });

  // New student form state
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    email: '',
    full_name: '',
    grade: ''
  });

  // Dialog states
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;
      if (user.email !== 'admin@shikha.ai') {
        navigate('/app/dashboard');
      }
    };
    checkAccess();
  }, [user, navigate]);

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, teaching_subjects')
        .eq('role', 'TEACHER')
        .order('full_name');
      
      if (error) throw error;
      return data as Teacher[];
    }
  });

  // Fetch students and assignments when teacher, subject, and grade are selected
  const { data: students } = useQuery({
    queryKey: ['admin-students', selectedTeacher, selectedSubject, selectedGrade],
    queryFn: async () => {
      if (!selectedTeacher || !selectedSubject || !selectedGrade) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          grade,
          assignments (
            id,
            title,
            subject,
            status
          )
        `)
        .eq('role', 'STUDENT')
        .eq('grade', selectedGrade)
        .order('full_name');

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!(selectedTeacher && selectedSubject && selectedGrade)
  });

  // Generate a secure temporary password
  const generateTempPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Handle creating new teacher profile
  const handleCreateTeacher = async () => {
    if (!newTeacher.email || !newTeacher.full_name || !newTeacher.subjects.length || !newTeacher.grades.length) {
      toast.error('Please fill in all required fields');
      return;
    }

    const tempPassword = generateTempPassword();

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newTeacher.email,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newTeacher.email,
          full_name: newTeacher.full_name,
          role: 'TEACHER',
          teaching_subjects: newTeacher.subjects.flatMap(subject =>
            newTeacher.grades.map(grade => ({
              subject,
              grade
            }))
          )
        });

      if (profileError) throw profileError;

      // Show success message with temporary password
      toast.success(
        <div>
          <p>Teacher profile created successfully</p>
          <p className="mt-2 font-mono bg-gray-100 p-2 rounded">
            Temporary password: {tempPassword}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Please securely share this password with the teacher
          </p>
        </div>,
        {
          duration: 10000, // Show for 10 seconds
        }
      );
      
      setIsTeacherDialogOpen(false);
      setNewTeacher({ email: '', full_name: '', subjects: [], grades: [] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error) {
      console.error('Error creating teacher profile:', error);
      toast.error('Failed to create teacher profile');
    }
  };

  // Handle creating new student profile
  const handleCreateStudent = async () => {
    if (!newStudent.email || !newStudent.full_name || !newStudent.grade) {
      toast.error('Please fill in all required fields');
      return;
    }

    const tempPassword = generateTempPassword();

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStudent.email,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newStudent.email,
          full_name: newStudent.full_name,
          role: 'STUDENT',
          grade: newStudent.grade
        });

      if (profileError) throw profileError;

      // Show success message with temporary password
      toast.success(
        <div>
          <p>Student profile created successfully</p>
          <p className="mt-2 font-mono bg-gray-100 p-2 rounded">
            Temporary password: {tempPassword}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Please securely share this password with the student
          </p>
        </div>,
        {
          duration: 10000, // Show for 10 seconds
        }
      );

      setIsStudentDialogOpen(false);
      setNewStudent({ email: '', full_name: '', grade: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    } catch (error) {
      console.error('Error creating student profile:', error);
      toast.error('Failed to create student profile');
    }
  };

  // Handle mapping assignment
  const handleAssignMapping = async () => {
    if (!selectedTeacher || !selectedSubject || !selectedGrade) {
      toast.error('Please select all fields');
      return;
    }

    const teacher = teachers?.find(t => t.id === selectedTeacher);
    if (!teacher) {
      toast.error('Teacher not found');
      return;
    }

    // Check if mapping already exists
    const existingMapping = teacher.teaching_subjects?.find(
      ts => ts.subject === selectedSubject && ts.grade === selectedGrade
    );

    if (existingMapping) {
      toast.error('This mapping already exists');
      return;
    }

    // Create new teaching_subjects array with the new mapping
    const newTeachingSubjects = [
      ...(teacher.teaching_subjects || []),
      { subject: selectedSubject, grade: selectedGrade }
    ];

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          teaching_subjects: newTeachingSubjects
        })
        .eq('id', selectedTeacher);

      if (error) throw error;

      toast.success('Teacher mapping added successfully');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error) {
      console.error('Error adding teacher mapping:', error);
      toast.error('Failed to add teacher mapping');
    }
  };

  // Handle mapping removal
  const handleRemoveMapping = async (teacherId: string, subject: string, grade: string) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    if (!teacher) {
      toast.error('Teacher not found');
      return;
    }

    // Remove the mapping from teaching_subjects array
    const newTeachingSubjects = teacher.teaching_subjects?.filter(
      ts => !(ts.subject === subject && ts.grade === grade)
    ) || [];

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          teaching_subjects: newTeachingSubjects
        })
        .eq('id', teacherId);

      if (error) throw error;

      toast.success('Teacher mapping removed successfully');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error) {
      console.error('Error removing teacher mapping:', error);
      toast.error('Failed to remove teacher mapping');
    }
  };

  const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Art', 'Music'];
  const GRADES = ['6', '7', '8', '9', '10'];

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Teacher Mapping Dashboard</h1>
          <div className="space-x-4">
            <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create New Teacher</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Teacher Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newTeacher.email}
                      onChange={e => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={newTeacher.full_name}
                      onChange={e => setNewTeacher(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subjects</Label>
                    <Select
                      value={newTeacher.subjects.join(',')}
                      onValueChange={value => setNewTeacher(prev => ({ ...prev, subjects: value.split(',').filter(Boolean) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(subject => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Grades</Label>
                    <Select
                      value={newTeacher.grades.join(',')}
                      onValueChange={value => setNewTeacher(prev => ({ ...prev, grades: value.split(',').filter(Boolean) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grades" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(grade => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateTeacher} className="w-full">
                    Create Teacher
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create New Student</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Student Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newStudent.email}
                      onChange={e => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={newStudent.full_name}
                      onChange={e => setNewStudent(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select
                      value={newStudent.grade}
                      onValueChange={value => setNewStudent(prev => ({ ...prev, grade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(grade => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateStudent} className="w-full">
                    Create Student
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Teacher</label>
            <Select
              value={selectedTeacher || ''}
              onValueChange={setSelectedTeacher}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers?.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name || teacher.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select
              value={selectedSubject || ''}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Grade</label>
            <Select
              value={selectedGrade || ''}
              onValueChange={setSelectedGrade}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map(grade => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleAssignMapping}
          className="mb-8"
        >
          Assign Teacher to Subject and Grade
        </Button>

        {/* Current Mappings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Teacher Mappings</h2>
          <div className="space-y-4">
            {teachers?.map(teacher => {
              if (!teacher.teaching_subjects?.length) return null;

              return (
                <div key={teacher.id} className="space-y-2">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-medium">{teacher.full_name || teacher.email}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {teacher.teaching_subjects.map(ts => (
                      <div key={`${ts.subject}-${ts.grade}`} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="mr-2">◦</span>
                          <span>{ts.subject} - Grade {ts.grade}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMapping(teacher.id, ts.subject, ts.grade)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student List */}
        {students && students.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Students and Assignments</h2>
            <div className="space-y-6">
              {students.map(student => (
                <div key={student.id} className="space-y-2">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-medium">{student.full_name}</span>
                    <span className="text-sm text-gray-500 ml-2">Grade {student.grade}</span>
                  </div>
                  
                  {/* Assignments sublist */}
                  <div className="ml-6 space-y-1">
                    {student.assignments
                      .filter(a => a.subject === selectedSubject)
                      .map(assignment => (
                        <div key={assignment.id} className="flex items-center text-sm">
                          <span className="mr-2">◦</span>
                          <span>{assignment.title}</span>
                          <span className="text-gray-500 ml-2">({assignment.status})</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 