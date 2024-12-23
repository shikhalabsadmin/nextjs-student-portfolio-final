export interface Question {
  id?: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  condition?: (answers: Record<string, any>) => boolean;
}

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: "title",
    label: "What is the title of your work?",
    type: "text",
    required: true
  },
  {
    id: "type",
    label: "What type of work is this?",
    type: "select",
    options: ["Project", "Essay", "Model", "Performance", "Presentation", "Other"],
    required: true
  },
  {
    id: "subject",
    label: "Which subject does this work relate to?",
    type: "select",
    options: ["Mathematics", "Science", "English", "History", "Art", "Music", "Physical Education", "Other"],
    required: true
  },
  {
    id: "month",
    label: "When did you complete this work?",
    type: "select",
    options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    required: true
  },
  {
    id: "is_team_project",
    label: "Did you collaborate with a team on this?",
    type: "boolean",
    required: true
  },
  {
    id: "team_description",
    label: "Tell us about your role and experience in the team",
    type: "richtext",
    hint: "What responsibilities did you take on? How did you work with others?",
    condition: (answers) => answers.is_team_project === true
  },
  {
    id: "is_original_work",
    label: "Did you create something new or original?",
    type: "boolean",
    required: true
  },
  {
    id: "originality_description",
    label: "Explain what was new or original about your work",
    type: "richtext",
    hint: "What aspects were innovative? What inspired your originality?",
    condition: (answers) => answers.is_original_work === true
  },
  {
    id: "description",
    label: "Describe your work and why you're proud of it",
    type: "richtext",
    required: true
  },
  {
    id: "artifact",
    label: "Upload your work",
    type: "file",
    required: true,
    hint: "Upload the final version of your work (PDF, image, or video)"
  }
];