import { DashboardAssignment } from "@/types/dashboard";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { ALL_SUBJECTS, GRADE_LEVELS, GRADE_SUBJECTS, Subject, GradeLevel } from "@/constants/grade-subjects";

export const subjectTopics: Record<Subject, string[]> = {
  [ALL_SUBJECTS.MATHEMATICS]: [
    "Linear algebra basics graphs in 2d geometry",
    "Quadratic equations and their applications",
    "Introduction to trigonometry",
    "Basic calculus concepts",
    "Statistics and probability",
    "Geometry and spatial reasoning",
    "Number theory fundamentals",
    "Mathematical reasoning and proofs",
    "Algebraic expressions and equations",
    "Coordinate geometry basics"
  ],
  [ALL_SUBJECTS.SCIENCE]: [
    "Understanding Chemical Reactions",
    "Physics of Motion and Forces",
    "Human Body Systems",
    "Earth and Space Science",
    "Environmental Science Basics",
    "Light and Sound Waves",
    "Basic Electronics",
    "Chemistry in Daily Life",
    "Biology of Plants",
    "Weather and Climate"
  ],
  [ALL_SUBJECTS.ENGLISH]: [
    "Essay Writing Techniques",
    "Grammar and Punctuation",
    "Creative Writing Workshop",
    "Literature Analysis",
    "Poetry Composition",
    "Reading Comprehension",
    "Vocabulary Building",
    "Public Speaking Skills",
    "Story Writing Basics",
    "Business Communication"
  ],
  [ALL_SUBJECTS.GEOGRAPHY]: [
    "World Geography Overview",
    "Map Reading Skills",
    "Climate Zones Study",
    "Physical Geography Basics",
    "Human Geography Concepts",
    "Natural Resources",
    "Population Demographics",
    "Environmental Geography",
    "Geographic Information Systems",
    "Urban Geography"
  ],
  [ALL_SUBJECTS.HISTORY]: [
    "Ancient Civilizations",
    "Medieval History",
    "Modern World History",
    "Indian Independence Movement",
    "World War Studies",
    "Cultural History",
    "Archaeological Studies",
    "Historical Research Methods",
    "Local History Project",
    "History of Science"
  ],
  [ALL_SUBJECTS.PHYSICS]: [
    "Mechanics and Motion",
    "Energy and Work",
    "Waves and Sound",
    "Light and Optics",
    "Electricity and Magnetism"
  ],
  [ALL_SUBJECTS.CHEMISTRY]: [
    "Atomic Structure",
    "Chemical Bonding",
    "Periodic Table",
    "Chemical Reactions",
    "Acids and Bases"
  ],
  [ALL_SUBJECTS.BIOLOGY]: [
    "Cell Biology",
    "Genetics",
    "Human Physiology",
    "Ecology",
    "Evolution"
  ],
  [ALL_SUBJECTS.ENVIRONMENTAL_SCIENCE]: [
    "Ecosystems",
    "Climate Change",
    "Biodiversity",
    "Environmental Conservation",
    "Sustainable Development"
  ],
  [ALL_SUBJECTS.COMPUTER_SCIENCE]: [
    "Programming Basics",
    "Data Structures",
    "Web Development",
    "Algorithms",
    "Database Management"
  ],
  [ALL_SUBJECTS.LITERATURE]: [
    "Classic Literature",
    "Contemporary Fiction",
    "Poetry Analysis",
    "Drama Studies",
    "Literary Criticism"
  ],
  [ALL_SUBJECTS.LANGUAGE_ARTS]: [
    "Writing Skills",
    "Reading Comprehension",
    "Grammar and Usage",
    "Vocabulary Development",
    "Communication Skills"
  ],
  [ALL_SUBJECTS.ALGEBRA]: [
    "Linear Equations",
    "Quadratic Functions",
    "Systems of Equations",
    "Polynomials",
    "Rational Expressions"
  ],
  [ALL_SUBJECTS.GEOMETRY]: [
    "Plane Geometry",
    "Solid Geometry",
    "Trigonometry",
    "Coordinate Geometry",
    "Geometric Proofs"
  ],
  [ALL_SUBJECTS.STATISTICS]: [
    "Descriptive Statistics",
    "Probability",
    "Inferential Statistics",
    "Data Analysis",
    "Statistical Methods"
  ],
  [ALL_SUBJECTS.CIVICS]: [
    "Government Systems",
    "Citizenship",
    "Democracy",
    "Rights and Duties",
    "Political Science"
  ],
  [ALL_SUBJECTS.SOCIAL_STUDIES]: [
    "Society and Culture",
    "Economics",
    "Political Systems",
    "World Geography",
    "Current Events"
  ]
};

export function generateAssignments(): DashboardAssignment[] {
  const assignments: DashboardAssignment[] = [];
  let id = 1;

  // Generate assignments for each grade
  Object.values(GRADE_LEVELS).forEach((grade) => {
    // Get subjects available for this grade
    const gradeSubjects = GRADE_SUBJECTS[grade];

    // Generate assignments for each subject in this grade
    gradeSubjects.forEach(subject => {
      const topics = subjectTopics[subject] || [];
      topics.forEach(topic => {
        // Generate 1-2 assignments per topic with different statuses
        const numAssignments = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numAssignments; i++) {
          // Generate a random date within the next 30 days
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(Math.random() * 30));
          const formattedDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const status = Object.values(ASSIGNMENT_STATUS)[
            Math.floor(Math.random() * Object.values(ASSIGNMENT_STATUS).length)
          ];

          assignments.push({
            id: id++,
            title: topic,
            subject: subject,
            grade: grade,
            dueDate: formattedDate,
            status,
            imageUrl: "/images/chalkboard-math.jpg"
          });
        }
      });
    });
  });

  return assignments;
} 