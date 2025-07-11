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
import { PencilIcon, CopyIcon } from "lucide-react";
import { cn, formatSubject } from "@/lib/utils";
import {
  ASSIGNMENT_STATUS,
  STATUS_COLORS,
  STATUS_DISPLAY_NAMES,
  AssignmentStatus,
} from "@/constants/assignment-status";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES } from "@/config/routes";
import { useIsMobile } from "@/hooks/use-mobile";

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
  student_id?: string;
}

interface ArtifactTableProps {
  artifacts: Artifact[];
  onRowClick?: (artifact: Artifact) => void;
  isLoading?: boolean;
  searchQuery?: string;
}

export const ArtifactTable = memo(
  ({
    artifacts,
    onRowClick,
    isLoading = false,
    searchQuery = "",
  }: ArtifactTableProps) => {
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const handleCopyLink = async (e: React.MouseEvent, artifact: Artifact) => {
      e.stopPropagation();
      
      // Create the assignment detail URL using the routes configuration
      const assignmentUrl = `${window.location.origin}${ROUTES.ASSIGNMENT.DETAIL.replace(':id', String(artifact.id))}`;
      
      try {
        await navigator.clipboard.writeText(assignmentUrl);
        toast({
          title: "Link copied!",
          description: "Assignment link copied to clipboard",
          duration: 3000,
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
          duration: 3000,
        });
      }
    };

    if (artifacts.length === 0) {
      return null;
    }

    // Mobile card view
    if (isMobile) {
      return (
        <div className="space-y-3">
          {artifacts.map((artifact) => (
            <div 
              key={String(artifact.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer"
              onClick={() => onRowClick?.(artifact)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-slate-900 text-sm">{artifact.name}</h3>
                <Badge
                  className={cn(
                    "font-normal text-xs py-0.5 px-2 rounded-[15px]",
                    STATUS_COLORS[artifact.status]
                  )}
                >
                  {STATUS_DISPLAY_NAMES[artifact.status]}
                </Badge>
              </div>
              
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Student:</span> {artifact.studentName}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Subject:</span> {formatSubject(artifact.subject)}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Class:</span> {artifact.class}
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Last updated: {artifact.lastUpdated}</span>
                <div className="flex gap-1">
                  {artifact.status === ASSIGNMENT_STATUS.APPROVED && (
                    <button
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={(e) => handleCopyLink(e, artifact)}
                      aria-label={`Copy link for ${artifact.name}`}
                    >
                      <CopyIcon className="size-4 text-[#475467]" />
                    </button>
                  )}
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick?.(artifact);
                    }}
                    aria-label={`Edit ${artifact.name}`}
                  >
                    <PencilIcon className="size-4 text-[#475467]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Desktop table view
    return (
      <div
        className="border rounded-[6px] overflow-hidden bg-white w-full"
        role="region"
        aria-label="Artifacts table"
      >
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] border-b border-[#E4E7EB] text-xs font-medium text-[#475467]">
                <TableHead className="whitespace-nowrap px-6 py-3">
                  Artifact Name
                </TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell px-6 py-3">
                  Subject
                </TableHead>
                <TableHead className="whitespace-nowrap px-6 py-3">
                  Student Name
                </TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell px-6 py-3">
                  Class
                </TableHead>
                <TableHead className="whitespace-nowrap px-6 py-3">
                  Status
                </TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell px-6 py-3">
                  Created
                </TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell px-6 py-3">
                  Last updated
                </TableHead>
                <TableHead className="w-[80px] px-6 py-3 text-right">
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
                  <TableCell className="font-medium text-slate-900 text-sm py-4 px-6 whitespace-nowrap">
                    {artifact.name}
                  </TableCell>
                  <TableCell className="text-sm py-4 font-normal text-slate-900 whitespace-nowrap hidden md:table-cell px-6">
                    {formatSubject(artifact.subject)}
                  </TableCell>
                  <TableCell className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-[#475467] font-normal">
                      {artifact.studentName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-4 font-normal text-slate-900 whitespace-nowrap hidden sm:table-cell px-6">
                    {artifact.class}
                  </TableCell>
                  <TableCell className="py-4 px-6 whitespace-nowrap">
                    <Badge
                      className={cn(
                        "font-normal text-xs py-0.5 px-2 rounded-[15px]",
                        STATUS_COLORS[artifact.status]
                      )}
                    >
                      {STATUS_DISPLAY_NAMES[artifact.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm py-4 font-normal text-slate-900 whitespace-nowrap hidden lg:table-cell px-6">
                    {artifact.created}
                  </TableCell>
                  <TableCell className="text-sm py-4 font-normal text-slate-900 whitespace-nowrap hidden lg:table-cell px-6">
                    {artifact.lastUpdated}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        {artifact.status === ASSIGNMENT_STATUS.APPROVED && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                onClick={(e) => handleCopyLink(e, artifact)}
                                aria-label={`Copy link for ${artifact.name}`}
                              >
                                <CopyIcon className="size-5 text-[#475467]" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy artifact link</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRowClick?.(artifact);
                              }}
                              aria-label={`Edit ${artifact.name}`}
                            >
                              <PencilIcon className="size-5 text-[#475467]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit artifact</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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
