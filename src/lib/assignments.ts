import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Assignment, AssignmentFormData } from '@/types/assignments';
import type { AssignmentFile } from '@/types/file';
import type { Database, FileOptions } from '@/types/supabase';
import { getFileTypeCategory } from '@/lib/utils/file-type.utils';
import { debugAPI } from '@/lib/utils/debug.service';

export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void,
  assignment_id?: string | null
): Promise<{ url: string; metadata: AssignmentFile }> => {
  debugAPI.step('Starting file upload with progress tracking', { 
    fileName: file.name,
    assignment_id 
  });

  const authData = await supabase.auth.getUser();
  if (!authData.data.user) {
    debugAPI.error('No authenticated user found');
    throw new Error('No user found');
  }
  
  try {
    const user = authData.data.user;
    
    // Create a unique filename with timestamp
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    debugAPI.info('Generated file path', { fileName });
    
    // Initialize progress
    onProgress?.(0);
    
    // Upload the file with progress tracking
    debugAPI.step('Uploading to storage with progress tracking');
    const { data, error } = await supabase.storage
      .from('assignments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress: { loaded: number; total: number }) => {
          // Calculate percentage and ensure it's between 0 and 100
          const percentage = Math.min(
            Math.round((progress.loaded / progress.total) * 100),
            99 // Cap at 99% until fully complete
          );
          onProgress?.(percentage);
        }
      } as FileOptions);

    if (error) {
      debugAPI.error('Storage upload failed', error);
      throw error;
    }

    // Mark as complete
    onProgress?.(100);
    debugAPI.info('File uploaded successfully');

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(data.path);

    debugAPI.step('Creating database record');
    // Store file metadata
    const { data: fileData, error: fileError } = await supabase
      .from('assignment_files')
      .insert({
        file_url: publicUrl,
        file_name: file.name,
        file_type: getFileTypeCategory(file.type),
        file_size: file.size,
        student_id: user.id,
        assignment_id: assignment_id || null
      })
      .select()
      .single();

    if (fileError) {
      debugAPI.error('Database insert failed', fileError);
      throw fileError;
    }

    debugAPI.info('File record created successfully', fileData);
    return {
      url: publicUrl,
      metadata: fileData as AssignmentFile
    };
  } catch (error) {
    debugAPI.error('File upload process failed', error);
    throw error;
  }
};

export const saveDraft = async (data: AssignmentFormData): Promise<Assignment | null> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('No user found');
    
    console.log('[SAVE_DRAFT] Input data:', {
      id: data.id,
      title: data.title,
      artifact_type: data.artifact_type,
      raw: data
    });

    const assignmentData: Omit<Database['public']['Tables']['assignments']['Row'], 'id'> = {
      title: data.title,
      subject: data.subject,
      grade: data.grade,
      status: 'DRAFT',
      student_id: user.id,
      artifact_type: data.artifact_type,
      artifact_url: data.artifact_url || null,
      is_team_work: data.is_team_work || false,
      is_original_work: data.is_original_work || true,
      team_contribution: data.team_contribution || null,
      originality_explanation: data.originality_explanation || null,
      month: data.month || null,
      selected_skills: data.selected_skills || [],
      skills_justification: data.skills_justification || null,
      pride_reason: data.pride_reason || null,
      creation_process: data.creation_process || null,
      learnings: data.learnings || null,
      challenges: data.challenges || null,
      improvements: data.improvements || null,
      acknowledgments: data.acknowledgments || null,
      teacher_id: null,
      submitted_at: null,
      verified_at: null,
      feedback: null,
      revision_history: [],
      current_revision: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[SAVE_DRAFT] Database payload:', {
      artifact_type: assignmentData.artifact_type,
      payload: assignmentData
    });

    let result;
    if (data.id) {
      console.log('[SAVE_DRAFT] Updating existing assignment:', { id: data.id });
      const { data: updatedData, error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', data.id)
        .eq('student_id', user.id)
        .select('*')
        .single();

      if (error) throw error;
      result = updatedData;
    } else {
      console.log('[SAVE_DRAFT] Creating new assignment');
      const { data: newData, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select('*')
        .single();

      if (error) throw error;
      result = newData;
    }

    console.log('[SAVE_DRAFT] Result:', {
      success: !!result,
      id: result?.id,
      artifact_type: result?.artifact_type,
      result
    });

    return result;
  } catch (error) {
    console.error('[ERROR] saveDraft failed:', error);
    throw error;
  }
}; 