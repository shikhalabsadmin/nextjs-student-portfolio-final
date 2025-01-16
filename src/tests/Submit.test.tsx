import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { saveDraft } from '@/lib/assignments';
import type { AssignmentFormData } from '@/types/assignments';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the entire supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(),
    storage: {
      from: vi.fn()
    }
  }
}));

describe('Submit Page Draft Functionality', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  // Mock form data
  const mockFormData: AssignmentFormData = {
    title: 'Test Assignment',
    subject: 'Math',
    artifact_type: 'Project',
    month: new Date().toISOString().split('T')[0],
    grade: '9',
    is_team_work: false,
    team_contribution: '',
    is_original_work: false,
    originality_explanation: '',
    skills: [],
    skills_justification: '',
    pride_reason: '',
    creation_process: '',
    learnings: '',
    challenges: '',
    improvements: '',
    acknowledgments: '',
    files: [],
    teacher_id: null,
    original_assignment_id: null,
    display_layout: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
  });

  describe('Creating Draft', () => {
    it('should create new draft for teacher assignment if none exists', async () => {
      // Mock storage
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } })
      } as any);

      // Mock database queries
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-draft-id' },
            error: null
          })
        })
      } as any);

      const result = await saveDraft(mockFormData);
      expect(result.id).toBe('new-draft-id');
      expect(supabase.from).toHaveBeenCalledWith('assignments');
    });

    it('should update existing draft if one exists', async () => {
      const existingDraft = {
        id: 'existing-draft-id',
        status: 'draft'
      };

      // Mock storage
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } })
      } as any);

      // Mock database queries for update case
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingDraft, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'existing-draft-id' },
            error: null
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'existing-draft-id' },
            error: null
          })
        })
      } as any);

      const result = await saveDraft(mockFormData);
      expect(result.id).toBe('existing-draft-id');
      expect(supabase.from).toHaveBeenCalledWith('assignments');
    });
  });
}); 