import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PencilIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  ASSIGNMENT_STATUS,
  STATUS_COLORS,
  STATUS_DISPLAY_NAMES,
  AssignmentStatus,
} from "@/constants/assignment-status";

// Types based on the data structure in the image
export interface Artifact {
  id: string | number;
  name: string;
  subject: string;
  studentName: string;
  studentImage?: string;
  class: string;
  grade: string;
  status: AssignmentStatus;
  created: string;
  lastUpdated: string;
}

interface ArtifactTableProps {
  artifacts: Artifact[];
  onRowClick?: (artifact: Artifact) => void;
}


export const ArtifactTable = memo(
  ({ artifacts, onRowClick }: ArtifactTableProps) => {
    return (
      <div className="border rounded-[6px] overflow-hidden bg-white w-full">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] border-b border-[#E4E7EB] text-xs font-medium text-[#475467]">
                <TableHead className="whitespace-nowrap">
                  Artifact Name
                </TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">
                  Subject
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  Student Name
                </TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">
                  Class
                </TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell">
                  Created
                </TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell">
                  Last updated
                </TableHead>
                <TableHead className="w-[40px] py-3">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artifacts.map((artifact) => (
                <TableRow
                  key={String(artifact.id)}
                  className="cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => onRowClick?.(artifact)}
                >
                  <TableCell className="font-medium text-sm py-4 whitespace-nowrap">
                    {artifact.name}
                  </TableCell>
                  <TableCell className="text-sm py-4 whitespace-nowrap hidden md:table-cell">
                    {artifact.subject}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      {artifact.studentName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-4 whitespace-nowrap hidden sm:table-cell">
                    {artifact.class}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <Badge
                      className={cn(
                        "font-normal text-xs py-0.5 px-2 rounded-[15px]",
                        STATUS_COLORS[artifact.status]
                      )}
                    >
                      {STATUS_DISPLAY_NAMES[artifact.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm py-4 whitespace-nowrap hidden lg:table-cell">
                    {artifact.created}
                  </TableCell>
                  <TableCell className="text-sm py-4 whitespace-nowrap hidden lg:table-cell">
                    {artifact.lastUpdated}
                  </TableCell>
                  <TableCell className="py-4">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.(artifact);
                        // Handle edit action
                      }}
                    >
                      <PencilIcon className="size-5 text-[#475467]" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
);

ArtifactTable.displayName = "ArtifactTable";
