import SCHOOL_OPTIONS from "./student_profile_school_options";

// Default bio for new students
export const DEFAULT_STUDENT_BIO = "Hi! I'm a passionate student who loves learning new things every day. I enjoy exploring different subjects, working on creative projects, and collaborating with my classmates. I'm excited to showcase my learning journey and share the amazing work I've been doing at school. Always ready for new challenges and opportunities to grow!";

// Default school for new students (first option from school list)
export const DEFAULT_STUDENT_SCHOOL = SCHOOL_OPTIONS[0]; // "Shikha Academy"

// Export both as a single object for convenience
export const STUDENT_PROFILE_DEFAULTS = {
  bio: DEFAULT_STUDENT_BIO,
  school: DEFAULT_STUDENT_SCHOOL,
} as const; 