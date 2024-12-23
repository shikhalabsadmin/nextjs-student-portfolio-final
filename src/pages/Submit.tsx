import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  FileText, Users, Brain, Target, BookOpen, 
  ArrowLeft, FileIcon, X as XIcon, AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewSection, PreviewField } from "@/components/ui/preview-section";
import { validateForm } from "@/lib/validate-form";
import type { Database } from '../types/supabase';
import { AssignmentView } from "@/components/assignments/AssignmentView";
import { debounce } from "lodash";
import { useQuery, useQueryClient } from "@tanstack/react-query";
type AssignmentDraft = Database['public']['Tables']['assignment_drafts']['Row'];

const SUBJECTS = ["Math", "Science", "English", "History", "Art"];
const ARTIFACT_TYPES = ["Project", "Essay", "Model", "Performance", "Presentation"];
const SKILLS = [
  "Motivation",
  "Intellect",
  "Diligence", 
  "Emotionality",
  "Sociability"
];
const TOTAL_STEPS = 6;
const STEPS = [
  { name: "Basic Info", icon: FileText },
  { name: "Collaboration", icon: Users },
  { name: "Skills", icon: Brain },
  { name: "Process", icon: Target },
  { name: "Reflection", icon: BookOpen },
  { name: "Preview", icon: AlertTriangle }
];

const STORAGE_KEY = 'assignment_draft';

const FormField = ({ label, hint, error, children }: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2 transition-all duration-200">
    <label className="text-sm font-medium text-gray-900">{label}</label>
    {children}
    {(hint || error) && (
      <div className="flex justify-between items-center mt-1.5">
        {hint && <p className="text-sm text-gray-500">{hint}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )}
  </div>
);

const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-200 bg-white px-4 py-3",
        "text-gray-900 placeholder:text-gray-500",
        "transition-all duration-200",
        "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
        "hover:border-gray-300",
        className
      )}
      {...props}
    />
  )
);

const StyledTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-200 bg-white px-4 py-3",
        "text-gray-900 placeholder:text-gray-500",
        "transition-all duration-200",
        "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
        "hover:border-gray-300",
        "min-h-[120px] resize-none",
        className
      )}
      {...props}
    />
  )
);

interface AssignmentFormData {
  title: string;
  subject: string;
  artifact_type: string;
  month: string;
  is_team_work: boolean;
  team_contribution: string;
  is_original_work: boolean;
  originality_explanation: string;
  skills: string[];
  skills_justification: string;
  pride_reason: string;
  creation_process: string;
  learnings: string;
  challenges: string;
  improvements: string;
  acknowledgments: string;
  files: (File | string)[];  // Allow both File objects and URLs
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const getFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Define allowed status values
const ASSIGNMENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified'
} as const;

// Add this helper at the top of the file
const assignmentDrafts = (supabase: any) => supabase.from('assignment_drafts') as any;

// Add at the top with other interfaces
interface DraftData extends Omit<AssignmentFormData, 'files'> {
  currentStep: number;
  files: (string | File)[];  // Can be either file URLs or File objects
}

interface AssignmentDraftRow {
  id: string;
  student_id: string;
  data: DraftData;
  last_modified: string;
  created_at: string;
}

type DraftResponse = {
  data: AssignmentDraftRow[] | null;
  error: any;
};

const getDefaultFormData = (): AssignmentFormData => ({
  title: "",
  subject: "",
  artifact_type: "",
  month: new Date().toISOString().split('T')[0],
  is_team_work: false,
  team_contribution: "",
  is_original_work: false,
  originality_explanation: "",
  skills: [],
  skills_justification: "",
  pride_reason: "",
  creation_process: "",
  learnings: "",
  challenges: "",
  improvements: "",
  acknowledgments: "",
  files: []
});

const uploadFiles = async (files: (File | string)[], userId: string) => {
  return Promise.all(
    files.map(async (file) => {
      if (file instanceof File) {
        const filePath = `drafts/${userId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('assignments')
          .upload(filePath, file);
        
        if (error) throw error;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(data.path);
        
        return publicUrl;
      }
      return file; // If it's already a URL string, return as is
    })
  );
};

// Add this type at the top with other interfaces
type AssignmentDraftData = Database['public']['Tables']['assignments']['Row'];

export default function Submit() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [draftId, setDraftId] = useState<string | null>(params.id || null);
  const { toast } = useToast();
  const [formData, setFormData] = useState<AssignmentFormData>(getDefaultFormData());
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Load draft data
  const { data: draftData, isLoading } = useQuery<AssignmentDraftData | null>({
    queryKey: ['draft', draftId],
    queryFn: async (): Promise<AssignmentDraftData | null> => {
      if (!draftId) return null;
      const { data: draft } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', draftId)
        .eq('status', 'draft')
        .single();
      if (!draft) return null;
      
      // Convert to unknown first before type assertion
      return (draft as unknown) as AssignmentDraftData;
    },
    enabled: !!draftId,
    staleTime: 0,
    gcTime: 0
  });

  // Update form when draft data loads
  useEffect(() => {
    if (draftData) {
      console.log('Loading draft data:', draftData);
      setFormData({
        title: draftData.title || '',
        subject: draftData.subject || '',
        artifact_type: draftData.artifact_type || '',
        month: draftData.month || new Date().toISOString().split('T')[0],
        is_team_work: draftData.is_team_project || false,
        team_contribution: draftData.team_contribution || '',
        is_original_work: draftData.is_original_work || false,
        originality_explanation: draftData.originality_explanation || '',
        skills: draftData.skills || [],
        skills_justification: draftData.skills_justification || '',
        pride_reason: draftData.pride_reason || '',
        creation_process: draftData.creation_process || '',
        learnings: draftData.learnings || '',
        challenges: draftData.challenges || '',
        improvements: draftData.improvements || '',
        acknowledgments: draftData.acknowledgments || '',
        files: draftData.artifact_url ? draftData.artifact_url.split(',') : []
      });
    }
  }, [draftData]);

  // Move auto-save functionality inside component
  const saveDraft = async (data: AssignmentFormData, currentStep: number) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Handle file uploads first
      let fileUrls = [];
      for (const file of data.files) {
        if (file instanceof File) {
          const filePath = `drafts/${user.id}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assignments')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('assignments')
            .getPublicUrl(uploadData.path);
          
          fileUrls.push(publicUrl);
        } else {
          fileUrls.push(file); // Keep existing URLs
        }
      }

      const assignmentData = {
        student_id: user.id,
        title: data.title || 'Untitled',
        subject: data.subject || '',
        artifact_type: data.artifact_type || '',
        month: new Date().toISOString().split('T')[0],
        status: 'draft',
        artifact_url: fileUrls.join(','),
        is_team_work: data.is_team_work,
        team_contribution: data.team_contribution || null,
        is_original_work: data.is_original_work,
        originality_explanation: data.originality_explanation || null,
        skills: data.skills || [],
        skills_justification: data.skills_justification || null,
        pride_reason: data.pride_reason || null,
        creation_process: data.creation_process || null,
        learnings: data.learnings || null,
        challenges: data.challenges || null,
        improvements: data.improvements || null,
        acknowledgments: data.acknowledgments || null,
        display_layout: {
          type: "classic",
          featuredMedia: null,
          highlightedResponses: []
        }
      };

      let response;
      if (draftId) {
        response = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', draftId)
          .eq('status', 'draft')
          .select('*');
      } else {
        response = await supabase
          .from('assignments')
          .insert([assignmentData])
          .select('*');
      }

      const { data: savedData, error } = response;
      if (error) throw error;

      if (!draftId && savedData?.[0]) {
        setDraftId(savedData[0].id);
      }

      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      await queryClient.refetchQueries({ queryKey: ['assignments'] });

    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save
  const debouncedSave = useMemo(
    () => debounce((data: AssignmentFormData, currentStep: number) => {
      saveDraft(data, currentStep);
    }, 1000),
    [draftId, queryClient] // Add dependencies
  );

  // Auto-save effect
  useEffect(() => {
    if (formData.title || formData.subject) {
      console.log('Auto-saving:', { formData, step });
      debouncedSave(formData, step);
    }
    return () => debouncedSave.cancel();
  }, [formData, step, debouncedSave]);

  // Save draft function
  const handleSaveDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log('Starting draft save...');

      // Handle file uploads first
      let fileUrls = [];
      for (const file of formData.files) {
        if (file instanceof File) {
          const filePath = `drafts/${user.id}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assignments')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('assignments')
            .getPublicUrl(uploadData.path);
          
          fileUrls.push(publicUrl);
        } else {
          fileUrls.push(file); // Keep existing URLs
        }
      }

      const assignmentData = {
        student_id: user.id,
        title: formData.title || 'Untitled',
        subject: formData.subject || '',
        artifact_type: formData.artifact_type || '',
        month: new Date().toISOString().split('T')[0],
        status: 'draft',
        artifact_url: fileUrls.join(','),
        is_team_work: formData.is_team_work || false,
        is_original_work: formData.is_original_work || false,
        team_contribution: formData.team_contribution || null,
        originality_explanation: formData.originality_explanation || null,
        skills: formData.skills || [],
        skills_justification: formData.skills_justification || null,
        pride_reason: formData.pride_reason || null,
        creation_process: formData.creation_process || null,
        learnings: formData.learnings || null,
        challenges: formData.challenges || null,
        improvements: formData.improvements || null,
        acknowledgments: formData.acknowledgments || null,
        display_layout: {
          type: "classic",
          featuredMedia: null,
          highlightedResponses: []
        }
      };

      console.log('Assignment data:', assignmentData);

      let response;
      if (draftId) {
        console.log('Updating existing draft:', draftId);
        response = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', draftId)
          .eq('status', 'draft')
          .select()
          .single();
      } else {
        console.log('Creating new draft');
        response = await supabase
          .from('assignments')
          .insert([assignmentData])
          .select()
          .single();
      }

      console.log('Database response:', response);

      if (response.error) {
        console.error('Database error:', response.error);
        throw response.error;
      }

      if (response.data) {
        console.log('Draft saved successfully:', response.data);
        if (!draftId) {
          setDraftId(response.data.id);
        }
        
        await queryClient.invalidateQueries({ queryKey: ['assignments'] });
        await queryClient.refetchQueries({ queryKey: ['assignments'] });

        toast({
          title: "Draft Saved",
          description: "Your work has been saved as a draft",
        });

        navigate('/app/assignments');
      }

    } catch (error) {
      console.error('Draft save error:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load saved step
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadDraft = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: drafts } = await assignmentDrafts(supabase)
      .select('*')
      .eq('student_id', user.id)
      .order('last_modified', { ascending: false })
      .limit(1) as DraftResponse;

    if (drafts?.[0]) {
      const draftData = drafts[0].data as DraftData;
      setDraftId(drafts[0].id);
      setFormData({
        ...draftData,
        files: draftData.files || []
      });
      setStep(draftData.currentStep);
    }
  };

  // Save data when it changes
  useEffect(() => {
    const dataToSave = { ...formData };
    delete dataToSave.files; // Files can't be stored in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    localStorage.setItem(STORAGE_KEY + '_step', step.toString());
  }, [formData, step]);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-8">
            <FormField 
              label="Title"
              hint="Give your work a meaningful name"
            >
              <StyledInput
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Solar System Model Project"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-6">
              <FormField label="Subject">
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger className="w-full h-[50px]">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(subject => (
                      <SelectItem 
                        key={subject} 
                        value={subject}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Type">
                <Select
                  value={formData.artifact_type}
                  onValueChange={(value) => setFormData({ ...formData, artifact_type: value })}
                >
                  <SelectTrigger className="w-full h-[50px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTIFACT_TYPES.map(type => (
                      <SelectItem 
                        key={type} 
                        value={type}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField 
              label="Attachments"
              hint="Upload your work files (PDF, Word, Images)"
            >
              <div className="space-y-4">
                <FileUpload
                  onUpload={(newFiles) => setFormData({ ...formData, files: newFiles })}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  multiple
                  currentFiles={formData.files}
                />
                {formData.files.length > 0 && (
                  <div className="space-y-2">
                    {formData.files.map((file, index) => (
                      <FilePreview 
                        key={index} 
                        file={file} 
                        onDelete={() => {
                          setFormData({
                            ...formData,
                            files: formData.files.filter((_, i) => i !== index)
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </FormField>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <FormField 
              label="Team Collaboration"
              hint="Tell us about your collaborative experience"
            >
              <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="team-work"
                    checked={formData.is_team_work}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_team_work: checked as boolean })
                    }
                  />
                  <label htmlFor="team-work" className="text-sm font-medium text-gray-700">
                    Did you collaborate with a team on this?
                  </label>
                </div>

                {formData.is_team_work && (
                  <div className="ml-7">
                    <FormField 
                      label="Team Contribution"
                      hint="What specific responsibilities did you take on in the group? How did you work with others? Did you face challenges in communication or teamwork? How did you resolve them? (200 words)"
                    >
                      <StyledTextarea
                        value={formData.team_contribution}
                        onChange={(e) => setFormData({ ...formData, team_contribution: e.target.value })}
                        placeholder="Describe your role and how you worked with others..."
                      />
                      <WordCount text={formData.team_contribution} />
                    </FormField>
                  </div>
                )}
              </div>
            </FormField>

            <FormField 
              label="Originality"
              hint="Tell us about the innovative aspects of your work"
            >
              <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="original-work"
                    checked={formData.is_original_work}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_original_work: checked as boolean })
                    }
                  />
                  <label htmlFor="original-work" className="text-sm font-medium text-gray-700">
                    Did you create something new or original?
                  </label>
                </div>

                {formData.is_original_work && (
                  <div className="ml-7">
                    <StyledTextarea
                      value={formData.originality_explanation}
                      onChange={(e) => setFormData({ ...formData, originality_explanation: e.target.value })}
                      placeholder="What aspects were innovative? What inspired your originality?"
                    />
                    <WordCount text={formData.originality_explanation} />
                  </div>
                )}
              </div>
            </FormField>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <FormField 
              label="Key Skills"
              hint="Select up to 3 skills that best represent your work"
            >
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-2 gap-4">
                  {SKILLS.map(skill => (
                    <div 
                      key={skill} 
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-all
                        ${formData.skills.includes(skill) 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                        ${!formData.skills.includes(skill) && formData.skills.length >= 3 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer'
                        }
                      `}
                      onClick={() => {
                        if (formData.skills.includes(skill)) {
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter(s => s !== skill)
                          });
                        } else if (formData.skills.length < 3) {
                          setFormData({
                            ...formData,
                            skills: [...formData.skills, skill]
                          });
                        }
                      }}
                    >
                      <Checkbox
                        checked={formData.skills.includes(skill)}
                        disabled={!formData.skills.includes(skill) && formData.skills.length >= 3}
                      />
                      <span className="text-sm font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FormField>

            {formData.skills.length > 0 && (
              <FormField 
                label="Skills Justification"
                hint="Explain how each selected skill contributed to your work"
              >
                <StyledTextarea
                  value={formData.skills_justification}
                  onChange={(e) => setFormData({ ...formData, skills_justification: e.target.value })}
                  placeholder={`Describe how you demonstrated:\n${formData.skills.join(', ')}`}
                />
                <WordCount text={formData.skills_justification} />
              </FormField>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <FormField 
              label="Pride & Achievement"
              hint="Share what makes this work meaningful to you"
            >
              <StyledTextarea
                value={formData.pride_reason}
                onChange={(e) => setFormData({ ...formData, pride_reason: e.target.value })}
                placeholder="What aspects of this work make you most proud? What did you achieve?"
              />
              <WordCount text={formData.pride_reason} />
            </FormField>

            <FormField 
              label="Creation Process"
              hint="Walk us through your journey of creating this work"
            >
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <StyledTextarea
                    value={formData.creation_process}
                    onChange={(e) => setFormData({ ...formData, creation_process: e.target.value })}
                    placeholder="What was your planning process? How did you approach the work?"
                  />
                </div>
                <WordCount text={formData.creation_process} />
              </div>
            </FormField>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <FormField 
              label="Learning & Growth"
              hint="Reflect on your learning journey"
            >
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Key Learnings
                  </h3>
                  <StyledTextarea
                    value={formData.learnings}
                    onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                    placeholder="What new knowledge or insights did you gain? How will you apply these lessons?"
                  />
                  <WordCount text={formData.learnings} />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Challenges & Solutions
                  </h3>
                  <StyledTextarea
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    placeholder="What obstacles did you face? How did you overcome them?"
                  />
                  <WordCount text={formData.challenges} />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Future Improvements
                  </h3>
                  <StyledTextarea
                    value={formData.improvements}
                    onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                    placeholder="How would you enhance or approach this work differently in the future?"
                  />
                  <WordCount text={formData.improvements} />
                </div>
              </div>
            </FormField>

            <FormField 
              label="Acknowledgments"
              hint="Recognize those who supported your work"
            >
              <StyledTextarea
                value={formData.acknowledgments}
                onChange={(e) => setFormData({ ...formData, acknowledgments: e.target.value })}
                placeholder="Who helped or inspired you? What resources were valuable?"
              />
            </FormField>
          </div>
        );
      case 6:
        return (
          <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <AlertTriangle className="h-4 w-4" />
              <p>Please review your submission carefully before submitting.</p>
            </div>
            <AssignmentView assignment={formData} isPreview={true} />
          </div>
        );
      // Add more cases for other steps
    }
  };

  const canProceed = () => {
    switch(step) {
      case 1:
        return formData.title && formData.subject && 
               formData.artifact_type && formData.files.length > 0;
      case 2:
        return (!formData.is_team_work || formData.team_contribution) && 
               (!formData.is_original_work || formData.originality_explanation);
      case 3:
        return formData.skills.length > 0 && formData.skills_justification;
      case 4:
        return formData.pride_reason && formData.creation_process;
      case 5:
        return formData.learnings && formData.challenges && 
               formData.improvements && formData.acknowledgments;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    try {
      setIsSubmitting(true);
      setErrors({});
      console.log('Starting submission...');

      // Validate all fields
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        console.log('Validation errors:', validationErrors);
        setErrors(validationErrors);
        toast({
          title: "Validation Error",
          description: "Please check all required fields",
          variant: "destructive"
        });
        return;
      }

      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User error:', userError);
        throw userError;
      }
      if (!user) throw new Error("Not authenticated");
      console.log('Got user:', user.id);

      // Validate files before upload
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
      for (const file of formData.files) {
        if (file instanceof File) {
          if (file.size === 0) {
            throw new Error(`File "${file.name}" is empty`);
          }
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File "${file.name}" exceeds 10MB limit`);
          }
        }
      }

      // Upload files with progress logging
      console.log('Uploading files...');
      const fileUrls = await Promise.all(
        formData.files.map(async (file) => {
          if (file instanceof File) {
            console.log(`Uploading ${file.name} (${getFileSize(file.size)})...`);
            const { data, error } = await supabase.storage
              .from('assignments')
              .upload(`${user.id}/${Date.now()}-${file.name}`, file);
            
            if (error) {
              console.error('File upload error:', error);
              throw error;
            }
            console.log(`Successfully uploaded ${file.name}`);
            return data.path;
          }
          return file; // If it's already a URL string, just return it
        })
      );
      console.log('Files uploaded:', fileUrls);

      // Prepare assignment data
      const assignmentData = {
        student_id: user.id,
        title: formData.title,
        subject: formData.subject,
        artifact_type: formData.artifact_type,
        month: new Date().toISOString().split('T')[0],
        status: ASSIGNMENT_STATUS.SUBMITTED,
        artifact_url: fileUrls.join(','),
        pdf_url: fileUrls.find(url => url.toLowerCase().endsWith('.pdf')) || null,
        is_team_work: formData.is_team_work,
        is_original_work: formData.is_original_work,
        team_contribution: formData.team_contribution || null,
        originality_explanation: formData.originality_explanation || null,
        skills: formData.skills,
        skills_justification: formData.skills_justification || null,
        pride_reason: formData.pride_reason || null,
        creation_process: formData.creation_process || null,
        learnings: formData.learnings || null,
        challenges: formData.challenges || null,
        improvements: formData.improvements || null,
        acknowledgments: formData.acknowledgments || null,
        display_layout: {
          type: "classic",
          featuredMedia: null,
          highlightedResponses: []
        },
        teacher_id: null,
        grade: null
      };

      console.log('Creating assignment:', assignmentData);

      // Create assignment
      const { error: insertError } = await supabase
        .from('assignments')
        .insert([assignmentData]);

      if (insertError) {
        console.error('Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }

      console.log('Assignment created successfully');

      toast({
        title: "Success!",
        description: "Your work has been submitted for review",
      });
      
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_step');
      navigate('/app/assignments');

      if (draftId) {
        await assignmentDrafts(supabase)
          .delete()
          .eq('id', draftId);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit work",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="bg-white border-b z-10">
      <div className="container mx-auto">
        <div className="flex items-center h-16 px-4">
          <button 
            onClick={() => navigate('/app/assignments')}
            className="mr-8 text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Assignments</span>
          </button>
          
          <div className="flex-1 flex items-center">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === idx + 1;
              const isCompleted = step > idx + 1;
              
              return (
                <div key={s.name} className="flex-1 relative">
                  <div className={`
                    absolute top-0 h-1 w-full
                    ${isCompleted ? 'bg-blue-500' : 'bg-gray-100'}
                    ${idx === 0 ? 'rounded-l' : ''}
                    ${idx === STEPS.length - 1 ? 'rounded-r' : ''}
                  `} />
                  <div className={`
                    flex items-center gap-2 py-4 px-4
                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const inputStyles = {
    base: "w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500",
    label: "block text-sm font-medium text-gray-700 mb-1.5",
    hint: "mt-1.5 text-sm text-gray-500"
  };

  const WordCount = ({ text = "", limit = 200 }) => {
    const wordCount = text.trim().split(/\s+/).length;
    return (
      <div className="mt-1.5 flex justify-end">
        <span className={`text-xs ${wordCount > limit ? 'text-red-500' : 'text-gray-400'}`}>
          {wordCount}/{limit} words
        </span>
      </div>
    );
  };

  const FilePreview = ({ file, onDelete }: { 
    file: File | string; 
    onDelete: () => void 
  }) => {
    // Extract filename from URL if it's a string
    const getDisplayName = (file: File | string) => {
      if (file instanceof File) return file.name;
      try {
        const url = new URL(file);
        const pathParts = url.pathname.split('/');
        return decodeURIComponent(pathParts[pathParts.length - 1].split('-').slice(1).join('-'));
      } catch {
        return file;
      }
    };

    return (
      <div className="flex items-center justify-between p-2 rounded bg-gray-50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="text-sm text-gray-600 truncate">
            {getDisplayName(file)}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {file instanceof File ? `(${getFileSize(file.size)})` : ''}
          </span>
        </div>
        <button onClick={onDelete} className="p-1 hover:bg-gray-200 rounded-full shrink-0 ml-2">
          <XIcon className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    );
  };

  const clearForm = () => {
    setFormData({
      title: "",
      subject: "",
      artifact_type: "",
      month: new Date().toISOString().split('T')[0],
      is_team_work: false,
      team_contribution: "",
      is_original_work: false,
      originality_explanation: "",
      skills: [],
      skills_justification: "",
      pride_reason: "",
      creation_process: "",
      learnings: "",
      challenges: "",
      improvements: "",
      acknowledgments: "",
      files: []
    });
    setStep(1);
    setDraftId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderProgressBar()}
      <div className="container mx-auto px-4 max-w-3xl py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8">
            <h1 className="text-2xl font-semibold mb-6">
              {STEPS[step - 1].name}
          </h1>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="px-8 py-4 bg-gray-50 border-t rounded-b-lg flex justify-between">
            {step > 1 && (
              <Button 
                variant="ghost" 
                onClick={() => setStep(step - 1)}
                className="text-gray-600"
              >
                ← Previous
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={async () => {
                  await handleSaveDraft();
                  navigate('/app/assignments');
                }}
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => step === TOTAL_STEPS ? handleSubmit() : setStep(step + 1)}
                disabled={!canProceed() || isSubmitting}
                className={`${
                  step === TOTAL_STEPS 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  step === TOTAL_STEPS ? 'Submit Work' : 'Continue →'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}