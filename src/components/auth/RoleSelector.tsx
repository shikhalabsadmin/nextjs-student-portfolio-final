import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RoleSelectorProps {
  role: string;
  onRoleChange: (role: string) => void;
  className?: string;
}

export const RoleSelector = ({ role, onRoleChange, className = "" }: RoleSelectorProps) => {
  return (
    <div className={className}>
      <Label className="text-sm text-gray-600 mb-3 block">I am a:</Label>
      <RadioGroup
        defaultValue="student"
        value={role}
        onValueChange={onRoleChange}
        className="grid grid-cols-2 gap-4"
      >
        <div className="relative">
          <RadioGroupItem
            value="student"
            id="student"
            className="peer sr-only"
          />
          <Label
            htmlFor="student"
            className="flex p-4 border rounded-xl cursor-pointer peer-data-[state=checked]:border-[#62C59F] peer-data-[state=checked]:text-[#62C59F] hover:bg-gray-50"
          >
            Student
          </Label>
        </div>
        <div className="relative">
          <RadioGroupItem
            value="teacher"
            id="teacher"
            className="peer sr-only"
          />
          <Label
            htmlFor="teacher"
            className="flex p-4 border rounded-xl cursor-pointer peer-data-[state=checked]:border-[#62C59F] peer-data-[state=checked]:text-[#62C59F] hover:bg-gray-50"
          >
            Teacher
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};