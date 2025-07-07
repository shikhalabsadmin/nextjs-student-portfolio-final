// Define the type for a skill
export type Skill = {
  id: string;
  name: string;
  description?: string;
};

export const SKILLS: Skill[] = [
  { 
    id: "motivation", 
    name: "Motivation",
    description: "The excitement that makes you want to start and finish your work, like when you're super eager to complete a drawing."
  },
  { 
    id: "intellect", 
    name: "Intellect",
    description: "Using your brain to solve tricky problems, like figuring out how to build the tallest tower with blocks."
  },
  { 
    id: "diligence", 
    name: "Diligence",
    description: "Sticking with your work even when it gets hard, like practicing writing your letters over and over until they look just right."
  },
  { 
    id: "emotionality", 
    name: "Emotionality",
    description: "Understanding your feelings and others' feelings while working, like being patient when your art doesn't turn out perfect."
  },
  { 
    id: "sociability", 
    name: "Sociability",
    description: "Working well with friends and teachers, like sharing materials, taking turns, and listening to others' ideas."
  },
  { id: "critical-thinking", name: "Critical Thinking" },
  { id: "creativity", name: "Creativity" },
  { id: "problem-solving", name: "Problem Solving" },
  { id: "communication", name: "Communication" },
  { id: "collaboration", name: "Collaboration" },
  { id: "research", name: "Research" },
  { id: "analysis", name: "Analysis" },
  { id: "planning", name: "Planning" },
  { id: "organization", name: "Organization" },
  { id: "leadership", name: "Leadership" },
  { id: "time-management", name: "Time Management" },
  { id: "adaptability", name: "Adaptability" },
  { id: "innovation", name: "Innovation" },
  { id: "technical-skills", name: "Technical Skills" },
  { id: "presentation", name: "Presentation" },
]; 