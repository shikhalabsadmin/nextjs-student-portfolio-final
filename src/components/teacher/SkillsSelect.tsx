import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SKILLS } from "@/constants";

interface SkillsSelectProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export const SkillsSelect = ({
  selectedSkills,
  onSkillsChange,
}: SkillsSelectProps) => {
  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      onSkillsChange(selectedSkills.filter(id => id !== skillId));
    } else {
      onSkillsChange([...selectedSkills, skillId]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Select the skills that were demonstrated in this assignment
      </p>

      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="grid grid-cols-2 gap-2">
          {SKILLS.map((skill) => (
            <Badge
              key={skill.id}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                selectedSkills.includes(skill.id)
                  ? 'bg-[#62C59F] text-white hover:bg-[#62C59F]/90'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => toggleSkill(skill.id)}
            >
              {skill.name}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}; 