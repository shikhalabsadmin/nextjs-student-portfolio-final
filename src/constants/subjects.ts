export const subjectDisplayMap: Record<string, string> = {
  'math': 'Math',
  'sci': 'Science',
  'eng': 'English',
  'hindi': 'Hindi',
  'marathi': 'Marathi',
  'gp': 'GP',
  'cs': 'CS',
  'art': 'Art',
  'bee': 'BEE',
  'phy': 'Physics',
  'chem': 'Chemistry',
  'design_tech': 'Design and Tech',
  'media_studies': 'Media Studies',
  'travel_tourism': 'Travel and Tourism',
  'business': 'Business',
  'enterprise': 'Enterprise',
  'humanities': 'Humanities',
  // Keep additional subjects for backward compatibility
  'hist': 'History',
  'geo': 'Geography',
  'counseling': 'Counseling',
  'library': 'Library',
  'pe': 'Physical Education',
  'selc': 'SELC'
};

export const subjects = Object.entries(subjectDisplayMap).map(([value, label]) => ({
  label,
  value
})); 