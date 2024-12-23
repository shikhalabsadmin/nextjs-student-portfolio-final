import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SkillsSectionProps {
  skills: { id: string; name: string }[];
  studentSkills: string[];
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
}

export const SkillsSection = ({
  skills,
  studentSkills,
  selectedSkills,
  setSelectedSkills,
}: SkillsSectionProps) => {
  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Verified Skills</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select the skills that were demonstrated in this assignment
        </p>
      </div>

      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="grid grid-cols-2 gap-2">
          {skills.map((skill) => (
            <Badge
              key={skill.id}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                selectedSkills.includes(skill.id)
                  ? 'bg-[#62C59F] text-white hover:bg-[#62C59F]/90'
                  : 'hover:bg-gray-100'
              } ${
                studentSkills.includes(skill.id)
                  ? 'border-[#62C59F]'
                  : ''
              }`}
              onClick={() => toggleSkill(skill.id)}
            >
              {skill.name}
              {studentSkills.includes(skill.id) && ' (claimed)'}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};