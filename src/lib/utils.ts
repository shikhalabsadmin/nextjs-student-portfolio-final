import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subjectDisplayMap } from '@/constants/subjects';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatSubject = (subject: string) => subjectDisplayMap[subject] || subject;
export const formatGrade = (grade: string | number, includePrefix = true) => 
  includePrefix ? `Grade ${grade}` : `${grade}`;
