export type Grade = '7' | '8' | '9' | '10' | '11' | '12' | null;

export interface Profile {
  id: string;
  role: 'student' | 'teacher';
  grade: Grade;
  // ... other fields
} 