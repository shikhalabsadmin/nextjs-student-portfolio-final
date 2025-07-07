export interface Question {
  id?: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  followUpQuestions?: string[];
  condition?: (answers: Record<string, any>) => boolean;
  step?: number;
  multiple?: boolean;
  maxWords?: number;
}

export const INITIAL_QUESTIONS: Question[] = [
  // Step 1: Basic Information
  {
    id: "title",
    label: "Artifact Name",
    type: "text",
    required: true,
    step: 1
  },
  {
    id: "artifact_type",
    label: "Artifact Type",
    type: "select",
    options: ["Project", "Essay", "Model", "Performance", "Presentation", "Other"],
    required: true,
    hint: "Select the format of your work",
    step: 1
  },
  {
    id: "month",
    label: "Month",
    type: "select",
    options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    required: true,
    step: 1
  },
  {
    id: "subject",
    label: "Subject",
    type: "select",
    options: ["Mathematics", "Science", "English", "History", "Art", "Music", "Physical Education", "Other"],
    required: true,
    step: 1
  },
  {
    id: "artifact",
    label: "Upload your work",
    type: "file",
    required: true,
    hint: "Upload your files (documents, images, videos, etc.)",
    step: 1
  },

  // Step 2: Collaboration and Originality
  {
    id: "is_team_work",
    label: "Is this a team project?",
    type: "boolean",
    required: true,
    hint: "Let us know if you worked with others on this",
    step: 2
  },
  {
    id: "team_contribution",
    label: "Describe your role and experience",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "What specific responsibilities did you take on in the group?",
      "How did you work with others?",
      "Did you face challenges in communication or teamwork?",
      "How did you resolve them?"
    ],
    condition: (answers) => answers.is_team_work === true,
    step: 2
  },
  {
    id: "is_original_work",
    label: "Did you create something new or original?",
    type: "boolean",
    required: true,
    step: 2
  },
  {
    id: "originality_explanation",
    label: "Explain what was new",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "What aspects of your work were innovative?",
      "Was it an idea, a method, or the way you presented it?",
      "Reflect on what inspired your originality and how you ensured it was meaningful."
    ],
    condition: (answers) => answers.is_original_work === true,
    step: 2
  },

  // Step 3: Skills and Pride
  {
    id: "selected_skills",
    label: "What skills did you practice? Select Top 3",
    type: "select",
    options: [
      "Motivation",
      "Intellect",
      "Diligence",
      "Emotionality",
      "Sociability"
    ],
    required: true,
    multiple: true,
    step: 3
  },
  {
    id: "skills_justification",
    label: "Justify the selected skills",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "How did each skill contribute to the creation of the artifact?",
      "What actions, decisions, or moments during the process demonstrated these skills?"
    ],
    required: true,
    step: 3
  },
  {
    id: "pride_reason",
    label: "Why are you proud of this artifact?",
    type: "textarea",
    required: true,
    maxWords: 2000,
    followUpQuestions: [
      "What makes this work special to you?",
      "What aspects of your work do you feel particularly proud of?",
      "How does this work represent your growth or achievement?"
    ],
    step: 3
  },

  // Step 4: Process, Learning, and Reflection
  {
    id: "creation_process",
    label: "Describe the process you used to create it",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "Planning: Did you use any strategies or tools to plan your work?",
      "Execution: How did you approach each stage of the work?",
      "Reflection: How did you ensure the quality of their work along the way?"
    ],
    required: true,
    step: 4
  },
  {
    id: "learnings",
    label: "Your learnings and future applications",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "What subject knowledge or skills did you acquire?",
      "How might you apply these lessons to future tasks or real-life situations?"
    ],
    required: true,
    step: 4
  },
  {
    id: "challenges",
    label: "Your challenges",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "What type of challenges did you face?",
      "How did you overcome these challenges?"
    ],
    required: true,
    step: 4
  },
  {
    id: "improvements",
    label: "Your improvements",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "How did you improve their skills, mindset, or understanding through this work?"
    ],
    required: true,
    step: 4
  },
  {
    id: "acknowledgments",
    label: "Your thanks",
    type: "textarea",
    maxWords: 2000,
    followUpQuestions: [
      "Did teammates, teachers, or peers help them in the process?",
      "Cite any academic resources you used."
    ],
    required: true,
    step: 4
  }
];