import { create } from 'zustand';

interface FiltersState {
  status: string;
  subject: string;
  date: Date | null;
  setStatus: (status: string) => void;
  setSubject: (subject: string) => void;
  setDate: (date: Date | null) => void;
  resetFilters: () => void;
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'submitted', label: 'Under Review' },
  { value: 'verified', label: 'Verified' }
] as const;

export const useAssignmentFilters = create<FiltersState>((set) => ({
  status: 'all',
  subject: 'all',
  date: null,
  setStatus: (status) => set({ status }),
  setSubject: (subject) => set({ subject }),
  setDate: (date) => set({ date }),
  resetFilters: () => set({ status: 'all', subject: 'all', date: null })
})); 