import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight,
  ArrowUpDown, FileX, RefreshCcw, Search, ExternalLink, FileText, Plus, MoreVertical, Trash2, Edit2, Eye
} from "lucide-react";
import { useAssignmentFilters } from "@/hooks/useAssignmentFilters";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

const ITEMS_PER_PAGE = 10;
const STORAGE_KEY = 'assignment_draft';
type SortField = 'created_at' | 'title' | 'subject';

const assignmentDrafts = (supabase: any) => supabase.from('assignment_drafts') as any;

type DraftResponse = {
  data: {
    id: string;
    student_id: string;
    data: {
      title: string;
      subject: string;
      currentStep: number;
      [key: string]: any;
    };
    created_at: string;
  }[] | null;
  error: any;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-green-100 text-green-600 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      );
    case 'submitted':
      return (
        <Badge className="bg-yellow-100 text-yellow-600 hover:bg-yellow-100">
          <Clock className="mr-1 h-3 w-3" />
          Under Review
        </Badge>
      );
    case 'draft':
      return (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
          <FileText className="mr-1 h-3 w-3" />
          Draft
        </Badge>
      );
    default:
      return null;
  }
};

type Assignment = {
  id: string;
  status: string;
  title: string;
  subject: string;
  created_at: string;
  // ... other fields
};

const AssignmentCard = ({ assignment, onDelete, onAction }: { 
  assignment: Assignment;
  onDelete: (id: string) => void;
  onAction: (assignment: Assignment) => void;
}) => {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card 
      className="p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group border border-gray-200"
      onClick={() => onAction(assignment)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <h3 className="text-lg font-medium group-hover:text-blue-600 transition-colors">
            {assignment.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {assignment.subject && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                {assignment.subject}
              </Badge>
            )}
            <span>•</span>
            <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(assignment.status)}
          <DropdownMenu>
            <DropdownMenuTrigger onClick={stopPropagation} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={stopPropagation} onSelect={() => onAction(assignment)}>
                {assignment.status === 'draft' ? (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </>
                )}
              </DropdownMenuItem>
              {assignment.status === 'draft' && (
                <DropdownMenuItem 
                  onClick={stopPropagation}
                  onSelect={() => onDelete(assignment.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

const EmptyResults = ({ searchTerm, onSubmitNew }: { 
  searchTerm: string;
  onSubmitNew: () => void;
}) => (
  <div className="text-center py-12">
    <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium mb-2">
      {searchTerm 
        ? `No results found for "${searchTerm}"`
        : "No assignments yet"
      }
    </h3>
    <p className="text-gray-500 mb-4">
      {searchTerm 
        ? "Try adjusting your search terms"
        : "Start by creating your first assignment"
      }
    </p>
    {!searchTerm && (
      <Button 
        onClick={onSubmitNew}
        className="bg-[#62C59F] hover:bg-[#51b88e]"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Assignment
      </Button>
    )}
  </div>
);

export const AssignmentsList = () => {
  console.log('AssignmentsList component mounted');

  const navigate = useNavigate();
  const { status, subject, date } = useAssignmentFilters();
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('Current filters:', { status, subject, date });

  const { data: assignments, isLoading, isError, refetch } = useQuery({
    queryKey: ['assignments', status, subject, date, page, sortField, sortAsc, searchTerm],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log('Fetching assignments with search:', searchTerm);

      const { data: allAssignments, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', user.id);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Format assignments
      let formattedData = (allAssignments || []).map(assignment => ({
        id: assignment.id,
        student_id: assignment.student_id,
        title: assignment.title || 'Untitled',
        subject: assignment.subject,
        status: assignment.status || 'submitted',
        created_at: assignment.created_at,
        artifact_url: assignment.artifact_url,
        is_team_work: assignment.is_team_project,
        is_original_work: assignment.is_original_work,
        grade: assignment.grade
      }));

      // Apply filters
      let filteredData = formattedData;
      
      // Apply status filter
      if (status && status !== 'all') {
        filteredData = filteredData.filter(a => a.status === status);
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter(assignment => 
          assignment.title.toLowerCase().includes(searchLower) ||
          (assignment.subject && assignment.subject.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting
      if (sortField) {
        filteredData.sort((a, b) => {
          const aValue = a[sortField]?.toString().toLowerCase() ?? '';
          const bValue = b[sortField]?.toString().toLowerCase() ?? '';
          return sortAsc 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        });
      }

      console.log('Filtered data:', filteredData);

      return {
        data: filteredData,
        total: filteredData.length
      };
    }
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const debouncedSearch = debounce((value: string) => {
    setPage(1);
  }, 300);

  const handleAssignmentClick = (assignment: Assignment) => {
    if (assignment.status === 'draft') {
      navigate(`/app/drafts/${assignment.id}/edit`);
    } else {
      navigate(`/app/assignments/${assignment.id}`);
    }
  };

  const totalPages = Math.ceil((assignments?.total || 0) / ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)
        .eq('status', 'draft');

      if (error) {
        throw error;
      }

      // Immediately update local state
      queryClient.setQueryData(
        ['assignments', status, subject, date, page, sortField, sortAsc, searchTerm],
        (old: any) => ({
          ...old,
          data: old.data.filter((assignment: any) => assignment.id !== id),
          total: (old.total || 0) - 1
        })
      );

      // Then invalidate to refetch
      await queryClient.invalidateQueries({ 
        queryKey: ['assignments']
      });

      toast({
        title: "Draft deleted",
        description: "The draft has been permanently deleted",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    }
  };

  const handleSubmitNew = () => {
    navigate('/app/submit', { 
      replace: true,
      state: { 
        draftId: null,
        draftData: null 
      } 
    });
  };

  return (
    <div>
      {/* Search and Sort */}
      <div className="mb-4 flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assignments..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="subject">Subject</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortAsc(!sortAsc)}
          >
            <ArrowUpDown className={`h-4 w-4 transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-[100px]" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 text-center">
            <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load assignments</h3>
            <p className="text-gray-500 mb-4">There was an error loading your assignments.</p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          </Card>
        ) : !assignments?.data?.length ? (
          <Card className="p-8">
            <EmptyResults searchTerm={searchTerm} onSubmitNew={handleSubmitNew} />
          </Card>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              className="space-y-3 mb-6"
              initial={false}
            >
              {assignments.data.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AssignmentCard 
                    assignment={assignment}
                    onDelete={handleDelete}
                    onAction={handleAssignmentClick}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {assignments?.data?.length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, assignments?.total || 0)} of {assignments?.total || 0} assignments
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 