import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Artifact } from "@/components/teacher/dashboard/ArtifactTable";
import { format } from "date-fns";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";
import { TeachingSubject } from "@/types/teacher-dashboard";
import { toast } from "sonner";

interface UseTeacherArtifactsResult {
  artifacts: Artifact[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface DatabaseRecord {
  id: number | string;
  title: string;
  subject: string;
  grade: string;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  student_id: string;
}

// Student profile interface
interface StudentProfile {
  id: string;
  full_name: string;
}

// Define teacher-specific properties
interface TeacherData {
  grade_levels?: string[];
  teaching_subjects?: TeachingSubject[];
  user_metadata?: Record<string, unknown>;
}

// Combined type for the teacher user
type TeacherUser = User & TeacherData;

export function useTeacherArtifacts(
  user: TeacherUser | null
): UseTeacherArtifactsResult {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching artifacts for teacher:", user?.id || "unknown");
      
      // Extract teaching subjects information - use empty array as default
      const teachingSubjects = user?.teaching_subjects || [];
      console.log("Teacher's teaching subjects:", teachingSubjects);
      
      if (teachingSubjects.length === 0) {
        console.warn("No teaching subjects assigned to this teacher");
      }
      
      try {
        // Create query filters based on teaching_subjects
        let query = supabase.from("assignments").select('*');
        
        // Only filter by subjects and grades if teaching_subjects exist
        if (teachingSubjects.length > 0) {
          // Extract unique grades and subjects with safe access
          const grades = [...new Set(teachingSubjects.map(ts => ts?.grade || ""))].filter(Boolean);
          const subjects = [...new Set(teachingSubjects.map(ts => ts?.subject || ""))].filter(Boolean);
          
          console.log("Filtering artifacts by grades:", grades);
          console.log("Filtering artifacts by subjects:", subjects);
          
          // Only apply filters if we have valid values
          if (grades.length > 0) {
            query = query.in('grade', grades);
          }
          
          if (subjects.length > 0) {
            query = query.in('subject', subjects);
          }
        }
        
        // Add teacher_id filter if not filtering by subjects/grades
        if (teachingSubjects.length === 0) {
          query = query.eq('teacher_id', user.id);
        }
        
        // Only show assignments with status SUBMITTED, NEEDS_REVISION, or APPROVED
        query = query.in('status', [
          ASSIGNMENT_STATUS.SUBMITTED,
          ASSIGNMENT_STATUS.NEEDS_REVISION,
          ASSIGNMENT_STATUS.APPROVED
        ]);
        
        const { data: assignmentsData, error: fetchError } = await query;

        if (fetchError) {
          toast.error("Error fetching assignments");
          console.error("Error fetching assignments:", fetchError);
          return;
        }

        console.log(`Fetched ${assignmentsData?.length || 0} assignment(s) for this teacher`);

        // Validate assignments data
        if (!assignmentsData || !Array.isArray(assignmentsData)) {
          console.warn("No assignments data returned or data is not an array:", assignmentsData);
          setArtifacts([]);
          setIsLoading(false);
          return;
        }

        // Check assignment data structure
        const invalidAssignments = assignmentsData.filter(record => 
          !record || 
          (!record.id && record.id !== 0) || 
          !record.title || 
          !record.subject || 
          !record.grade
        );

        if (invalidAssignments.length > 0) {
          console.warn(`Found ${invalidAssignments.length} assignments with invalid data:`, invalidAssignments);
        }

        // Extract all unique student IDs
        const studentIds = [...new Set((assignmentsData || [])
          .map(record => {
            if (!record?.student_id) {
              console.warn("Found record with missing student_id:", record);
              return null;
            }
            return record.student_id;
          })
          .filter(Boolean))];
        
        console.log(`Found ${studentIds.length} unique student(s)`);
        
        // Fetch student profiles from profiles table
        const studentProfiles: Record<string, StudentProfile> = {};
        
        if (studentIds.length > 0) {
          try {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select('id, full_name')
              .in('id', studentIds);
              
            if (profilesError) {
              console.error("Error fetching student profiles:", profilesError);
            } else {
              console.log(`Fetched ${profilesData?.length || 0} student profile(s)`);
              
              // Create a map of student_id to profile for easy lookup
              (profilesData || []).forEach(profile => {
                if (profile && profile.id) {
                  studentProfiles[profile.id] = profile as StudentProfile;
                } else {
                  console.warn("Found invalid student profile:", profile);
                }
              });
              
              // Check if any student IDs don't have matching profiles
              const missingProfiles = studentIds.filter(id => !studentProfiles[id]);
              if (missingProfiles.length > 0) {
                console.warn(`Missing profiles for ${missingProfiles.length} students:`, missingProfiles);
              }
            }
          } catch (profileError) {
            console.error("Unexpected error fetching student profiles:", profileError);
          }
        }

        // Transform the data to match Artifact interface
        const transformedArtifacts: Artifact[] = (assignmentsData || []).map((record: DatabaseRecord) => {
          // Get student profile if available
          const studentProfile = record?.student_id ? studentProfiles[record.student_id] : null;
          
          return {
            id: record.id, // Use the ID directly from the database
            name: record?.title || "Untitled Assignment",
            subject: record?.subject || "Unknown Subject",
            studentName: studentProfile?.full_name || `Student ${record?.student_id?.substring(0, 4) || 'Unknown'}`,
            class: record?.grade || "Unknown Grade",
            grade: record?.grade || "Unknown Grade",
            status: record?.status || ASSIGNMENT_STATUS.DRAFT,
            created: record?.created_at ? format(new Date(record.created_at), 'MMM d, yyyy') : 'Unknown date',
            lastUpdated: record?.updated_at ? format(new Date(record.updated_at), 'MMM d, yyyy') : 'Unknown date'
          };
        });

        setArtifacts(transformedArtifacts);
        setIsLoading(false);

      } catch (err) {
        console.error("Error fetching assignments:", err);
        throw err;
      }

    } catch (err) {
      console.error("Error in fetchArtifacts:", err);
      setError("Failed to fetch artifacts. Please try again later.");
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  return {
    artifacts,
    isLoading,
    error,
    refetch: fetchArtifacts
  };
} 