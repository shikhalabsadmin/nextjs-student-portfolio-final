import { create } from 'zustand';

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'NEEDS_REVISION', label: 'Needs Revision' }
] as const;

type Status = typeof STATUS_OPTIONS[number]['value'];

interface AssignmentFiltersState {
  status: Status;
  setStatus: (status: Status) => void;
  subject: string;
  setSubject: (subject: string) => void;
}

export const useAssignmentFilters = create<AssignmentFiltersState>((set) => ({
  status: 'all',
  setStatus: (status) => set({ status }),
  subject: 'all',
  setSubject: (subject) => set({ subject })
})); 