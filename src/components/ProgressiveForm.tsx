import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { FormStep } from "./assignment-form/FormStep";
import { QuestionField } from "./assignment-form/QuestionField";
import { INITIAL_QUESTIONS } from "./assignment-form/QuestionTypes";
import { useAssignmentSubmission } from "./assignment-form/useAssignmentSubmission";
import { toast } from "sonner";
import { assignmentSchema } from "@/lib/validations/assignment";
import { useAuthState } from "@/hooks/useAuthState";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { saveDraft, uploadFile } from "@/lib/assignments";
import type { AssignmentFormData, AssignmentFile, FormAnswers } from "@/types/assignments";
import { Button } from "./ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { FileText } from "lucide-react";
import { PreviewSection, PreviewField } from "@/components/ui/preview-section";
import { SKILLS } from "@/lib/constants";

interface ProgressiveFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onFirstStepComplete: (isComplete: boolean) => void;
}

interface UploadResult {
  url: string;
  metadata: AssignmentFile;
}

export function ProgressiveForm({ currentStep, onStepChange, onFirstStepComplete }: ProgressiveFormProps) {
  const { user, profile } = useAuthState();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSavedAnswers, setLastSavedAnswers] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { submitWork } = useAssignmentSubmission({
    studentId: user?.id || '',
    onSuccess: () => navigate('/app/assignments')
  });

  // Initialize ID and data from URL parameters and state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const state = location.state as { assignmentData?: any };
    
    if (id) {
      console.log('[INIT] Found assignment ID in URL:', id);
      setCurrentId(id);
      
      // If we have state data, use it immediately
      if (state?.assignmentData) {
        console.log('[INIT] Using immediate state data');
        const newAnswers: FormAnswers = {
          id: id,
          title: state.assignmentData.title || '',
          subject: state.assignmentData.subject || '',
          grade: state.assignmentData.grade || profile?.grade || '',
          month: state.assignmentData.month || new Date().toLocaleString('default', { month: 'long' }),
          artifact_type: state.assignmentData.artifact_type || '',
          artifact_url: state.assignmentData.artifact_url || '',
          is_team_work: state.assignmentData.is_team_work || false,
          team_contribution: state.assignmentData.team_contribution || null,
          is_original_work: state.assignmentData.is_original_work || true,
          originality_explanation: state.assignmentData.originality_explanation || null,
          selected_skills: state.assignmentData.selected_skills || [],
          skills_justification: state.assignmentData.skills_justification || null,
          pride_reason: state.assignmentData.pride_reason || null,
          creation_process: state.assignmentData.creation_process || null,
          learnings: state.assignmentData.learnings || null,
          challenges: state.assignmentData.challenges || null,
          improvements: state.assignmentData.improvements || null,
          acknowledgments: state.assignmentData.acknowledgments || null,
          status: state.assignmentData.status || 'DRAFT',
          student_id: state.assignmentData.student_id,
          teacher_id: state.assignmentData.teacher_id,
          submitted_at: state.assignmentData.submitted_at,
          verified_at: state.assignmentData.verified_at,
          feedback: state.assignmentData.feedback,
          revision_history: state.assignmentData.revision_history || [],
          current_revision: state.assignmentData.current_revision || 0,
          artifact: state.assignmentData.artifact_url ? state.assignmentData.artifact_url.split(',') : [],
          files: []
        };
        setAnswers(newAnswers);
        setLastSavedAnswers(JSON.stringify(newAnswers));
        setLastSavedAt(new Date());
      }
    }
  }, [location.search, location.state, profile?.grade]);

  // Remove the internal step state and use currentStep prop directly
  const step = currentStep;

  const initialFormState: FormAnswers = {
        title: '',
        subject: '',
        grade: '',
    month: '',
    artifact_type: '',
        is_team_work: false,
        is_original_work: true,
    team_contribution: null,
    originality_explanation: null,
        selected_skills: [],
    skills_justification: null,
    pride_reason: null,
    creation_process: null,
    learnings: null,
    challenges: null,
    improvements: null,
    acknowledgments: null,
    artifact: [],
    files: []
  };

  const [answers, setAnswers] = useState<FormAnswers>(initialFormState);

  // Get current questions for the step
  const currentQuestions = INITIAL_QUESTIONS.filter(q => q.step === step);

  // Group questions for side-by-side layout
  const getQuestionGroups = () => {
    if (step === 1) {
      const titleQuestion = currentQuestions.find(q => q.id === "title");
      const subjectQuestion = currentQuestions.find(q => q.id === "subject");
      const monthQuestion = currentQuestions.find(q => q.id === "month");
      const otherQuestions = currentQuestions.filter(q => 
        q.id !== "title" && q.id !== "subject" && q.id !== "month"
      );

      return {
        title: titleQuestion,
        sideBySide: subjectQuestion && monthQuestion ? [subjectQuestion, monthQuestion] : [],
        regular: otherQuestions
      };
    }
    return {
      title: null,
      sideBySide: [],
      regular: currentQuestions
    };
  };

  const { title, sideBySide, regular } = getQuestionGroups();

  // Reset form handler
  const resetForm = () => {
    setAnswers(initialFormState);
      onStepChange(1);
  };

  // Handle form changes with proper dirty state management
  const handleFormChange = useCallback((fieldId: string, value: any) => {
    // Prevent editing if already submitted
    if (answers.status === 'SUBMITTED') {
      toast({
        title: "Cannot Edit",
        description: "This assignment has already been submitted and cannot be edited.",
        variant: "destructive"
      });
        return;
      }

    console.log('[CHANGE] Field updated:', {
      fieldId,
      value,
      step,
      currentQuestions: currentQuestions.map(q => q.id)
    });

    setAnswers(currentAnswers => {
      const newAnswers = {
        ...currentAnswers,
        [fieldId]: value
      };
      console.log('[CHANGE] New answers:', {
        fieldId,
        oldValue: currentAnswers[fieldId as keyof FormAnswers],
        newValue: value,
        step
      });
      return newAnswers;
    });
    
    setIsDirty(true);
    setLastSavedAt(null);
  }, [answers.status, step, currentQuestions]);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Prevent uploads if already submitted
    if (answers.status === 'SUBMITTED') {
          toast({
        title: "Cannot Upload",
        description: "This assignment has already been submitted and cannot be modified.",
        variant: "destructive"
          });
          return;
        }

    // Validate file types and sizes
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Videos
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    // Validate all files before starting upload
    const invalidFiles = Array.from(files).filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive"
        });
        return true;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Error",
          description: `${file.name} has an unsupported file type.`,
          variant: "destructive"
        });
        return true;
      }
      return false;
    });

    if (invalidFiles.length > 0) return;

    try {
      setUploadProgress({});
      const currentAnswers = { ...answers };
      const uploadedUrls: string[] = [];
      const uploadErrors: string[] = [];

      // Process each file with retry logic
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const key = `${file.name}-${i}`;
        let retries = 3;

        while (retries > 0) {
          try {
            const { url } = await uploadFile(
              file, 
              (progress) => {
                setUploadProgress(prev => ({
                  ...prev,
                  [key]: progress
                }));
              },
              currentId
            );

            if (url) {
              uploadedUrls.push(url);
              break;
            }
          } catch (error) {
            console.error(`Error uploading ${file.name} (attempt ${4 - retries}/3):`, error);
            retries--;
            
            if (retries === 0) {
              uploadErrors.push(file.name);
            } else {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      // Show errors if any files failed to upload
      if (uploadErrors.length > 0) {
        toast({
          title: "Upload Error",
          description: `Failed to upload: ${uploadErrors.join(', ')}`,
          variant: "destructive"
        });
      }

      // Combine with existing URLs if any
      if (Array.isArray(currentAnswers.artifact)) {
        const existingUrls = currentAnswers.artifact
          .filter(item => typeof item === 'string')
          .map(url => url as string);
        uploadedUrls.push(...existingUrls);
      }

      // Update form state
      const updatedAnswers = {
        ...currentAnswers,
        artifact: uploadedUrls,
        artifact_url: uploadedUrls.join(',')
      };
      setAnswers(updatedAnswers);
      setIsDirty(true);
      
      // Trigger immediate auto-save after file upload
      try {
        const result = await saveDraft({
          ...updatedAnswers,
          id: currentId
        });
        
        if (result && !currentId) {
          setCurrentId(result.id);
          // Update URL with new ID
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('id', result.id);
          window.history.replaceState({}, '', newUrl.toString());
        }
        
        setLastSavedAt(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Error in auto-save after upload:', error);
      }

    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadProgress({});
    }
  };

  // Transform form data to match backend expectations
  const transformFormData = (formData: FormAnswers): AssignmentFormData => {
    return {
      ...formData,
      artifact_url: Array.isArray(formData.artifact) 
        ? formData.artifact.filter(a => typeof a === 'string').join(',')
        : formData.artifact_url || '',
      team_contribution: formData.team_contribution || null,
      originality_explanation: formData.originality_explanation || null,
      is_team_work: formData.is_team_work || false,
      is_original_work: formData.is_original_work || true,
      selected_skills: formData.selected_skills || [],
      skills_justification: formData.skills_justification || null,
      pride_reason: formData.pride_reason || null,
      creation_process: formData.creation_process || null,
      learnings: formData.learnings || null,
      challenges: formData.challenges || null,
      improvements: formData.improvements || null,
      acknowledgments: formData.acknowledgments || null,
    };
  };

  // Check if first step is complete
  const isFirstStepCompleteValue = useMemo(() => {
    const hasTitle = typeof answers.title === 'string' && answers.title.trim().length > 0;
    const hasSubject = typeof answers.subject === 'string' && answers.subject.length > 0;
    const hasArtifactType = typeof answers.artifact_type === 'string' && answers.artifact_type.length > 0;
    const hasMonth = typeof answers.month === 'string' && answers.month.length > 0;
    const hasArtifact = Array.isArray(answers.artifact) ? answers.artifact.length > 0 : typeof answers.artifact_url === 'string';
    
    return hasTitle && hasSubject && hasArtifactType && hasMonth && hasArtifact;
  }, [answers.title, answers.subject, answers.artifact_type, answers.month, answers.artifact, answers.artifact_url]);

  const isFirstStepComplete = useCallback(() => isFirstStepCompleteValue, [isFirstStepCompleteValue]);

  // Update parent when first step completion status changes
  useEffect(() => {
    if (step === 1) {
      onFirstStepComplete(isFirstStepCompleteValue);
    }
  }, [step, isFirstStepCompleteValue, onFirstStepComplete]);

  // Load existing assignment data with better error handling
  const loadExistingAssignment = async () => {
    if (!user?.id || !currentId) {
      console.log('[LOAD] Missing required data:', {
        userId: user?.id,
        id: currentId
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: assignment, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', currentId)
        .eq('student_id', user.id)
        .single();

      if (error) throw error;
      if (!assignment) {
        console.log('[LOAD] No assignment found');
        return;
      }

      console.log('[LOAD] Raw data:', assignment);

      const newAnswers: FormAnswers = {
        id: assignment.id,
        title: assignment.title || '',
        subject: assignment.subject || '',
        grade: assignment.grade || profile?.grade || '',
        month: assignment.month || new Date().toLocaleString('default', { month: 'long' }),
        artifact_type: assignment.artifact_type || '',
        artifact_url: assignment.artifact_url || '',
        is_team_work: assignment.is_team_work || false,
        team_contribution: assignment.team_contribution || null,
        is_original_work: assignment.is_original_work || true,
        originality_explanation: assignment.originality_explanation || null,
        selected_skills: assignment.selected_skills || [],
        skills_justification: assignment.skills_justification || null,
        pride_reason: assignment.pride_reason || null,
        creation_process: assignment.creation_process || null,
        learnings: assignment.learnings || null,
        challenges: assignment.challenges || null,
        improvements: assignment.improvements || null,
        acknowledgments: assignment.acknowledgments || null,
        status: assignment.status || 'DRAFT',
        student_id: assignment.student_id || user.id,
        teacher_id: assignment.teacher_id,
        submitted_at: assignment.submitted_at,
        verified_at: assignment.verified_at,
        feedback: assignment.feedback,
        revision_history: assignment.revision_history || [],
        current_revision: assignment.current_revision || 0,
        artifact: assignment.artifact_url ? assignment.artifact_url.split(',') : [],
        files: []
      };

      console.log('[LOAD] Transformed:', newAnswers);

      setAnswers(newAnswers);
      setIsDirty(false);
      setLastSavedAnswers(JSON.stringify(newAnswers));
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('[LOAD] Error:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load draft when ID changes or user is available
  useEffect(() => {
    if (currentId && user?.id) {
      console.log('[FORM_INIT] Loading draft:', {
        id: currentId,
        userId: user.id
      });
      loadExistingAssignment();
    }
  }, [currentId, user?.id]);

  // Auto-save configuration
  const AUTO_SAVE_CONFIG = {
    MIN_TIME_BETWEEN_SAVES: 5000, // 5 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  };

  // Auto-save effect with debounce and race condition handling
  useEffect(() => {
    if (!isDirty || !user?.id || isSubmitting || isSavingDraft) {
      console.log('[SAVE] Auto-save skipped:', {
        isDirty,
        userId: !!user?.id,
        isSubmitting,
        isSavingDraft,
        step
      });
      return;
    }

    const currentAnswersJson = JSON.stringify(answers);
    if (currentAnswersJson === lastSavedAnswers) {
      console.log('[SAVE] No changes detected:', {
        step,
        isDirty
      });
      setIsDirty(false);
          return;
        }

    const timeSinceLastSave = lastSavedAt ? Date.now() - lastSavedAt.getTime() : Infinity;
    if (timeSinceLastSave < AUTO_SAVE_CONFIG.MIN_TIME_BETWEEN_SAVES) {
      console.log('[SAVE] Too soon since last save:', {
        timeSinceLastSave,
        minTime: AUTO_SAVE_CONFIG.MIN_TIME_BETWEEN_SAVES
      });
          return;
        }

    let saveTimeoutId: NodeJS.Timeout | null = null;
    let isLatestSave = true;

    const performSave = async () => {
      if (!isLatestSave) return;
      
      console.log('[SAVE] Starting auto-save:', {
        id: currentId,
        isDirty,
        step,
        hasChanges: currentAnswersJson !== lastSavedAnswers,
        changedFields: Object.keys(answers).filter(key => {
          const oldAnswers = JSON.parse(lastSavedAnswers || '{}');
          return JSON.stringify(answers[key as keyof FormAnswers]) !== JSON.stringify(oldAnswers[key]);
        })
      });
      
      setIsAutoSaving(true);
      try {
        const result = await saveDraft({
          ...answers,
          id: currentId
        });
        
        // Only update state if this is still the latest save attempt
        if (isLatestSave) {
          if (result && !currentId) {
            setCurrentId(result.id);
            // Update URL with new ID
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('id', result.id);
            window.history.replaceState({}, '', newUrl.toString());
          }
          
          setLastSavedAnswers(currentAnswersJson);
          setIsDirty(false);
          setLastSavedAt(new Date());
          console.log('[SAVE] Auto-save complete:', {
            step,
            savedData: result
          });
        }
      } catch (error) {
        console.error('[SAVE] Error:', error);
        if (isLatestSave) {
          toast({
            title: "Auto-save failed",
            description: "Changes will be saved when connection is restored.",
            variant: "destructive",
          });
        }
      } finally {
        if (isLatestSave) {
          setIsAutoSaving(false);
        }
      }
    };

    saveTimeoutId = setTimeout(performSave, 1000);

    return () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
      isLatestSave = false;
      setIsAutoSaving(false);
    };
  }, [isDirty, user?.id, answers, currentId, step, isSubmitting, isSavingDraft, lastSavedAnswers, lastSavedAt]);

  // Check if all fields in current step are complete
  const isCurrentStepComplete = (step: number) => {
    const stepQuestions = INITIAL_QUESTIONS.filter(q => q.step === step);
    const errors: string[] = [];

    for (const question of stepQuestions) {
      if (!question.required) continue;
      if (question.condition && !question.condition(answers)) continue;
      
      const value = answers[question.id as keyof FormAnswers];
      let isValid = true;

      // Special handling for artifact field
      if (question.id === 'artifact') {
        isValid = Array.isArray(answers.artifact) ? answers.artifact.length > 0 : !!answers.artifact_url;
      }
      // For boolean fields, they must be explicitly set to the expected value if required
      else if (typeof value === 'boolean') {
        isValid = value !== undefined;
      }
      // For arrays (like selected_skills)
      else if (Array.isArray(value)) {
        isValid = value.length > 0;
      }
      // For strings and other values
      else {
        isValid = value !== undefined && value !== null && 
          (typeof value === 'string' ? value.trim().length > 0 : true);
      }

      if (!isValid) {
        errors.push(`${question.label} is required`);
        console.log(`[VALIDATE] Field "${question.id}" failed validation:`, {
          value,
          required: question.required,
          hasCondition: !!question.condition,
          conditionMet: question.condition ? question.condition(answers) : 'N/A'
        });
      }
    }

    console.log(`[VALIDATE] Step ${step} validation:`, {
      errors,
      questions: stepQuestions.map(q => ({
        id: q.id,
        required: q.required,
        value: answers[q.id as keyof FormAnswers],
        hasCondition: !!q.condition,
        conditionMet: q.condition ? q.condition(answers) : 'N/A'
      }))
    });

    return errors.length === 0;
  };

  // Check if all steps are complete
  const areAllStepsComplete = () => {
    const results = [1, 2, 3, 4].map(step => {
      const complete = isCurrentStepComplete(step);
      const questions = INITIAL_QUESTIONS.filter(q => q.step === step);
      return {
        step,
        complete,
        questions: questions.map(q => ({
          id: q.id,
          label: q.label,
          value: answers[q.id as keyof FormAnswers],
          required: q.required,
          valid: q.required ? (
            typeof answers[q.id as keyof FormAnswers] === 'string' 
              ? (answers[q.id as keyof FormAnswers] as string).trim().length > 0
              : answers[q.id as keyof FormAnswers] !== undefined && 
                answers[q.id as keyof FormAnswers] !== null && 
                answers[q.id as keyof FormAnswers] !== ''
          ) : true,
          hasCondition: !!q.condition,
          conditionMet: q.condition ? q.condition(answers) : 'N/A'
        }))
      };
    });
    
    console.log('[VALIDATE] All steps validation:', results);
    
    const isComplete = results.every(r => r.complete);
    console.log('[VALIDATE] Form complete:', isComplete);
    
    return isComplete;
  };

  // Handle step click in stepper
  const handleStepClick = (newStep: number) => {
    // Always allow clicking on step 1
    if (newStep === 1) {
      onStepChange(newStep);
      return;
    }

    // Only allow navigation to other steps if step 1 is complete
    if (!isFirstStepComplete()) {
      toast({
        title: "Error",
        description: "Please complete the Basic Info section first",
        variant: 'destructive'
      });
      return;
    }

    // Allow navigation to the clicked step
    onStepChange(newStep);
  };

  const handleNext = async () => {
    // For first step, require all fields to be filled
    if (step === 1 && !isFirstStepComplete()) {
      toast({
        title: "Error",
        description: "Please fill out all required fields to continue",
        variant: 'destructive'
      });
      return;
    }

    // For final step, check if all steps are complete before submission
    if (step === 5) {
      if (!areAllStepsComplete()) {
        toast({
          title: "Error",
          description: "Please fill out all required fields in all sections before submitting",
          variant: 'destructive'
        });
        return;
      }
      await handleSubmit();
      return;
    }

    // For other steps, proceed normally
    if (step < 5) {
      onStepChange(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      onStepChange(step - 1);
    } else {
      // Fix the navigation path and include draft ID in state if it exists
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      navigate('/app/assignments', { state: currentId ? { id: currentId } : undefined });
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async (isAutoSave: boolean = false) => {
      setIsSavingDraft(true);
    try {
      const result = await saveDraft({
        ...answers,
        id: currentId
      });
      if (result && !currentId) {
        setCurrentId(result.id);
        // Update URL with new ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', result.id);
        window.history.replaceState({}, '', newUrl.toString());
      }
        setIsDirty(false);
        setLastSavedAt(new Date());
      // Only show toast for manual saves
      if (!isAutoSave) {
        toast({
          title: "Draft saved",
          description: "Your work has been saved as a draft.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleContinue = () => {
    // Only validate on first step
    if (step === 1 && !isFirstStepComplete()) {
      return;
    }
    onStepChange(step + 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps before submitting
    if (!areAllStepsComplete()) {
      const incompleteSteps = [1, 2, 3, 4].map(step => ({
        step,
        complete: isCurrentStepComplete(step)
      })).filter(r => !r.complete);

      const stepNames = {
        1: 'Basic Info',
        2: 'Collaboration',
        3: 'Process',
        4: 'Reflection'
      };

      toast({
        title: "Please complete all required fields",
        description: `Missing required fields in: ${incompleteSteps.map(s => stepNames[s.step as keyof typeof stepNames]).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitWork({
        ...answers,
        id: currentId
      });
      toast({
        title: "Success",
        description: "Your assignment has been submitted.",
      });
      navigate('/app/assignments');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate form before submission
  const validateForm = (step: number): boolean => {
    const errors: string[] = [];
    
    if (step === 1) {
      if (!answers.title?.trim()) errors.push('Title is required');
      if (!answers.subject?.trim()) errors.push('Subject is required');
      if (!answers.grade?.trim()) errors.push('Grade is required');
      if (!answers.artifact_type?.trim()) errors.push('Artifact type is required');
    }

    if (step === 2) {
      if (!answers.artifact?.length) errors.push('Please upload at least one file');
    }

    if (step === 3) {
      if (answers.is_team_work && !answers.team_contribution?.trim()) {
        errors.push('Please explain your team contribution');
      }
      if (!answers.is_original_work) {
        errors.push('Please acknowledge that this is your original work');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Render main content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      );
    }

  // Render preview section for step 5
  if (step === 5) {
    return (
        <div className="space-y-8">
        <PreviewSection title="Basic Information">
            <PreviewField label="Artifact Name" value={answers.title} />
            <PreviewField label="Subject" value={answers.subject} />
            <PreviewField label="Grade" value={answers.grade} />
            <PreviewField label="Month" value={answers.month} />
            <PreviewField label="Artifact Type" value={answers.artifact_type} />
          </PreviewSection>

          <PreviewSection title="Artifact">
            {answers.artifact?.filter((file): file is string => typeof file === 'string').map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/40">
                <FileText className="w-4 h-4 text-gray-500" />
                <a 
                  href={file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 truncate"
                >
                  {file.split('/').pop()}
                </a>
              </div>
            ))}
        </PreviewSection>

        <PreviewSection title="Collaboration and Originality">
          <PreviewField 
              label="Is this a team project?" 
              value={answers.is_team_work ? 'Yes' : 'No'} 
          />
            {answers.is_team_work && answers.team_contribution && (
            <PreviewField 
              label="Describe your role and experience" 
              value={answers.team_contribution} 
            />
          )}
          <PreviewField 
            label="Did you create something new or original?" 
              value={answers.is_original_work ? 'Yes' : 'No'} 
          />
            {answers.is_original_work && answers.originality_explanation && (
            <PreviewField 
              label="Explain what was new" 
              value={answers.originality_explanation} 
            />
          )}
        </PreviewSection>

        <PreviewSection title="Skills and Pride">
          <PreviewField 
            label="What skills did you practice? Select Top 3" 
              value={answers.selected_skills?.map(skill => 
                SKILLS.find(s => s.id === skill)?.name || skill
              ).join(', ')} 
          />
          <PreviewField 
            label="Justify the selected skills" 
            value={answers.skills_justification} 
          />
          <PreviewField 
            label="Why are you proud of this artifact?" 
            value={answers.pride_reason} 
          />
        </PreviewSection>

        <PreviewSection title="Process, Learning, and Reflection">
          <PreviewField 
            label="Describe the process you used to create it" 
            value={answers.creation_process} 
          />
          <PreviewField 
            label="Your learnings and future applications" 
            value={answers.learnings} 
          />
          <PreviewField 
            label="Your challenges" 
            value={answers.challenges} 
          />
          <PreviewField 
            label="Your improvements" 
            value={answers.improvements} 
          />
          <PreviewField 
            label="Your thanks" 
              value={answers.acknowledgments || ''} 
          />
        </PreviewSection>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              variant="outline"
              onClick={() => handleSaveAsDraft(false)}
              disabled={isSubmitting || isSavingDraft || !answers.title || !isDirty}
              size="sm"
              className="text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300 h-9 px-4 transition-all"
            >
              {isSavingDraft ? 'Saving...' : isDirty ? 'Save Draft' : 'Saved'}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !areAllStepsComplete()}
              size="sm"
              className="bg-[#62C59F] hover:bg-[#62C59F]/90 text-white font-medium shadow-sm h-9 px-4 transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
        </div>
      </div>
    );
  }

  // Regular form steps (1-4)
  return (
    <div className="w-full max-w-[800px] mx-auto">
      <Card className="bg-white/60 backdrop-blur-sm border-black/5 shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
        <div className="px-6 py-5">
          <div className="space-y-4">
            {/* Title field always comes first */}
            {title && (
              <FormStep
                key={title.id}
                label={title.label}
                hint={title.hint}
              >
                <QuestionField
                  question={title}
                  value={answers[title.id as keyof FormAnswers]}
                  onChange={(value) => handleFormChange(title.id, value)}
                  uploadProgress={uploadProgress}
                />
              </FormStep>
            )}

            {/* Subject and Month side by side */}
            {sideBySide.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {sideBySide.map((question) => {
                  const shouldShow = !question.condition || question.condition(answers);
                  if (!shouldShow) return null;

                  return (
                    <FormStep
                      key={question.id}
                      label={question.label}
                      hint={question.hint}
                    >
                      <QuestionField
                        question={question}
                        value={answers[question.id as keyof FormAnswers]}
                        onChange={(value) => handleFormChange(question.id, value)}
                        uploadProgress={uploadProgress}
                        handleFileUpload={question.id === 'artifact' ? handleFileUpload : undefined}
                      />
                    </FormStep>
                  );
                })}
              </div>
            )}

            {/* Remaining questions */}
            {regular.map((question) => {
              const shouldShow = !question.condition || question.condition(answers);
              if (!shouldShow) return null;

              return (
                <FormStep
                  key={question.id}
                  label={question.label}
                  hint={question.hint}
                >
                  <QuestionField
                    question={question}
                    value={answers[question.id as keyof FormAnswers]}
                    onChange={(value) => handleFormChange(question.id, value)}
                    uploadProgress={uploadProgress}
                    handleFileUpload={question.id === 'artifact' ? handleFileUpload : undefined}
                  />
                </FormStep>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-200/80">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={step === 1 || isSubmitting}
              size="sm"
              className="text-gray-600 hover:text-gray-900 h-9 px-4 -ml-2 transition-colors"
            >
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                  onClick={() => handleSaveAsDraft(false)}
                disabled={isSubmitting || isSavingDraft || !answers.title || !isDirty}
                size="sm"
                className="text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300 h-9 px-4 transition-all"
              >
                {isSavingDraft ? 'Saving...' : isDirty ? 'Save Draft' : 'Saved'}
              </Button>

              <Button
                  onClick={handleContinue}
                  disabled={step === 1 ? !isFirstStepComplete() : isSubmitting}
                size="sm"
                className="bg-[#62C59F] hover:bg-[#62C59F]/90 text-white font-medium shadow-sm h-9 px-4 transition-all"
              >
                  {isSubmitting ? 'Submitting...' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

  return renderContent();
}