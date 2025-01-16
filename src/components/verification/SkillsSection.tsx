import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SKILLS } from "@/lib/constants";

interface SkillsSectionProps {
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
}

export const SkillsSection = ({
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
        <h3 className="text-sm font-medium text-gray-900 mb-2">Skills Used</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select the skills you demonstrated in this assignment
        </p>
      </div>

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