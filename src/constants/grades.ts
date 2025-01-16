// Helper function to generate grade sections
const generateGradeSections = (grade: string | number, sections: string[]) => 
  sections.map(section => ({
    label: `${grade}${section}`,
    value: `${grade}${section}`
  }));

export const grades = [
  { label: 'Sr.KG A', value: 'Sr.KG A' },
  { label: 'Sr.KG B', value: 'Sr.KG B' },
  { label: 'Sr.KG C', value: 'Sr.KG C' },
  ...generateGradeSections(1, ['A', 'B', 'C']),
  ...generateGradeSections(2, ['A', 'B', 'C', 'D']),
  ...generateGradeSections(3, ['A', 'B', 'C']),
  { label: 'Grade 4', value: '4' },
  ...generateGradeSections(5, ['A', 'B']),
  { label: 'Grade 6', value: '6' },
  { label: 'Grade 7', value: '7' },
  { label: 'Grade 8', value: '8' },
  { label: 'Grade 9', value: '9' },
  { label: 'AS', value: 'AS' }
]; 