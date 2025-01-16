export const subjectDisplayMap: Record<string, string> = {
  'math': 'Mathematics',
  'sci': 'Science',
  'eng': 'English',
  'hist': 'History',
  'geo': 'Geography',
  'art': 'Art',
  'business': 'Business',
  'cs': 'Computer Science',
  'counseling': 'Counseling',
  'gp': 'Global Perspectives',
  'hindi': 'Hindi',
  'library': 'Library',
  'marathi': 'Marathi',
  'pe': 'Physical Education',
  'chem': 'Chemistry',
  'phy': 'Physics',
  'selc': 'SELC'
};

export const subjects = Object.entries(subjectDisplayMap).map(([value, label]) => ({
  label,
  value
})); 