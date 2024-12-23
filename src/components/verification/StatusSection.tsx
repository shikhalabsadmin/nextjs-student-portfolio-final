import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface StatusSectionProps {
  status: "approved" | "rejected" | "pending";
  setStatus: (status: "approved" | "rejected" | "pending") => void;
}

export const StatusSection = ({ status, setStatus }: StatusSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Verification Status</h3>
      <RadioGroup
        value={status}
        onValueChange={(value: "approved" | "rejected" | "pending") => setStatus(value)}
        className="grid grid-cols-3 gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="approved" id="approved" className="text-[#62C59F]" />
          <Label 
            htmlFor="approved"
            className="cursor-pointer rounded-lg p-2 hover:bg-gray-50"
          >
            Approve
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="rejected" id="rejected" className="text-red-500" />
          <Label 
            htmlFor="rejected"
            className="cursor-pointer rounded-lg p-2 hover:bg-gray-50"
          >
            Reject
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pending" id="pending" className="text-yellow-500" />
          <Label 
            htmlFor="pending"
            className="cursor-pointer rounded-lg p-2 hover:bg-gray-50"
          >
            Pending
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};